"""Event participant management API routes.

Exposes endpoints for authenticated users to register for sessions, withdraw
their own registrations, and for authorized organizers or joined volunteers to
update/check in participants, including check-in by QR JWT.

Error mapping summary:
  - 400  session not open for registration or invalid status transition
  - 401  missing, expired, or invalid Bearer token
  - 403  caller is not the event creator (status update only)
  - 404  session or participant not found
  - 409  user is already registered for the session or participant already checked in
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_participant_dto import (
    CheckInParticipantInput,
    CheckInParticipantQrCodeInput,
    RegisterForSessionInput,
    UpdateParticipantStatusInput,
    WithdrawRegistrationInput,
)
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_participant_usecase import EventParticipantUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event_participant
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_event_participant_check_in_use_case, get_event_participant_use_case
from app.controller.docs.event_participant_docs import (
    PARTICIPANT_ALREADY_CHECKED_IN,
    PARTICIPANT_ALREADY_REGISTERED,
    PARTICIPANT_CHECK_IN_NOT_OPEN,
    PARTICIPANT_INVALID_STATUS_TRANSITION,
    PARTICIPANT_NOT_FOUND,
    PARTICIPANT_QR_TOKEN_INVALID,
    PARTICIPANT_REGISTRATION_NOT_OPEN,
    PARTICIPANT_SESSION_NOT_FOUND,
    PARTICIPANT_SLOTS_FULL,
    PARTICIPANT_UNAUTHORIZED,
    PARTICIPANT_UNAUTHORIZED_OPERATION,
    PARTICIPANT_VALIDATION_ERROR,
)
from app.controller.schemas.event_participant_schema import (
    CheckInParticipantQrCodeRequest,
    CheckInParticipantResponse,
    EventParticipantRecordResponse,
    RegisterForSessionResponse,
    UpdateParticipantStatusRequest,
    UpdateParticipantStatusResponse,
    WithdrawRegistrationResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import EventParticipant as EventParticipantEntity
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_participant_exceptions import (
    DuplicateEventParticipantError,
    EventParticipantAlreadyCheckedInError,
    EventParticipantCheckInNotOpenError,
    EventParticipantNotFoundError,
    EventParticipantQrTokenInvalidError,
    EventParticipantQrTokenMismatchError,
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
        is_checked_in=participant.is_checked_in,
        checked_in_time=participant.checked_in_time,
        checked_in_by=participant.checked_in_by,
        created_at=participant.created_at,
        updated_at=participant.updated_at,
    )


async def _audit_failure(
    audit_use_case: AuditLogUseCase,
    request: Request,
    *,
    user_id: uuid.UUID,
    action_type: ActionType,
    resource_type: str,
    resource_id: str | None,
    message: str,
    additional_context: dict | None = None,
) -> None:
    """Record a failed participant operation using the request audit context."""
    context = {"error": message}
    if additional_context:
        context.update(additional_context)
    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        status=AuditLogStatus.FAILURE,
        additional_context=context,
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


@participant_router.delete(
    "/{event_id}/session/{session_id}/register",
    response_model=WithdrawRegistrationResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **PARTICIPANT_UNAUTHORIZED,
        **PARTICIPANT_NOT_FOUND,
        **PARTICIPANT_ALREADY_CHECKED_IN,
        **PARTICIPANT_INVALID_STATUS_TRANSITION,
    },
    summary="Withdraw event session registration",
    description=(
        "Cancels the authenticated user's own registration for the specified event session. "
        "Only active registrations that have not been checked in can be withdrawn. "
        "The participant row is locked during the withdrawal to prevent concurrent check-in and cancellation races."
    ),
)
async def withdraw_registration(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventParticipantUseCase = Depends(get_event_participant_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> WithdrawRegistrationResponse:
    """Withdraw the caller's registration in one atomic transaction."""
    try:
        result = await use_case.withdraw_registration(WithdrawRegistrationInput(user_id=user_id, event_id=event_id, session_id=session_id))
    except (EventParticipantNotFoundError, EventSessionNotFoundError) as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.DELETE,
            resource_type="event_participants",
            resource_id=str(session_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventParticipantAlreadyCheckedInError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.DELETE,
            resource_type="event_participants",
            resource_id=str(session_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except InvalidEventParticipantStatusTransitionError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.DELETE,
            resource_type="event_participants",
            resource_id=str(session_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="event_participants",
        resource_id=str(result.participant.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_event_participant(result.old_participant),
        new_values=serialize_event_participant(result.participant),
        additional_context={"event_id": str(event_id), "session_id": str(session_id)},
    )

    return WithdrawRegistrationResponse(data=_to_participant_response(result.participant))


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


@participant_router.patch(
    "/{event_id}/session/{session_id}/participants/{participant_id}/check-in",
    response_model=CheckInParticipantResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **PARTICIPANT_UNAUTHORIZED,
        **PARTICIPANT_UNAUTHORIZED_OPERATION,
        **PARTICIPANT_NOT_FOUND,
        **PARTICIPANT_CHECK_IN_NOT_OPEN,
        **PARTICIPANT_ALREADY_CHECKED_IN,
        **PARTICIPANT_INVALID_STATUS_TRANSITION,
    },
    summary="Check in an event participant",
    description=(
        "Checks in a registered participant at the event venue. "
        "The event creator or a JOINED event volunteer may perform check-in. "
        "A successful check-in records the check-in flag, time, actor, and queues an email receipt."
    ),
)
async def check_in_participant(
    request: Request,
    event_id: uuid.UUID,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventParticipantUseCase = Depends(get_event_participant_check_in_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> CheckInParticipantResponse:
    """Check in a participant and queue an email receipt after commit."""
    try:
        result = await use_case.check_in_participant(
            CheckInParticipantInput(
                event_id=event_id,
                session_id=session_id,
                participant_id=participant_id,
                checked_in_by=user_id,
            )
        )
    except UnauthorizedEventParticipantOperationError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=str(participant_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventParticipantNotFoundError, EventSessionNotFoundError, EventNotFoundError) as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=str(participant_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventParticipantCheckInNotOpenError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=str(participant_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except EventParticipantAlreadyCheckedInError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=str(participant_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except InvalidEventParticipantStatusTransitionError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=str(participant_id),
            message=str(exc),
            additional_context={"event_id": str(event_id), "session_id": str(session_id)},
        )
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
            "checked_in_by": str(user_id),
        },
    )

    return CheckInParticipantResponse(data=_to_participant_response(result.participant))


@participant_router.post(
    "/participants/check-in/qr",
    response_model=CheckInParticipantResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **PARTICIPANT_UNAUTHORIZED,
        **PARTICIPANT_UNAUTHORIZED_OPERATION,
        **PARTICIPANT_QR_TOKEN_INVALID,
        **PARTICIPANT_NOT_FOUND,
        **PARTICIPANT_CHECK_IN_NOT_OPEN,
        **PARTICIPANT_ALREADY_CHECKED_IN,
        **PARTICIPANT_INVALID_STATUS_TRANSITION,
        **PARTICIPANT_VALIDATION_ERROR,
    },
    summary="Check in an event participant by QR code",
    description=(
        "Accepts the JWT contained in an attendee QR code, verifies its signature and expiration, "
        "validates that the token claims match the registered participant, then marks the attendee checked in. "
        "The QR JWT contains the event name, event session name, event ID, session ID, participant ID, "
        "and attendee user ID. The JWT expires at the event session end datetime."
    ),
)
async def check_in_participant_qr_code(
    request: Request,
    body: CheckInParticipantQrCodeRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventParticipantUseCase = Depends(get_event_participant_check_in_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> CheckInParticipantResponse:
    """Verify an attendee QR JWT and check in its participant record."""
    try:
        result = await use_case.check_in_participant_with_qr_code(
            CheckInParticipantQrCodeInput(
                token=body.token,
                checked_in_by=user_id,
            )
        )
    except (EventParticipantQrTokenInvalidError, EventParticipantQrTokenMismatchError) as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=None,
            message=str(exc),
            additional_context={"qr_token_present": bool(body.token)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except UnauthorizedEventParticipantOperationError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=None,
            message=str(exc),
            additional_context={"qr_token_present": bool(body.token)},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (EventParticipantNotFoundError, EventSessionNotFoundError, EventNotFoundError) as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=None,
            message=str(exc),
            additional_context={"qr_token_present": bool(body.token)},
        )
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventParticipantCheckInNotOpenError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=None,
            message=str(exc),
            additional_context={"qr_token_present": bool(body.token)},
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except EventParticipantAlreadyCheckedInError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=None,
            message=str(exc),
            additional_context={"qr_token_present": bool(body.token)},
        )
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except InvalidEventParticipantStatusTransitionError as exc:
        await _audit_failure(
            audit_use_case,
            request,
            user_id=user_id,
            action_type=ActionType.UPDATE,
            resource_type="event_participants",
            resource_id=None,
            message=str(exc),
            additional_context={"qr_token_present": bool(body.token)},
        )
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
            "checked_in_by": str(user_id),
            "check_in_source": "qr_code",
        },
    )

    return CheckInParticipantResponse(data=_to_participant_response(result.participant))
