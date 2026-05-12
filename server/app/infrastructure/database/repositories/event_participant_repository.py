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
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entity import EventParticipant as EventParticipantEntity
from app.domain.entities.event_entity import EventParticipantStatus
from app.infrastructure.database.models.event_models import EventParticipant, EventSession
from app.infrastructure.database.models.user_models import UserProfile


class EventParticipantRepository:
    """Data-access layer for event participant records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_entity(
        orm: EventParticipant,
        *,
        user_first_name: str | None = None,
        user_last_name: str | None = None,
        user_alias: str | None = None,
        user_profile_picture_url: str | None = None,
        event_session_title: str | None = None,
    ) -> EventParticipantEntity:
        """Map an EventParticipant ORM row to its domain entity."""
        return EventParticipantEntity(
            id=orm.id,
            user_id=orm.user_id,
            event_session_id=orm.event_session_id,
            status=EventParticipantStatus(orm.status),
            is_checked_in=orm.is_checked_in,
            checked_in_time=orm.checked_in_time,
            checked_in_by=orm.checked_in_by,
            user_first_name=user_first_name,
            user_last_name=user_last_name,
            user_alias=user_alias,
            user_profile_picture_url=user_profile_picture_url,
            event_session_title=event_session_title,
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

    async def get_by_user_and_event(
        self,
        user_id: uuid.UUID,
        event_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> EventParticipantEntity | None:
        """Return a participant row for a user within an event, preferring checked-in rows.

        Args:
            user_id: UUID of the attendee.
            event_id: UUID of the parent event.
            for_update: When ``True``, acquires a row-level lock before eligibility checks.

        Returns:
            A matching participant entity, or ``None`` when the user has no registration for the event.
        """
        query = (
            select(EventParticipant)
            .join(EventSession, EventParticipant.event_session_id == EventSession.id)
            .where(EventParticipant.user_id == user_id, EventSession.event_id == event_id)
            .order_by(EventParticipant.is_checked_in.desc(), EventParticipant.created_at.desc())
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalars().first()
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

    async def check_in(
        self,
        *,
        participant_id: uuid.UUID,
        checked_in_by: uuid.UUID,
        checked_in_time: datetime,
    ) -> EventParticipantEntity | None:
        """Mark an existing participant as checked in and return the updated entity.

        The row must already be locked by the calling transaction via
        ``get_by_id(for_update=True)`` before this method is invoked.

        Args:
            participant_id: Primary key of the participant to check in.
            checked_in_by: UUID of the organizer or joined volunteer performing check-in.
            checked_in_time: Timestamp to persist for the check-in action.

        Returns:
            The updated ``EventParticipantEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(EventParticipant).where(EventParticipant.id == participant_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.is_checked_in = True
        orm.checked_in_time = checked_in_time
        orm.checked_in_by = checked_in_by
        orm.status = EventParticipantStatus.ATTENDED
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_entity(orm)

    async def get_participants_by_event(
        self,
        event_id: uuid.UUID,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[EventParticipantEntity]:
        """Return paginated participants across all sessions of an event.

        Joins participant records to event sessions for event scoping and to user
        profiles for display fields required by the participant management UI.
        This read path belongs to the event-participants feature because it is
        the listing counterpart of registration, status management, and QR
        check-in.
        """
        query = (
            select(
                EventParticipant,
                EventSession.title.label("event_session_title"),
                UserProfile.first_name.label("user_first_name"),
                UserProfile.last_name.label("user_last_name"),
                UserProfile.alias.label("user_alias"),
                UserProfile.image_file_id.label("user_profile_picture_url"),
            )
            .join(EventSession, EventParticipant.event_session_id == EventSession.id)
            .outerjoin(UserProfile, EventParticipant.user_id == UserProfile.user_id)
            .where(EventSession.event_id == event_id)
            .order_by(EventParticipant.created_at.desc())
        )
        if status is not None:
            query = query.where(EventParticipant.status == status)
        query = query.limit(limit).offset(offset)
        result = await self.db.execute(query)
        return [
            self._to_entity(
                orm,
                user_first_name=user_first_name,
                user_last_name=user_last_name,
                user_alias=user_alias,
                user_profile_picture_url=user_profile_picture_url,
                event_session_title=event_session_title,
            )
            for orm, event_session_title, user_first_name, user_last_name, user_alias, user_profile_picture_url in result.all()
        ]

    async def count_participants_by_event(self, event_id: uuid.UUID, *, status: str | None = None) -> int:
        """Return the total participant count across all sessions of an event."""
        query = (
            select(func.count())
            .select_from(EventParticipant)
            .join(EventSession, EventParticipant.event_session_id == EventSession.id)
            .where(EventSession.event_id == event_id)
        )
        if status is not None:
            query = query.where(EventParticipant.status == status)
        result = await self.db.execute(query)
        return result.scalar_one()
