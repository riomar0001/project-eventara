"""Event feedback API routes.

Exposes attendee feedback submission after an event ends. Feedback is only
accepted from authenticated users who have a checked-in participant record for
the event, and each user may submit one feedback record per event.

Error mapping summary:
  - 400  feedback is not open because the event has not ended
  - 401  missing, expired, or invalid Bearer token
  - 403  authenticated user is not a checked-in attendee
  - 404  event not found
  - 409  user already submitted feedback for the event
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.event_feedback_dto import CreateEventFeedbackInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.event_feedback_usecase import EventFeedbackUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_event_feedback
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id
from app.controller.dependencies.use_cases_depends import get_event_feedback_use_case
from app.controller.docs.event_feedback_docs import (
    EVENT_FEEDBACK_DUPLICATE,
    EVENT_FEEDBACK_EVENT_NOT_FOUND,
    EVENT_FEEDBACK_NOT_ELIGIBLE,
    EVENT_FEEDBACK_NOT_OPEN,
    EVENT_FEEDBACK_UNAUTHORIZED,
    EVENT_FEEDBACK_VALIDATION_ERROR,
)
from app.controller.schemas.event_feedback_schema import (
    CreateEventFeedbackRequest,
    EventFeedbackRecordResponse,
    EventFeedbackResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.event_entity import EventFeedback
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_feedback_exceptions import (
    DuplicateEventFeedbackError,
    EventFeedbackEligibilityError,
    EventFeedbackNotOpenError,
)

event_feedback_router = APIRouter(prefix="/events", tags=["Event Feedback"])


def _to_feedback_response(feedback: EventFeedback) -> EventFeedbackRecordResponse:
    """Map an event feedback entity to the public API response shape."""
    return EventFeedbackRecordResponse(
        id=feedback.id,
        user_id=feedback.user_id,
        event_id=feedback.event_id,
        participant_id=feedback.participant_id,
        rating=feedback.rating,
        comment=feedback.comment,
        suggestion=feedback.suggestion,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
    )


async def _audit_feedback_failure(
    audit_use_case: AuditLogUseCase,
    request: Request,
    *,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    message: str,
) -> None:
    """Record a failed feedback submission using the request audit context."""
    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="event_feedback",
        resource_id=str(event_id),
        status=AuditLogStatus.FAILURE,
        additional_context={"event_id": str(event_id), "error": message},
    )


@event_feedback_router.post(
    "/{event_id}/feedback",
    response_model=EventFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **EVENT_FEEDBACK_UNAUTHORIZED,
        **EVENT_FEEDBACK_EVENT_NOT_FOUND,
        **EVENT_FEEDBACK_NOT_OPEN,
        **EVENT_FEEDBACK_NOT_ELIGIBLE,
        **EVENT_FEEDBACK_DUPLICATE,
        **EVENT_FEEDBACK_VALIDATION_ERROR,
    },
    summary="Submit event feedback",
    description=(
        "Submits a 1-5 event feedback rating with a comment or suggestion. "
        "Only checked-in attendees can submit feedback, feedback opens after the event has ended, "
        "and a user may submit feedback for the same event only once."
    ),
)
async def create_event_feedback(
    request: Request,
    event_id: uuid.UUID,
    body: CreateEventFeedbackRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: EventFeedbackUseCase = Depends(get_event_feedback_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventFeedbackResponse:
    """Submit checked-in attendee feedback for an ended event."""
    try:
        result = await use_case.create_feedback(
            CreateEventFeedbackInput(
                user_id=user_id,
                event_id=event_id,
                rating=body.rating,
                comment=body.comment,
                suggestion=body.suggestion,
            )
        )
    except EventNotFoundError as exc:
        await _audit_feedback_failure(audit_use_case, request, user_id=user_id, event_id=event_id, message=str(exc))
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except EventFeedbackNotOpenError as exc:
        await _audit_feedback_failure(audit_use_case, request, user_id=user_id, event_id=event_id, message=str(exc))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except EventFeedbackEligibilityError as exc:
        await _audit_feedback_failure(audit_use_case, request, user_id=user_id, event_id=event_id, message=str(exc))
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except DuplicateEventFeedbackError as exc:
        await _audit_feedback_failure(audit_use_case, request, user_id=user_id, event_id=event_id, message=str(exc))
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="event_feedback",
        resource_id=str(result.feedback.id),
        status=AuditLogStatus.SUCCESS,
        new_values=serialize_event_feedback(result.feedback),
        additional_context={"event_id": str(event_id), "rating": result.feedback.rating},
    )

    return EventFeedbackResponse(data=_to_feedback_response(result.feedback))
