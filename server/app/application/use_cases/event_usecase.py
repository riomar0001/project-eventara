"""Use cases for event creation and update with multi-session support.

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

from app.application.dto.event_dto import CreateEventInput, EventWithSessionsOutput, UpdateEventInput, UpdateEventOutput
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


class UpdateEventUseCase:
    """Application service that updates an event and synchronises its session list.

    The update follows a full-replace strategy for sessions: sessions present in
    the incoming list are created (no ``id``) or updated (with ``id``); sessions
    that existed before but are absent from the incoming list are deleted.  This
    gives the caller a single atomic operation to manage the complete session
    graph.

    Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
        The event row is locked before any read-then-write sequence.  Every
        concurrent request targeting the same event blocks until the lock is
        released at commit/rollback.  This eliminates the TOCTOU window between
        the ownership/date-validity check and the subsequent mutations.  Session
        rows do not need individual locks because they can only be reached through
        the already-locked event transaction.

    Args:
        repo: Concrete ``EventRepository`` providing data-access methods.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: EventRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def execute(self, data: UpdateEventInput) -> UpdateEventOutput:
        """Update an event's fields and synchronise its sessions atomically.

        Validation order:
        1. Event exists (with row lock).
        2. Caller is the event creator.
        3. Event date range is valid (end strictly after start).
        4. Sessions list is non-empty.
        5. Per-session: end strictly after start.
        6. Per-session: window within the new event date range.
        7. Per-session with ``id``: must belong to this event.
        8. Per-session: referenced venue must exist.

        All database mutations happen within one transaction; any failure
        triggers a full rollback.

        Args:
            data: ``UpdateEventInput`` with the target event ID, caller ID,
                updated event fields, and the desired session list.

        Returns:
            ``UpdateEventOutput`` containing the updated event, the resulting
            session list, and the pre-update snapshots for audit logging.

        Raises:
            EventNotFoundError: No event exists for ``data.event_id``.
            UnauthorizedEventOperationError: Caller is not the event creator.
            EventDateValidationError: ``end_date`` is not strictly after ``start_date``.
            EventValidationError: The sessions list is empty.
            InvalidEventSessionDateError: A session's ``end_datetime`` is not
                strictly after its ``start_datetime``.
            EventSessionExceedsEventBoundsError: A session falls outside the
                event's new ``[start_date, end_date]`` window.
            EventSessionNotFoundError: A session ``id`` in the request does not
                belong to this event.
            VenueNotFoundError: A session references a venue that does not exist.
        """
        event = await self.repo.get_event_by_id(data.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(data.event_id))

        if event.created_by != data.updated_by:
            raise UnauthorizedEventOperationError(str(data.event_id))

        if data.end_date <= data.start_date:
            raise EventDateValidationError("Event end_date must be after start_date")

        if not data.sessions:
            raise EventValidationError("At least one session is required")

        existing_sessions = await self.repo.get_sessions_by_event_id(data.event_id)
        existing_session_ids = {s.id for s in existing_sessions}

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
            if session_input.id is not None and session_input.id not in existing_session_ids:
                raise EventSessionNotFoundError(str(session_input.id))

        for session_input in data.sessions:
            if not await self.repo.venue_exists(session_input.venue_id):
                raise VenueNotFoundError()

        try:
            incoming_ids = {s.id for s in data.sessions if s.id is not None}
            sessions_to_delete = existing_session_ids - incoming_ids

            for session_id in sessions_to_delete:
                await self.repo.delete_session(session_id)

            updated_event = await self.repo.update_event(
                event_id=data.event_id,
                title=data.title,
                description=data.description,
                start_date=data.start_date,
                end_date=data.end_date,
            )

            result_sessions = []
            for session_input in data.sessions:
                if session_input.id is not None:
                    updated_session = await self.repo.update_session(
                        session_id=session_input.id,
                        venue_id=session_input.venue_id,
                        title=session_input.title,
                        description=session_input.description,
                        start_datetime=session_input.start_datetime,
                        end_datetime=session_input.end_datetime,
                    )
                    result_sessions.append(updated_session)
                else:
                    new_session = await self.repo.create_session(
                        event_id=data.event_id,
                        venue_id=session_input.venue_id,
                        title=session_input.title,
                        description=session_input.description,
                        start_datetime=session_input.start_datetime,
                        end_datetime=session_input.end_datetime,
                    )
                    result_sessions.append(new_session)
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventOutput(
            event=updated_event,
            sessions=result_sessions,
            old_event=event,
            old_sessions=existing_sessions,
        )
