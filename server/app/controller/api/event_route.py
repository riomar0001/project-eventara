"""Event management API routes.

Exposes endpoints for creating and updating events together with their session
graphs.  Authentication is required; no RBAC feature gate is applied so any
verified user may create or update their own events.

Error mapping summary:
  - 400  date or business-rule constraint violated (event or session dates)
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event creator (update only)
  - 404  event, session, or venue not found
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_dto import CreateEventInput, CreateEventSessionInput, UpdateEventInput, UpdateEventSessionInput
from app.application.use_cases.audit_log_usecase import CreateAuditLogUseCase
from app.application.use_cases.event_usecase import CreateEventUseCase, UpdateEventUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event, serialize_event_sessions
from app.controller.dependencies import get_create_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_create_event_use_case, get_update_event_use_case
from app.controller.docs.event_docs import (
    EVENT_DATE_INVALID,
    EVENT_NOT_FOUND,
    EVENT_UNAUTHORIZED_OPERATION,
    EVENT_UPDATE_NOT_FOUND,
    EVENT_VALIDATION_ERROR,
    UNAUTHORIZED,
)
from app.controller.schemas.event_schema import (
    EventCreateRequest,
    EventRecordResponse,
    EventSessionRecordResponse,
    EventUpdatedResponse,
    EventUpdateRequest,
    EventWithSessionsResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import Event as EventEntity, EventSession as EventSessionEntity
from app.domain.exceptions.event_exceptions import (
    EventDateValidationError,
    EventNotFoundError,
    EventValidationError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
    EventSessionNotFoundError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError

event_router = APIRouter(prefix="/events", tags=["Events"])


def _to_event_response(event: EventEntity) -> EventRecordResponse:
    return EventRecordResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        status=event.status.value if hasattr(event.status, "value") else event.status,
        created_by=event.created_by,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


def _to_session_response(session: EventSessionEntity) -> EventSessionRecordResponse:
    return EventSessionRecordResponse(
        id=session.id,
        event_id=session.event_id,
        venue_id=session.venue_id,
        title=session.title,
        description=session.description,
        start_datetime=session.start_datetime,
        end_datetime=session.end_datetime,
        status=session.status.value if hasattr(session.status, "value") else session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@event_router.post(
    "",
    response_model=EventWithSessionsResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **EVENT_NOT_FOUND, **EVENT_DATE_INVALID, **EVENT_VALIDATION_ERROR},
    summary="Create a new event with sessions",
    description=(
        "Creates an event and its associated sessions atomically. "
        "At least one session is required. "
        "Session date windows must fall within the event date range. "
        "The event description accepts raw HTML produced by a WYSIWYG editor."
    ),
)
async def create_event(
    request: Request,
    body: EventCreateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: CreateEventUseCase = Depends(get_create_event_use_case),
    audit_use_case: CreateAuditLogUseCase = Depends(get_create_audit_log_use_case),
) -> EventWithSessionsResponse:
    """Create an event together with all initial sessions in one transaction.

    Validates temporal constraints (event and session date windows), checks that
    every referenced venue exists, then persists the full graph atomically.

    Args:
        request:       The incoming HTTP request (used for audit metadata).
        body:          Validated request payload containing event fields and sessions.
        user_id:       UUID of the authenticated caller extracted from the Bearer token.
        use_case:      Injected ``CreateEventUseCase`` for this request.
        audit_use_case: Injected ``CreateAuditLogUseCase`` for fire-and-forget logging.

    Returns:
        ``EventWithSessionsResponse`` with the created event and session records.

    Raises:
        HTTPException 400: Date or business-rule constraint violated.
        HTTPException 401: Missing or invalid Bearer token.
        HTTPException 404: A session references a non-existent venue.
    """
    session_inputs = [
        CreateEventSessionInput(
            venue_id=s.venue_id,
            title=s.title,
            description=s.description,
            start_datetime=s.start_datetime,
            end_datetime=s.end_datetime,
        )
        for s in body.sessions
    ]

    try:
        result = await use_case.execute(
            CreateEventInput(
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
                created_by=user_id,
                sessions=session_inputs,
            )
        )
    except (EventDateValidationError, EventValidationError, InvalidEventSessionDateError, EventSessionExceedsEventBoundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        new_values={
            **serialize_event(result.event),
            "sessions": serialize_event_sessions(result.sessions),
        },
        additional_context={"session_count": len(result.sessions)},
    )

    return EventWithSessionsResponse(
        data=_to_event_response(result.event),
        sessions=[_to_session_response(s) for s in result.sessions],
    )


@event_router.put(
    "/{event_id}",
    response_model=EventUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_UPDATE_NOT_FOUND,
        **EVENT_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update an event and synchronise its sessions",
    description=(
        "Replaces an event's fields and fully synchronises its session list. "
        "Sessions with an ``id`` are updated in place; sessions without an ``id`` are created; "
        "sessions that existed before but are absent from the request are deleted. "
        "Only the event creator may perform this operation. "
        "All session date windows must fall within the updated event date range."
    ),
)
async def update_event(
    request: Request,
    event_id: uuid.UUID,
    body: EventUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: UpdateEventUseCase = Depends(get_update_event_use_case),
    audit_use_case: CreateAuditLogUseCase = Depends(get_create_audit_log_use_case),
) -> EventUpdatedResponse:
    """Update an event and synchronise its sessions in a single atomic transaction.

    Locks the event row before validation so concurrent update requests on the
    same event are serialised.  Validates ownership, date constraints, session
    membership, and venue existence before applying any mutations.

    Args:
        request:        The incoming HTTP request (used for audit metadata).
        event_id:       UUID of the event to update, taken from the path.
        body:           Validated request payload with updated event fields and sessions.
        user_id:        UUID of the authenticated caller extracted from the Bearer token.
        use_case:       Injected ``UpdateEventUseCase`` for this request.
        audit_use_case: Injected ``CreateAuditLogUseCase`` for fire-and-forget logging.

    Returns:
        ``EventUpdatedResponse`` with the updated event and resulting session records.

    Raises:
        HTTPException 400: Date or business-rule constraint violated.
        HTTPException 401: Missing or invalid Bearer token.
        HTTPException 403: Caller is not the event creator.
        HTTPException 404: Event, session reference, or venue not found.
    """
    session_inputs = [
        UpdateEventSessionInput(
            id=s.id,
            venue_id=s.venue_id,
            title=s.title,
            description=s.description,
            start_datetime=s.start_datetime,
            end_datetime=s.end_datetime,
        )
        for s in body.sessions
    ]

    try:
        result = await use_case.execute(
            UpdateEventInput(
                event_id=event_id,
                updated_by=user_id,
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
                sessions=session_inputs,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (EventSessionNotFoundError, VenueNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (EventDateValidationError, EventValidationError, InvalidEventSessionDateError, EventSessionExceedsEventBoundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values={
            **serialize_event(result.old_event),
            "sessions": serialize_event_sessions(result.old_sessions),
        },
        new_values={
            **serialize_event(result.event),
            "sessions": serialize_event_sessions(result.sessions),
        },
        additional_context={
            "session_count": len(result.sessions),
            "sessions_deleted": len(result.old_sessions) - sum(1 for s in result.old_sessions if any(n.id == s.id for n in result.sessions if n.id)),
        },
    )

    return EventUpdatedResponse(
        data=_to_event_response(result.event),
        sessions=[_to_session_response(s) for s in result.sessions],
    )
