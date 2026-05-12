"""Data-access layer for attendee feedback on events.

All write methods flush changes within the current transaction boundary while
the use-case layer owns commit and rollback.

Concurrency strategy:
    ``get_by_user_and_event`` accepts ``for_update`` so the use case can lock an
    existing feedback row before duplicate-sensitive write logic. The unique
    database index on ``(user_id, event_id)`` is the final guard for concurrent
    first submissions that both observe no existing row before insert.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entity import EventFeedback as EventFeedbackEntity
from app.infrastructure.database.models.event_models import EventFeedback


class EventFeedbackRepository:
    """Repository for event feedback creation and duplicate checks."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_entity(orm: EventFeedback) -> EventFeedbackEntity:
        """Map an EventFeedback ORM row to its domain entity."""
        return EventFeedbackEntity(
            id=orm.id,
            user_id=orm.user_id,
            event_id=orm.event_id,
            participant_id=orm.participant_id,
            rating=orm.rating,
            comment=orm.comment,
            suggestion=orm.suggestion,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    async def get_by_user_and_event(
        self,
        user_id: uuid.UUID,
        event_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> EventFeedbackEntity | None:
        """Return feedback submitted by a user for an event, optionally locking the row."""
        query = select(EventFeedback).where(EventFeedback.user_id == user_id, EventFeedback.event_id == event_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_entity(orm) if orm else None

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        event_id: uuid.UUID,
        participant_id: uuid.UUID,
        rating: int,
        comment: str | None,
        suggestion: str | None,
    ) -> EventFeedbackEntity:
        """Insert attendee feedback for an event and return the persisted entity."""
        orm = EventFeedback(
            user_id=user_id,
            event_id=event_id,
            participant_id=participant_id,
            rating=rating,
            comment=comment,
            suggestion=suggestion,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)
