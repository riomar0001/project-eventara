"""Event management API routes.

Exposes a single creation endpoint that persists an event together with all of
its sessions atomically.  Authentication is required; no RBAC feature gate is
applied so any verified user may create an event.

Error mapping summary:
  - 400  date or business-rule constraint violated (event or session dates)
  - 401  missing, expired, or invalid Bearer token
  - 404  a session references a venue that does not exist
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_dto import CreateEventInput, CreateEventSessionInput
from app.application.use_cases.audit_log_usecase import CreateAuditLogUseCase
from app.application.use_cases.event_usecase import CreateEventUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event, serialize_event_sessions
from app.controller.dependencies import get_create_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_create_event_use_case
from app.controller.docs.event_docs import EVENT_DATE_INVALID, EVENT_NOT_FOUND, EVENT_VALIDATION_ERROR, UNAUTHORIZED
from app.controller.schemas.event_schema import (
    EventCreateRequest,
    EventRecordResponse,
    EventSessionRecordResponse,
    EventWithSessionsResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import Event as EventEntity, EventSession as EventSessionEntity
from app.domain.exceptions.event_exceptions import EventDateValidationError, EventValidationError
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
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
