"""Event management API routes.

Exposes endpoints for creating events, updating event metadata, updating
individual event sessions, and manually transitioning event or session statuses.
Authentication is required; no RBAC feature gate is applied so any verified
user may create or update their own events.

Error mapping summary:
  - 400  date, business-rule, or invalid status transition constraint violated
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event creator (update only)
  - 404  event, session, or venue not found
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_dto import (
    CreateEventInput,
    CreateEventSessionInput,
    UpdateEventMetadataInput,
    UpdateEventSessionInput,
)
from app.application.dto.event_status_dto import UpdateEventSessionStatusInput, UpdateEventStatusInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_status_usecase import EventStatusUseCase
from app.application.use_cases.event_usecase import EventUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event, serialize_event_sessions
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_event_status_use_case, get_event_use_case
from app.controller.docs.event_docs import (
    EVENT_DATE_INVALID,
    EVENT_METADATA_DATE_INVALID,
    EVENT_METADATA_NOT_FOUND,
    EVENT_NOT_FOUND,
    EVENT_SESSION_DATE_INVALID,
    EVENT_SESSION_NOT_FOUND,
    EVENT_SESSION_STATUS_INVALID_TRANSITION,
    EVENT_STATUS_INVALID_TRANSITION,
    EVENT_UNAUTHORIZED_OPERATION,
    EVENT_VALIDATION_ERROR,
    UNAUTHORIZED,
)
from app.controller.schemas.event_schema import (
    EventCreateRequest,
    EventMetadataUpdatedResponse,
    EventRecordResponse,
    EventSessionRecordResponse,
    EventSessionStatusUpdatedResponse,
    EventSessionStatusUpdateRequest,
    EventSessionUpdatedResponse,
    EventSessionUpdateRequest,
    EventStatusUpdatedResponse,
    EventStatusUpdateRequest,
    EventUpdateRequest,
    EventWithSessionsResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import Event as EventEntity
from app.domain.entities.event_entity import EventSession as EventSessionEntity
from app.domain.exceptions.event_exceptions import (
    EventDateValidationError,
    EventNotFoundError,
    EventStatusTransitionError,
    EventValidationError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
    EventSessionNotFoundError,
    EventSessionStatusTransitionError,
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
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventWithSessionsResponse:
    """Create an event together with all initial sessions in one transaction."""
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
        result = await use_case.create_event(
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


@event_router.patch(
    "/{event_id}",
    response_model=EventMetadataUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_METADATA_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event metadata",
    description=(
        "Updates an event's title, description, and date range. "
        "Only the event creator may perform this operation. "
        "The event description accepts raw HTML produced by a WYSIWYG editor."
    ),
)
async def update_event_metadata(
    request: Request,
    event_id: uuid.UUID,
    body: EventUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventMetadataUpdatedResponse:
    """Update an event's metadata fields in a single atomic transaction."""
    try:
        result = await use_case.update_event_metadata(
            UpdateEventMetadataInput(
                event_id=event_id,
                updated_by=user_id,
                title=body.title,
                description=body.description,
                start_date=body.start_date,
                end_date=body.end_date,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventDateValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.old_event),
        new_values=serialize_event(result.event),
    )

    return EventMetadataUpdatedResponse(data=_to_event_response(result.event))


@event_router.patch(
    "/{event_id}/session/{session_id}",
    response_model=EventSessionUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_DATE_INVALID,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update an event session",
    description=(
        "Updates a single event session by its ID. "
        "Only the creator of the parent event may perform this operation. "
        "The session date window must fall within the parent event's date range."
    ),
)
async def update_event_session(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    body: EventSessionUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventUseCase = Depends(get_event_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionUpdatedResponse:
    """Update an event session's fields in a single atomic transaction."""
    try:
        result = await use_case.update_event_session(
            UpdateEventSessionInput(
                session_id=session_id,
                updated_by=user_id,
                venue_id=body.venue_id,
                title=body.title,
                description=body.description,
                start_datetime=body.start_datetime,
                end_datetime=body.end_datetime,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventSessionNotFoundError, VenueNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (InvalidEventSessionDateError, EventSessionExceedsEventBoundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.old_session])[0],
        new_values=serialize_event_sessions([result.session])[0],
    )

    return EventSessionUpdatedResponse(data=_to_session_response(result.session))


@event_router.patch(
    "/{event_id}/status",
    response_model=EventStatusUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_METADATA_NOT_FOUND,
        **EVENT_STATUS_INVALID_TRANSITION,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event status",
    description=(
        "Manually transitions an event to a new status. "
        "Only the event creator may perform this operation. "
        "Allowed transitions: DRAFT → POSTED | CANCELLED; "
        "POSTED → STARTED | CANCELLED | POSTPONED; "
        "STARTED → ENDED | CANCELLED; "
        "POSTPONED → POSTED | CANCELLED. "
        "ENDED and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_event_status(
    request: Request,
    event_id: uuid.UUID,
    body: EventStatusUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventStatusUseCase = Depends(get_event_status_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventStatusUpdatedResponse:
    """Transition an event status through the allowed state machine in one atomic transaction."""
    try:
        result = await use_case.update_event_status(
            UpdateEventStatusInput(
                event_id=event_id,
                updated_by=user_id,
                new_status=body.new_status,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except EventNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="events",
        resource_id=str(result.event.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event(result.old_event),
        new_values=serialize_event(result.event),
        additional_context={"status_transition": f"{result.old_event.status} → {result.event.status}"},
    )

    return EventStatusUpdatedResponse(data=_to_event_response(result.event))


@event_router.patch(
    "/{event_id}/session/{session_id}/status",
    response_model=EventSessionStatusUpdatedResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **EVENT_UNAUTHORIZED_OPERATION,
        **EVENT_SESSION_NOT_FOUND,
        **EVENT_SESSION_STATUS_INVALID_TRANSITION,
        **EVENT_VALIDATION_ERROR,
    },
    summary="Update event session status",
    description=(
        "Manually transitions an event session to a new status. "
        "Only the creator of the parent event may perform this operation. "
        "Allowed transitions: DRAFT → POSTED | CANCELLED; "
        "POSTED → STARTED | CANCELLED | POSTPONED; "
        "STARTED → ENDED | CANCELLED; "
        "POSTPONED → POSTED | CANCELLED. "
        "ENDED and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_event_session_status(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    body: EventSessionStatusUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventStatusUseCase = Depends(get_event_status_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventSessionStatusUpdatedResponse:
    """Transition an event session status through the allowed state machine in one atomic transaction."""
    try:
        result = await use_case.update_event_session_status(
            UpdateEventSessionStatusInput(
                session_id=session_id,
                updated_by=user_id,
                new_status=body.new_status,
            )
        )
    except UnauthorizedEventOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventSessionNotFoundError, EventNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventSessionStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_sessions",
        resource_id=str(result.session.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_sessions([result.old_session])[0],
        new_values=serialize_event_sessions([result.session])[0],
        additional_context={"status_transition": f"{result.old_session.status} → {result.session.status}"},
    )

    return EventSessionStatusUpdatedResponse(data=_to_session_response(result.session))
