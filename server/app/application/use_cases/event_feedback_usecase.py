"""Use cases for checked-in attendee feedback after events.

Each checked-in attendee may submit exactly one feedback record per event after
the event reaches ENDED status. The service locks the event row before checking
whether feedback is open, locks the attendee's participant row before checking
check-in eligibility, and relies on both a feedback-row lock and the unique
``(user_id, event_id)`` index to prevent duplicate submissions under concurrent
requests.
"""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_feedback_dto import CreateEventFeedbackInput, EventFeedbackOutput
from app.domain.entities.event_entity import EventStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_feedback_exceptions import (
    DuplicateEventFeedbackError,
    EventFeedbackEligibilityError,
    EventFeedbackNotOpenError,
)
from app.infrastructure.database.repositories.event_feedback_repository import EventFeedbackRepository
from app.infrastructure.database.repositories.event_participant_repository import EventParticipantRepository
from app.infrastructure.database.repositories.event_repository import EventRepository


class EventFeedbackUseCase:
    """Application service for event feedback submission.

    Args:
        feedback_repo: Repository for event feedback persistence.
        event_repo: Repository for parent event reads and locks.
        participant_repo: Repository for attendee eligibility checks.
        db: Active async database session used for commit and rollback.
    """

    def __init__(
        self,
        feedback_repo: EventFeedbackRepository,
        event_repo: EventRepository,
        participant_repo: EventParticipantRepository,
        db: AsyncSession,
    ) -> None:
        self.feedback_repo = feedback_repo
        self.event_repo = event_repo
        self.participant_repo = participant_repo
        self.db = db

    async def create_feedback(self, data: CreateEventFeedbackInput) -> EventFeedbackOutput:
        """Submit feedback for an ended event as a checked-in attendee.

        Args:
            data: ``CreateEventFeedbackInput`` containing the authenticated user,
                  event ID, 1-5 rating, optional comment, and optional suggestion.

        Returns:
            ``EventFeedbackOutput`` wrapping the newly persisted feedback.

        Raises:
            EventNotFoundError: No event exists for the given ID.
            EventFeedbackNotOpenError: The event has not reached ENDED status.
            EventFeedbackEligibilityError: The user is not checked in for the event.
            DuplicateEventFeedbackError: The user already submitted feedback for the event.
        """
        event = await self.event_repo.get_event_by_id(data.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(data.event_id))

        if event.status != EventStatus.ENDED:
            raise EventFeedbackNotOpenError(str(event.id), event.status.value)

        participant = await self.participant_repo.get_by_user_and_event(data.user_id, data.event_id, for_update=True)
        if participant is None or not participant.is_checked_in:
            raise EventFeedbackEligibilityError(str(data.event_id))

        existing = await self.feedback_repo.get_by_user_and_event(data.user_id, data.event_id, for_update=True)
        if existing is not None:
            raise DuplicateEventFeedbackError(str(data.user_id), str(data.event_id))

        try:
            feedback = await self.feedback_repo.create(
                user_id=data.user_id,
                event_id=data.event_id,
                participant_id=participant.id,
                rating=data.rating,
                comment=data.comment,
                suggestion=data.suggestion,
            )
        except IntegrityError:
            await self.db.rollback()
            raise DuplicateEventFeedbackError(str(data.user_id), str(data.event_id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return EventFeedbackOutput(feedback=feedback)
