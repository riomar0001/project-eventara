"""Data-access layer for events and event sessions.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE) on mutating flows:
    ``get_event_by_id`` accepts a ``for_update`` flag that acquires a row-level
    lock on the event row before any check-then-mutate sequence.  Locking the
    parent event serialises all concurrent update attempts on that event and its
    child sessions: a second concurrent request that tries to acquire the same
    lock blocks until the first transaction commits or rolls back.  This
    eliminates TOCTOU races between the ownership/date-validity check and the
    subsequent mutations.  Session-level locks are not needed separately because
    every session write happens within the scope of a transaction that already
    holds the event lock.

    Creation flows do not require a row lock (there is no unique title constraint
    to race on), so they use a plain transaction boundary instead.
"""

import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entity import (
    Event as EventEntity,
    EventSession as EventSessionEntity,
    EventSessionStatus,
    EventStatus,
)
from app.infrastructure.database.models.event_models import Event, EventSession
from app.infrastructure.database.models.venue_models import Venue


class EventRepository:
    """Data-access layer for event and event session records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_event_entity(orm: Event) -> EventEntity:
        """Map an Event ORM row to its domain entity."""
        return EventEntity(
            id=orm.id,
            title=orm.title,
            description=orm.description,
            start_date=orm.start_date,
            end_date=orm.end_date,
            status=EventStatus(orm.status),
            created_by=orm.created_by,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_session_entity(orm: EventSession) -> EventSessionEntity:
        """Map an EventSession ORM row to its domain entity."""
        return EventSessionEntity(
            id=orm.id,
            event_id=orm.event_id,
            venue_id=orm.venue_id,
            title=orm.title,
            description=orm.description,
            start_datetime=orm.start_datetime,
            end_datetime=orm.end_datetime,
            status=EventSessionStatus(orm.status),
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    async def venue_exists(self, venue_id: uuid.UUID) -> bool:
        """Return True when a venue row with the given ID exists."""
        result = await self.db.execute(select(Venue.id).where(Venue.id == venue_id))
        return result.scalar_one_or_none() is not None

    async def get_event_by_id(self, event_id: uuid.UUID, *, for_update: bool = False) -> EventEntity | None:
        """Return the event entity for the given ID, optionally locking the row.

        Args:
            event_id:   UUID of the target event.
            for_update: When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(Event).where(Event.id == event_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_event_entity(orm) if orm else None

    async def get_sessions_by_event_id(self, event_id: uuid.UUID) -> list[EventSessionEntity]:
        """Return all sessions belonging to an event, ordered by start time.

        Args:
            event_id: UUID of the parent event.

        Returns:
            List of ``EventSessionEntity`` objects, earliest first.
        """
        result = await self.db.execute(
            select(EventSession)
            .where(EventSession.event_id == event_id)
            .order_by(EventSession.start_datetime)
        )
        return [self._to_session_entity(orm) for orm in result.scalars().all()]

    async def create_event(
        self,
        *,
        title: str,
        description: str,
        start_date: datetime,
        end_date: datetime,
        created_by: uuid.UUID,
    ) -> EventEntity:
        """Insert a new event row and return the persisted entity."""
        orm = Event(
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            status=EventStatus.DRAFT,
            created_by=created_by,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_event_entity(orm)

    async def create_session(
        self,
        *,
        event_id: uuid.UUID,
        venue_id: uuid.UUID,
        title: str,
        description: str | None,
        start_datetime: datetime,
        end_datetime: datetime,
    ) -> EventSessionEntity:
        """Insert a new event session row and return the persisted entity."""
        orm = EventSession(
            event_id=event_id,
            venue_id=venue_id,
            title=title,
            description=description,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            status=EventSessionStatus.SCHEDULED,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_session_entity(orm)

    async def update_event(
        self,
        *,
        event_id: uuid.UUID,
        title: str,
        description: str,
        start_date: datetime,
        end_date: datetime,
    ) -> EventEntity | None:
        """Apply field updates to an existing event row.

        The row must already be locked by the calling transaction via
        ``get_event_by_id(for_update=True)`` before this method is invoked.

        Args:
            event_id:    Primary key of the event to update.
            title:       Replacement title.
            description: Replacement HTML description.
            start_date:  Replacement start datetime.
            end_date:    Replacement end datetime.

        Returns:
            The updated ``EventEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(Event).where(Event.id == event_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None

        orm.title = title
        orm.description = description
        orm.start_date = start_date
        orm.end_date = end_date

        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_event_entity(orm)

    async def update_session(
        self,
        *,
        session_id: uuid.UUID,
        venue_id: uuid.UUID,
        title: str,
        description: str | None,
        start_datetime: datetime,
        end_datetime: datetime,
    ) -> EventSessionEntity | None:
        """Apply field updates to an existing event session row.

        Args:
            session_id:     Primary key of the session to update.
            venue_id:       Replacement venue UUID.
            title:          Replacement title.
            description:    Replacement plain-text description, or ``None``.
            start_datetime: Replacement session start.
            end_datetime:   Replacement session end.

        Returns:
            The updated ``EventSessionEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(EventSession).where(EventSession.id == session_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None

        orm.venue_id = venue_id
        orm.title = title
        orm.description = description
        orm.start_datetime = start_datetime
        orm.end_datetime = end_datetime

        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_session_entity(orm)

    async def delete_session(self, session_id: uuid.UUID) -> bool:
        """Delete a single event session row by primary key.

        Args:
            session_id: UUID of the session to remove.

        Returns:
            ``True`` if a row was deleted, ``False`` if no matching row existed.
        """
        result = await self.db.execute(select(EventSession).where(EventSession.id == session_id))
        orm = result.scalar_one_or_none()
        if orm is None:
            return False
        await self.db.delete(orm)
        await self.db.flush()
        return True
