"""Data-access layer for event volunteer assignments and cross-event participant queries.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE) on mutating flows:
    ``get_event_volunteer_by_id`` and ``get_event_volunteer_by_volunteer_and_event``
    accept a ``for_update`` flag that acquires a row-level lock on the target row
    before any check-then-mutate sequence.  This serialises concurrent assignment
    attempts for the same (volunteer, event) pair and eliminates TOCTOU races on
    status transitions and deletion.  The unique index on ``(volunteer_id, event_id)``
    provides an additional safety net at the storage layer.

    ``get_event_by_id`` similarly accepts ``for_update`` so that the use-case can
    lock the parent event row before the organizer-ownership check, preventing a
    concurrent event deletion from racing with the assignment.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.event_entity import (
    Event as EventEntity,
)
from app.domain.entities.event_entity import (
    EventParticipant as EventParticipantEntity,
)
from app.domain.entities.event_entity import (
    EventParticipantStatus,
    EventStatus,
    EventVolunteerStatus,
)
from app.domain.entities.event_entity import (
    EventVolunteer as EventVolunteerEntity,
)
from app.domain.entities.volunteer_entity import Volunteer as VolunteerEntity
from app.domain.entities.volunteer_entity import VolunteerStatus
from app.infrastructure.database.models.event_models import Event, EventParticipant, EventSession, EventVolunteer
from app.infrastructure.database.models.user_models import User
from app.infrastructure.database.models.volunteer_models import Volunteer


class EventVolunteerRepository:
    """Data-access layer for event volunteer assignments and event participant queries."""

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
    def _to_volunteer_entity(orm: Volunteer) -> VolunteerEntity:
        """Map a Volunteer ORM row to its domain entity."""
        return VolunteerEntity(
            id=orm.id,
            user_id=orm.user_id,
            contact_phone=orm.contact_phone,
            volunteer_role_id=orm.volunteer_role_id,
            status=VolunteerStatus(orm.status),
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_event_volunteer_entity(orm: EventVolunteer) -> EventVolunteerEntity:
        """Map an EventVolunteer ORM row to its domain entity."""
        return EventVolunteerEntity(
            id=orm.id,
            volunteer_id=orm.volunteer_id,
            event_id=orm.event_id,
            status=EventVolunteerStatus(orm.status),
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_participant_entity(orm: EventParticipant) -> EventParticipantEntity:
        """Map an EventParticipant ORM row to its domain entity."""
        return EventParticipantEntity(
            id=orm.id,
            user_id=orm.user_id,
            event_session_id=orm.event_session_id,
            status=EventParticipantStatus(orm.status),
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

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

    async def get_volunteer_by_id(self, volunteer_id: uuid.UUID) -> VolunteerEntity | None:
        """Return the volunteer entity for the given primary key.

        Args:
            volunteer_id: UUID of the volunteer record.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        result = await self.db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
        orm = result.scalar_one_or_none()
        return self._to_volunteer_entity(orm) if orm else None

    async def get_volunteer_by_alias(self, alias: str) -> VolunteerEntity | None:
        """Return the volunteer entity whose linked user has the given alias.

        Args:
            alias: The unique user alias string.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        result = await self.db.execute(select(Volunteer).join(User, Volunteer.user_id == User.id).where(User.alias == alias))
        orm = result.scalar_one_or_none()
        return self._to_volunteer_entity(orm) if orm else None

    async def get_event_volunteer_by_id(self, event_volunteer_id: uuid.UUID, *, for_update: bool = False) -> EventVolunteerEntity | None:
        """Return the event-volunteer entity for the given ID, optionally locking the row.

        Args:
            event_volunteer_id: UUID of the event-volunteer assignment.
            for_update:         When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(EventVolunteer).where(EventVolunteer.id == event_volunteer_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_event_volunteer_entity(orm) if orm else None

    async def get_event_volunteer_by_volunteer_and_event(
        self,
        volunteer_id: uuid.UUID,
        event_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> EventVolunteerEntity | None:
        """Return the event-volunteer record for a (volunteer, event) pair, optionally locking.

        Args:
            volunteer_id: UUID of the volunteer.
            event_id:     UUID of the event.
            for_update:   When ``True``, acquires a ``SELECT … FOR UPDATE`` lock.

        Returns:
            The matching entity, or ``None`` if no row exists.
        """
        query = select(EventVolunteer).where(
            EventVolunteer.volunteer_id == volunteer_id,
            EventVolunteer.event_id == event_id,
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_event_volunteer_entity(orm) if orm else None

    async def get_joined_event_volunteer_for_user(self, user_id: uuid.UUID, event_id: uuid.UUID) -> EventVolunteerEntity | None:
        """Return the JOINED event-volunteer record for a user-event pair via a JOIN.

        Joins ``event_volunteers`` with ``volunteers`` on ``volunteer_id`` to look up
        assignments by the volunteer's ``user_id`` rather than the volunteer's primary
        key.  Returns only rows with ``status = JOINED``.

        Args:
            user_id:  UUID of the user to check.
            event_id: UUID of the event.

        Returns:
            The matching entity, or ``None`` if no JOINED assignment exists.
        """
        result = await self.db.execute(
            select(EventVolunteer)
            .join(Volunteer, EventVolunteer.volunteer_id == Volunteer.id)
            .where(
                Volunteer.user_id == user_id,
                EventVolunteer.event_id == event_id,
                EventVolunteer.status == EventVolunteerStatus.JOINED,
            )
        )
        orm = result.scalar_one_or_none()
        return self._to_event_volunteer_entity(orm) if orm else None

    async def get_event_volunteers_by_event(
        self,
        event_id: uuid.UUID,
        *,
        status: EventVolunteerStatus | None = None,
    ) -> list[EventVolunteerEntity]:
        """Return all volunteer assignments for an event, optionally filtered by status.

        Args:
            event_id: UUID of the target event.
            status:   When provided, restricts results to assignments with the given status.

        Returns:
            List of ``EventVolunteerEntity`` objects ordered by creation date descending.
        """
        query = select(EventVolunteer).where(EventVolunteer.event_id == event_id).order_by(EventVolunteer.created_at.desc())
        if status is not None:
            query = query.where(EventVolunteer.status == status)
        result = await self.db.execute(query)
        return [self._to_event_volunteer_entity(orm) for orm in result.scalars().all()]

    async def create_event_volunteer(self, volunteer_id: uuid.UUID, event_id: uuid.UUID) -> EventVolunteerEntity:
        """Insert a new event-volunteer row with PENDING status and return the persisted entity."""
        orm = EventVolunteer(
            volunteer_id=volunteer_id,
            event_id=event_id,
            status=EventVolunteerStatus.PENDING,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_event_volunteer_entity(orm)

    async def update_event_volunteer_status(self, event_volunteer_id: uuid.UUID, new_status: EventVolunteerStatus) -> EventVolunteerEntity | None:
        """Update the status of an existing event-volunteer row.

        The row must already be locked by the calling transaction via
        ``get_event_volunteer_by_id(for_update=True)`` before this method is invoked.

        Args:
            event_volunteer_id: Primary key of the event-volunteer to update.
            new_status:         The target ``EventVolunteerStatus`` value.

        Returns:
            The updated ``EventVolunteerEntity``, or ``None`` if no matching row exists.
        """
        result = await self.db.execute(select(EventVolunteer).where(EventVolunteer.id == event_volunteer_id).with_for_update())
        orm = result.scalar_one_or_none()
        if orm is None:
            return None
        orm.status = new_status
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_event_volunteer_entity(orm)

    async def delete_event_volunteer(self, event_volunteer_id: uuid.UUID) -> bool:
        """Delete an event-volunteer row by primary key.

        Args:
            event_volunteer_id: UUID of the assignment to remove.

        Returns:
            ``True`` if a row was deleted, ``False`` if no matching row existed.
        """
        result = await self.db.execute(select(EventVolunteer).where(EventVolunteer.id == event_volunteer_id))
        orm = result.scalar_one_or_none()
        if orm is None:
            return False
        await self.db.delete(orm)
        await self.db.flush()
        return True

    async def get_participants_by_event(
        self,
        event_id: uuid.UUID,
        *,
        status: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[EventParticipantEntity]:
        """Return paginated participants across all sessions of an event.

        Joins ``event_participants`` with ``event_sessions`` on ``event_session_id``
        to filter by the parent event ID, since participants belong to sessions rather
        than events directly.

        Args:
            event_id: UUID of the parent event.
            status:   When provided, restricts results to participants with the given status.
            limit:    Maximum number of rows to return.
            offset:   Number of rows to skip before collecting results.

        Returns:
            List of ``EventParticipantEntity`` objects ordered by creation date descending.
        """
        query = (
            select(EventParticipant)
            .join(EventSession, EventParticipant.event_session_id == EventSession.id)
            .where(EventSession.event_id == event_id)
            .order_by(EventParticipant.created_at.desc())
        )
        if status is not None:
            query = query.where(EventParticipant.status == status)
        query = query.limit(limit).offset(offset)
        result = await self.db.execute(query)
        return [self._to_participant_entity(orm) for orm in result.scalars().all()]

    async def count_participants_by_event(self, event_id: uuid.UUID, *, status: str | None = None) -> int:
        """Return the total number of participants across all sessions of an event.

        Args:
            event_id: UUID of the parent event.
            status:   When provided, counts only participants with the given status.

        Returns:
            Integer row count.
        """
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
