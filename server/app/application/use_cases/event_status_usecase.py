"""Use cases for manual event and event session status transitions."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_status_dto import (
    UpdateEventSessionStatusInput,
    UpdateEventSessionStatusOutput,
    UpdateEventStatusInput,
    UpdateEventStatusOutput,
)
from app.domain.entities.event_entity import EventSessionStatus, EventStatus
from app.domain.exceptions.event_exceptions import (
    EventNotFoundError,
    EventStatusTransitionError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventSessionNotFoundError,
    EventSessionStatusTransitionError,
)
from app.infrastructure.database.repositories.event_repository import EventRepository

_PRIVILEGED_ROLES: frozenset[str] = frozenset({"community_leader", "system_administrator"})

_ALLOWED_EVENT_TRANSITIONS: dict[EventStatus, set[EventStatus]] = {
    EventStatus.DRAFT: {EventStatus.POSTED, EventStatus.CANCELLED},
    EventStatus.POSTED: {EventStatus.DRAFT, EventStatus.STARTED, EventStatus.POSTPONED, EventStatus.CANCELLED},
    EventStatus.STARTED: {EventStatus.DRAFT, EventStatus.POSTED, EventStatus.ENDED, EventStatus.CANCELLED},
    EventStatus.POSTPONED: {EventStatus.DRAFT, EventStatus.POSTED, EventStatus.CANCELLED},
    EventStatus.ENDED: {EventStatus.DRAFT},
    EventStatus.CANCELLED: {EventStatus.DRAFT},
}

_ALLOWED_SESSION_TRANSITIONS: dict[EventSessionStatus, set[EventSessionStatus]] = {
    EventSessionStatus.DRAFT: {EventSessionStatus.POSTED, EventSessionStatus.CANCELLED},
    EventSessionStatus.POSTED: {EventSessionStatus.STARTED, EventSessionStatus.CANCELLED, EventSessionStatus.POSTPONED},
    EventSessionStatus.STARTED: {EventSessionStatus.ENDED, EventSessionStatus.CANCELLED},
    EventSessionStatus.POSTPONED: {EventSessionStatus.POSTED, EventSessionStatus.CANCELLED},
    EventSessionStatus.ENDED: set(),
    EventSessionStatus.CANCELLED: set(),
}


class EventStatusUseCase:
    """Application service for manual status transitions on events and event sessions.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy:
        Both ``update_event_status`` and ``update_event_session_status`` acquire
        a pessimistic row-level lock (SELECT … FOR UPDATE) on the event row
        before reading current status and performing the mutation.  This
        serialises concurrent transition attempts on the same event, eliminating
        TOCTOU races between the state-validity check and the write.

        Session-level locks are not required separately because every session
        mutation happens within a transaction that already holds the parent
        event lock.

    Args:
        repo: Concrete ``EventRepository`` providing data-access methods.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: EventRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def update_event_status(self, data: UpdateEventStatusInput) -> UpdateEventStatusOutput:
        """Transition an event to a new status, subject to the allowed transition map.

        Validation order:
        1. Event exists (with row lock).
        2. Caller is the event creator.
        3. Requested status is reachable from the current status.

        Raises:
            EventNotFoundError: No event exists for ``data.event_id``.
            UnauthorizedEventOperationError: Caller is not the event creator.
            EventStatusTransitionError: ``data.new_status`` is not a valid next
                state from the event's current status.
        """
        event = await self.repo.get_event_by_id(data.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(data.event_id))

        if event.created_by != data.updated_by and data.caller_role not in _PRIVILEGED_ROLES:
            raise UnauthorizedEventOperationError(str(data.event_id))

        if data.new_status not in _ALLOWED_EVENT_TRANSITIONS[event.status]:
            raise EventStatusTransitionError(str(data.event_id), event.status, data.new_status)

        try:
            updated_event = await self.repo.update_event_status(
                event_id=data.event_id,
                new_status=data.new_status,
            )
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventStatusOutput(event=updated_event, old_event=event)

    async def update_event_session_status(self, data: UpdateEventSessionStatusInput) -> UpdateEventSessionStatusOutput:
        """Transition an event session to a new status, subject to the allowed transition map.

        Validation order:
        1. Session exists.
        2. Parent event exists (with row lock).
        3. Caller is the event creator.
        4. Requested status is reachable from the session's current status.

        Raises:
            EventSessionNotFoundError: No session exists for ``data.session_id``.
            EventNotFoundError: Parent event no longer exists.
            UnauthorizedEventOperationError: Caller is not the event creator.
            EventSessionStatusTransitionError: ``data.new_status`` is not a valid
                next state from the session's current status.
        """
        old_session = await self.repo.get_session_by_id(data.session_id)
        if old_session is None:
            raise EventSessionNotFoundError(str(data.session_id))

        event = await self.repo.get_event_by_id(old_session.event_id, for_update=True)
        if event is None:
            raise EventNotFoundError(str(old_session.event_id))

        if event.created_by != data.updated_by and data.caller_role not in _PRIVILEGED_ROLES:
            raise UnauthorizedEventOperationError(str(event.id))

        if data.new_status not in _ALLOWED_SESSION_TRANSITIONS[old_session.status]:
            raise EventSessionStatusTransitionError(old_session.status, data.new_status)

        try:
            updated_session = await self.repo.update_session_status(
                session_id=data.session_id,
                new_status=data.new_status,
            )
            if updated_session is None:
                raise EventSessionNotFoundError(str(data.session_id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventSessionStatusOutput(session=updated_session, old_session=old_session)
