"""Data-access layer for events and event sessions.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — single atomic transaction:
    Event creation does not target a unique row to lock on (event titles are not
    globally unique), so pessimistic locking is not applied.  All mutations — the
    event row and every session row — are staged via ``flush()`` before the
    use-case issues a single ``commit()``.  Any database constraint violation
    during flush causes the entire batch to be rolled back by the use-case,
    leaving no orphaned rows.
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

    async def get_event_by_id(self, event_id: uuid.UUID) -> EventEntity | None:
        """Return the event entity for the given ID, or None if absent."""
        result = await self.db.execute(select(Event).where(Event.id == event_id))
        orm = result.scalar_one_or_none()
        return self._to_event_entity(orm) if orm else None

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
