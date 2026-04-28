"""Data-access layer for event participant records.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE) on mutating flows:
    ``get_by_id`` and ``get_by_user_and_session`` accept a ``for_update`` flag that
    acquires a row-level lock before any check-then-mutate sequence. This eliminates
    TOCTOU races between the registration duplicate check and the subsequent insert,
    and between the participant status check and the subsequent update.

    The unique index on ``(user_id, event_session_id)`` in the database provides an
    additional safety net against duplicate registrations at the storage layer.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entity import EventParticipant as EventParticipantEntity
from app.domain.entities.event_entity import EventParticipantStatus
from app.infrastructure.database.models.event_models import EventParticipant


class EventParticipantRepository:
    """Data-access layer for event participant records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_entity(orm: EventParticipant) -> EventParticipantEntity:
        """Map an EventParticipant ORM row to its domain entity."""
        return EventParticipantEntity(
            id=orm.id,
            user_id=orm.user_id,
            event_session_id=orm.event_session_id,
            status=EventParticipantStatus(orm.status),
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    async def get_by_user_and_session(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> EventParticipantEntity | None:
        """Return the participant record for a user-session pair, optionally locking the row.

        Args:
            user_id:    UUID of the registering user.
            session_id: UUID of the event session.
            for_update: When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(EventParticipant).where(
            EventParticipant.user_id == user_id,
            EventParticipant.event_session_id == session_id,
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_entity(orm) if orm else None

    async def get_by_id(
        self,
        participant_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> EventParticipantEntity | None:
        """Return the participant entity for the given ID, optionally locking the row.

        Args:
            participant_id: UUID of the participant record.
            for_update:     When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(EventParticipant).where(EventParticipant.id == participant_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_entity(orm) if orm else None

    async def count_active_participants(self, session_id: uuid.UUID) -> int:
        """Return the number of non-cancelled participants for a session.

        Counts rows with status REGISTERED, ATTENDED, or NO_SHOW — all statuses
        that represent a taken slot. CANCELLED registrations are excluded because
        they free their slot for new registrations.

        Args:
            session_id: UUID of the target session.

        Returns:
            Integer count of active (slot-occupying) participants.
        """
        result = await self.db.execute(
            select(func.count())
            .select_from(EventParticipant)
            .where(
                EventParticipant.event_session_id == session_id,
                EventParticipant.status != EventParticipantStatus.CANCELLED,
            )
        )
        return result.scalar_one()

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
    ) -> EventParticipantEntity:
        """Insert a new participant record with REGISTERED status and return the persisted entity."""
        orm = EventParticipant(
            user_id=user_id,
            event_session_id=session_id,
            status=EventParticipantStatus.REGISTERED,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)

    async def update_status(
        self,
        *,
        participant_id: uuid.UUID,
        new_status: EventParticipantStatus,
    ) -> EventParticipantEntity | None:
        """Update the status of an existing participant row.

        The row must already be locked by the calling transaction via
        ``get_by_id(for_update=True)`` before this method is invoked.

        Args:
            participant_id: Primary key of the participant to update.
            new_status:     The target ``EventParticipantStatus`` value.

        Returns:
            The updated ``EventParticipantEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(EventParticipant).where(EventParticipant.id == participant_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.status = new_status
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)
