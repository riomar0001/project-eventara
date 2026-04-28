"""Event participant management API routes.

Exposes two endpoints: one for any authenticated user to register themselves
for a session, and one for the event creator to update a participant's
attendance status (mark as attended, no-show, or cancelled).

Error mapping summary:
  - 400  session not open for registration or invalid status transition
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event creator (status update only)
  - 404  session or participant not found
  - 409  user is already registered for the session
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_participant_dto import RegisterForSessionInput, UpdateParticipantStatusInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_participant_usecase import EventParticipantUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event_participant
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_event_participant_use_case
from app.controller.docs.event_participant_docs import (
    PARTICIPANT_ALREADY_REGISTERED,
    PARTICIPANT_INVALID_STATUS_TRANSITION,
    PARTICIPANT_NOT_FOUND,
    PARTICIPANT_REGISTRATION_NOT_OPEN,
    PARTICIPANT_SESSION_NOT_FOUND,
    PARTICIPANT_SLOTS_FULL,
    PARTICIPANT_UNAUTHORIZED,
    PARTICIPANT_UNAUTHORIZED_OPERATION,
    PARTICIPANT_VALIDATION_ERROR,
)
from app.controller.schemas.event_participant_schema import (
    EventParticipantRecordResponse,
    RegisterForSessionResponse,
    UpdateParticipantStatusRequest,
    UpdateParticipantStatusResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import EventParticipant as EventParticipantEntity
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_participant_exceptions import (
    DuplicateEventParticipantError,
    EventParticipantNotFoundError,
    InvalidEventParticipantStatusTransitionError,
    RegistrationNotOpenError,
    SessionSlotsFullError,
    UnauthorizedEventParticipantOperationError,
)
from app.domain.exceptions.event_session_exceptions import EventSessionNotFoundError

participant_router = APIRouter(prefix="/events", tags=["Event Participants"])


def _to_participant_response(participant: EventParticipantEntity) -> EventParticipantRecordResponse:
    return EventParticipantRecordResponse(
        id=participant.id,
        user_id=participant.user_id,
        event_session_id=participant.event_session_id,
        status=participant.status.value if hasattr(participant.status, "value") else participant.status,
        created_at=participant.created_at,
        updated_at=participant.updated_at,
    )


@participant_router.post(
    "/{event_id}/session/{session_id}/register",
    response_model=RegisterForSessionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **PARTICIPANT_UNAUTHORIZED,
        **PARTICIPANT_SESSION_NOT_FOUND,
        **PARTICIPANT_REGISTRATION_NOT_OPEN,
        **PARTICIPANT_ALREADY_REGISTERED,
        **PARTICIPANT_SLOTS_FULL,
    },
    summary="Register for an event session",
    description=(
        "Registers the authenticated user for the specified event session. "
        "Registration is only permitted when the session status is POSTED. "
        "Each user may register for a given session at most once. "
        "Registration is rejected when all slots are taken. "
        "Slot limit is the session's max_slots if set, otherwise the venue capacity."
    ),
)
async def register_for_session(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventParticipantUseCase = Depends(get_event_participant_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> RegisterForSessionResponse:
    """Register the calling user for an event session in one atomic transaction."""
    try:
        result = await use_case.register_for_session(RegisterForSessionInput(user_id=user_id, session_id=session_id))
    except EventSessionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RegistrationNotOpenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except DuplicateEventParticipantError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except SessionSlotsFullError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="event_participants",
        resource_id=str(result.participant.id),
        status=AuditLogStatus.SUCCESS,
        new_values=serialize_event_participant(result.participant),
        additional_context={"event_id": str(event_id), "session_id": str(session_id)},
    )

    return RegisterForSessionResponse(data=_to_participant_response(result.participant))


@participant_router.patch(
    "/{event_id}/session/{session_id}/participants/{participant_id}",
    response_model=UpdateParticipantStatusResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **PARTICIPANT_UNAUTHORIZED,
        **PARTICIPANT_UNAUTHORIZED_OPERATION,
        **PARTICIPANT_NOT_FOUND,
        **PARTICIPANT_INVALID_STATUS_TRANSITION,
        **PARTICIPANT_VALIDATION_ERROR,
    },
    summary="Update event participant status",
    description=(
        "Updates the attendance status of a registered session participant. "
        "Only the event creator may perform this operation. "
        "Valid transitions from REGISTERED: ATTENDED, NO_SHOW, CANCELLED. "
        "ATTENDED, NO_SHOW, and CANCELLED are terminal states with no further transitions."
    ),
)
async def update_participant_status(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    body: UpdateParticipantStatusRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventParticipantUseCase = Depends(get_event_participant_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> UpdateParticipantStatusResponse:
    """Update a participant's attendance status in one atomic transaction."""
    try:
        result = await use_case.update_participant_status(
            UpdateParticipantStatusInput(
                participant_id=participant_id,
                updated_by=user_id,
                new_status=body.new_status,
            )
        )
    except UnauthorizedEventParticipantOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventParticipantNotFoundError, EventSessionNotFoundError, EventNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except InvalidEventParticipantStatusTransitionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="event_participants",
        resource_id=str(result.participant.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_participant(result.old_participant),
        new_values=serialize_event_participant(result.participant),
        additional_context={
            "event_id": str(event_id),
            "session_id": str(session_id),
            "status_transition": f"{result.old_participant.status} → {result.participant.status}",
        },
    )

    return UpdateParticipantStatusResponse(data=_to_participant_response(result.participant))
