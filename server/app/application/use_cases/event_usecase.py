"""Use cases for event creation with multi-session support.

Events always carry at least one session (e.g. Ideation, Building, Demo for a
hackathon).  The use case enforces temporal consistency between the parent event
and each child session before any database write occurs, then persists the entire
graph atomically.

Concurrency strategy — single atomic transaction (no explicit row lock):
    Event creation has no natural uniqueness target to acquire a pessimistic lock
    on (event titles are not globally unique).  Instead, the event row and all
    session rows are flushed together inside one transaction.  The database
    evaluates all foreign-key and constraint checks at commit time; any violation
    triggers a unified rollback with no orphaned rows.  This is sufficient because
    the risk profile differs from venue ratings: two concurrent requests creating
    the same event represent independent intent (two distinct events), not a
    TOCTOU collision on a shared unique resource.
"""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_dto import CreateEventInput, EventWithSessionsOutput
from app.domain.exceptions.event_exceptions import EventDateValidationError, EventValidationError
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.infrastructure.database.repositories.event_repository import EventRepository


class CreateEventUseCase:
    """Application service that creates a new event together with its sessions.

    Owns the transaction lifecycle: commits on success, rolls back on any
    validation or infrastructure failure before propagating the exception.

    Args:
        repo: Concrete ``EventRepository`` providing data-access methods.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: EventRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def execute(self, data: CreateEventInput) -> EventWithSessionsOutput:
        """Create an event and all its sessions in a single atomic transaction.

        Validation order:
        1. Event date range (end must be strictly after start).
        2. Non-empty sessions list.
        3. Per-session: end must be strictly after start.
        4. Per-session: window must fall within the event date range.
        5. Per-session: the referenced venue must exist.

        All venue existence checks are performed before touching the write path
        so that database mutations are never started for an invalid payload.

        Args:
            data: ``CreateEventInput`` with event metadata and a non-empty list
                of ``CreateEventSessionInput`` descriptors.

        Returns:
            ``EventWithSessionsOutput`` containing the persisted event entity
            and the ordered list of persisted session entities.

        Raises:
            EventDateValidationError: ``end_date`` is not strictly after ``start_date``.
            EventValidationError: The sessions list is empty.
            InvalidEventSessionDateError: A session's ``end_datetime`` is not
                strictly after its ``start_datetime``.
            EventSessionExceedsEventBoundsError: A session's window falls
                outside the event's ``[start_date, end_date]`` range.
            VenueNotFoundError: A session references a venue that does not exist.
        """
        if data.end_date <= data.start_date:
            raise EventDateValidationError("Event end_date must be after start_date")

        if not data.sessions:
            raise EventValidationError("At least one session is required")

        for session_input in data.sessions:
            if session_input.end_datetime <= session_input.start_datetime:
                raise InvalidEventSessionDateError(
                    str(session_input.start_datetime),
                    str(session_input.end_datetime),
                )
            if session_input.start_datetime < data.start_date or session_input.end_datetime > data.end_date:
                raise EventSessionExceedsEventBoundsError(
                    str(session_input.start_datetime),
                    str(session_input.end_datetime),
                    str(data.start_date),
                    str(data.end_date),
                )

        for session_input in data.sessions:
            if not await self.repo.venue_exists(session_input.venue_id):
                raise VenueNotFoundError()

        try:
            event = await self.repo.create_event(
                title=data.title,
                description=data.description,
                start_date=data.start_date,
                end_date=data.end_date,
                created_by=data.created_by,
            )

            sessions = []
            for session_input in data.sessions:
                session = await self.repo.create_session(
                    event_id=event.id,
                    venue_id=session_input.venue_id,
                    title=session_input.title,
                    description=session_input.description,
                    start_datetime=session_input.start_datetime,
                    end_datetime=session_input.end_datetime,
                )
                sessions.append(session)
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return EventWithSessionsOutput(event=event, sessions=sessions)
