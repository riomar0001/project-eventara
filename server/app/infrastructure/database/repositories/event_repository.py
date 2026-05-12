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

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entity import (
    Event as EventEntity,
)
from app.domain.entities.event_entity import (
    EventSession as EventSessionEntity,
)
from app.domain.entities.event_entity import (
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
            banner_url=orm.banner_url,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_session_entity(
        orm: EventSession,
        *,
        venue_name: str | None = None,
        venue_location: str | None = None,
    ) -> EventSessionEntity:
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
            max_slots=orm.max_slots,
            venue_name=venue_name,
            venue_location=venue_location,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    async def venue_exists(self, venue_id: uuid.UUID) -> bool:
        """Return True when a venue row with the given ID exists."""
        result = await self.db.execute(select(Venue.id).where(Venue.id == venue_id))
        return result.scalar_one_or_none() is not None

    async def venue_is_partner(self, venue_id: uuid.UUID) -> bool:
        """Return True when a venue row exists and is marked as a partner venue."""
        result = await self.db.execute(select(Venue.is_partner).where(Venue.id == venue_id))
        return result.scalar_one_or_none() is True

    async def get_venue_capacity(self, venue_id: uuid.UUID) -> int | None:
        """Return the maximum capacity of the venue, or ``None`` if the venue does not exist.

        Args:
            venue_id: UUID of the target venue.

        Returns:
            The venue's integer capacity, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(Venue.capacity).where(Venue.id == venue_id))
        return result.scalar_one_or_none()

    async def get_all_events(
        self,
        *,
        status: EventStatus | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[EventEntity]:
        """Return a paginated list of events ordered by creation date descending.

        Args:
            status: When provided, restricts results to events with the given status.
            limit:  Maximum number of rows to return.
            offset: Number of rows to skip before collecting results.

        Returns:
            List of ``EventEntity`` objects, newest first.
        """
        query = select(Event).order_by(Event.created_at.desc())
        if status is not None:
            query = query.where(Event.status == status)
        query = query.limit(limit).offset(offset)
        result = await self.db.execute(query)
        return [self._to_event_entity(orm) for orm in result.scalars().all()]

    async def count_all_events(self, *, status: EventStatus | None = None) -> int:
        """Return the total count of events, optionally filtered by status.

        Args:
            status: When provided, counts only events with the given status.

        Returns:
            Integer row count.
        """
        query = select(func.count()).select_from(Event)
        if status is not None:
            query = query.where(Event.status == status)
        result = await self.db.execute(query)
        return result.scalar_one()

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

    async def get_session_by_id(self, session_id: uuid.UUID, *, for_update: bool = False) -> EventSessionEntity | None:
        """Return the session entity for the given ID, optionally locking the row.

        Args:
            session_id: UUID of the target session.
            for_update: When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(EventSession).where(EventSession.id == session_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_session_entity(orm) if orm else None

    async def get_sessions_by_event_id(self, event_id: uuid.UUID) -> list[EventSessionEntity]:
        """Return all sessions belonging to an event, ordered by start time.

        Each session is enriched with the venue's ``name`` (``venue_name``) and
        ``city`` (``venue_location``) via a LEFT OUTER JOIN so that callers
        receive a self-contained payload without a separate venue lookup.  The
        join is an outer join so that sessions referencing a deleted venue row
        are still returned with ``None`` for both venue fields.

        Args:
            event_id: UUID of the parent event.

        Returns:
            List of ``EventSessionEntity`` objects, earliest first.
        """
        result = await self.db.execute(
            select(EventSession, Venue.name.label("venue_name"), Venue.city.label("venue_location"))
            .outerjoin(Venue, EventSession.venue_id == Venue.id)
            .where(EventSession.event_id == event_id)
            .order_by(EventSession.start_datetime)
        )
        return [self._to_session_entity(row.EventSession, venue_name=row.venue_name, venue_location=row.venue_location) for row in result.all()]

    async def create_event(
        self,
        *,
        title: str,
        description: str,
        start_date: datetime,
        end_date: datetime,
        created_by: uuid.UUID,
        banner_url: str | None = None,
    ) -> EventEntity:
        """Insert a new event row and return the persisted entity."""
        orm = Event(
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            status=EventStatus.DRAFT,
            created_by=created_by,
            banner_url=banner_url,
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
        max_slots: int | None = None,
    ) -> EventSessionEntity:
        """Insert a new event session row and return the persisted entity."""
        orm = EventSession(
            event_id=event_id,
            venue_id=venue_id,
            title=title,
            description=description,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            status=EventSessionStatus.POSTED,
            max_slots=max_slots,
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
        banner_url: str | None = None,
        status: EventStatus | None = None,
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
            status:      Optional replacement status derived from the new date range.

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
        orm.banner_url = banner_url
        if status is not None:
            orm.status = status

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
        max_slots: int | None = None,
        status: EventSessionStatus | None = None,
    ) -> EventSessionEntity | None:
        """Apply field updates to an existing event session row.

        Args:
            session_id:     Primary key of the session to update.
            venue_id:       Replacement venue UUID.
            title:          Replacement title.
            description:    Replacement plain-text description, or ``None``.
            start_datetime: Replacement session start.
            end_datetime:   Replacement session end.
            max_slots:      Replacement slot cap, or ``None`` to fall back to venue capacity.
            status:         Optional replacement status derived from the new schedule.

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
        orm.max_slots = max_slots
        if status is not None:
            orm.status = status

        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_session_entity(orm)

    async def count_sessions_by_event_id(self, event_id: uuid.UUID) -> int:
        """Return the total number of sessions belonging to an event.

        Args:
            event_id: UUID of the parent event.

        Returns:
            Integer count of session rows for that event.
        """
        result = await self.db.execute(select(func.count()).select_from(EventSession).where(EventSession.event_id == event_id))
        return result.scalar_one()

    async def delete_event(self, event_id: uuid.UUID) -> bool:
        """Delete an event row by primary key (cascades to sessions via DB FK).

        Args:
            event_id: UUID of the event to remove.

        Returns:
            ``True`` if a row was deleted, ``False`` if no matching row existed.
        """
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        orm = result.scalar_one_or_none()
        if orm is None:
            return False
        await self.db.delete(orm)
        await self.db.flush()
        return True

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

    async def update_event_banner(self, *, event_id: uuid.UUID, banner_url: str) -> EventEntity | None:
        """Set the banner_url field on an existing event row.

        The row must already be locked by the calling transaction via
        ``get_event_by_id(for_update=True)`` before this method is invoked.

        Args:
            event_id:   Primary key of the event to update.
            banner_url: Storage object key of the uploaded banner image.

        Returns:
            The updated ``EventEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(Event).where(Event.id == event_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.banner_url = banner_url
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_event_entity(orm)

    async def update_event_status(self, *, event_id: uuid.UUID, new_status: EventStatus) -> EventEntity | None:
        """Update the status field of an existing event row.

        The row must already be locked by the calling transaction via
        ``get_event_by_id(for_update=True)`` before this method is invoked.

        Args:
            event_id:   Primary key of the event to update.
            new_status: The target ``EventStatus`` value.

        Returns:
            The updated ``EventEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(Event).where(Event.id == event_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.status = new_status
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_event_entity(orm)

    async def update_session_status(self, *, session_id: uuid.UUID, new_status: EventSessionStatus) -> EventSessionEntity | None:
        """Update the status field of an existing event session row.

        Args:
            session_id: Primary key of the session to update.
            new_status: The target ``EventSessionStatus`` value.

        Returns:
            The updated ``EventSessionEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(EventSession).where(EventSession.id == session_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.status = new_status
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_session_entity(orm)

    async def bulk_update_session_statuses(self, now: datetime) -> tuple[int, int]:
        """Atomically advance session statuses based on wall-clock time.

        Transitions eligible sessions in two passes within the same database
        transaction:
          1. ``POSTED`` → ``STARTED``: sessions whose start window has arrived
             but end window has not yet passed.
          2. ``STARTED`` → ``ENDED``: sessions whose end window has passed.

        Using ``synchronize_session=False`` bypasses SQLAlchemy's in-memory
        object sync for bulk operations, which is safe here because the session
        is discarded after the commit.

        Args:
            now: Current UTC timestamp used as the transition boundary.

        Returns:
            A ``(started_count, ended_count)`` tuple with the number of rows
            updated in each pass.
        """
        started_result = await self.db.execute(
            update(EventSession)
            .where(
                EventSession.status == EventSessionStatus.POSTED,
                EventSession.start_datetime <= now,
                EventSession.end_datetime > now,
            )
            .values(status=EventSessionStatus.STARTED)
            .execution_options(synchronize_session=False)
        )
        ended_result = await self.db.execute(
            update(EventSession)
            .where(
                EventSession.status == EventSessionStatus.STARTED,
                EventSession.end_datetime <= now,
            )
            .values(status=EventSessionStatus.ENDED)
            .execution_options(synchronize_session=False)
        )
        return started_result.rowcount, ended_result.rowcount

    async def bulk_update_event_statuses(self, now: datetime) -> tuple[int, int]:
        """Atomically advance event statuses based on wall-clock time.

        Transitions eligible events in two passes within the same database
        transaction:
          1. ``POSTED`` → ``STARTED``: events whose start date has arrived but
             end date has not yet passed.
          2. ``STARTED`` → ``ENDED``: events whose end date has passed.

        Args:
            now: Current UTC timestamp used as the transition boundary.

        Returns:
            A ``(started_count, ended_count)`` tuple with the number of rows
            updated in each pass.
        """
        started_result = await self.db.execute(
            update(Event)
            .where(
                Event.status == EventStatus.POSTED,
                Event.start_date <= now,
                Event.end_date > now,
            )
            .values(status=EventStatus.STARTED)
            .execution_options(synchronize_session=False)
        )
        ended_result = await self.db.execute(
            update(Event)
            .where(
                Event.status == EventStatus.STARTED,
                Event.end_date <= now,
            )
            .values(status=EventStatus.ENDED)
            .execution_options(synchronize_session=False)
        )
        return started_result.rowcount, ended_result.rowcount
