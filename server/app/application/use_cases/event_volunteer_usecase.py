"""Use cases for event volunteer assignment management.

Business rules:
  - Only the event organizer (``event.created_by``) may assign, update, remove, or list
    event volunteers.
  - Active volunteers may apply to public/active events, which creates a PENDING
    event-volunteer row for organizer review.
  - Status transitions for event volunteers are PENDING → JOINED, PENDING → REJECTED,
    and JOINED → LEFT.  All other transitions are rejected.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_volunteer_dto import (
    ApplyEventVolunteerInput,
    ApplyEventVolunteerOutput,
    AssignVolunteerInput,
    AssignVolunteerOutput,
    ListEventVolunteersInput,
    ListEventVolunteersOutput,
    RemoveEventVolunteerInput,
    RemoveEventVolunteerOutput,
    UpdateEventVolunteerStatusInput,
    UpdateEventVolunteerStatusOutput,
)
from app.application.interfaces.event_volunteer_interface import IEventVolunteerRepository
from app.domain.entities.event_entity import EventStatus, EventVolunteerStatus
from app.domain.entities.volunteer_entity import VolunteerStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_volunteer_exceptions import (
    EventVolunteerAlreadyExistsError,
    EventVolunteerApplicationClosedError,
    EventVolunteerNotFoundError,
    InvalidEventVolunteerStatusTransitionError,
    UnauthorizedEventVolunteerOperationError,
)
from app.domain.exceptions.volunteer_exceptions import VolunteerInactiveError, VolunteerNotFoundError

_ALLOWED_VOLUNTEER_TRANSITIONS: dict[EventVolunteerStatus, frozenset[EventVolunteerStatus]] = {
    EventVolunteerStatus.PENDING: frozenset(
        {
            EventVolunteerStatus.JOINED,
            EventVolunteerStatus.REJECTED,
        }
    ),
    EventVolunteerStatus.JOINED: frozenset(
        {
            EventVolunteerStatus.LEFT,
        }
    ),
}

_APPLICATION_OPEN_EVENT_STATUSES = frozenset({EventStatus.POSTED, EventStatus.STARTED})


class EventVolunteerUseCase:
    """Application service for event volunteer assignment management.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
        ``assign_volunteer`` — acquires a row-level lock on the parent event row
        before any ownership check, then locks the event-volunteer row (if it
        exists) before the duplicate-assignment check.  This serialises two
        concurrent requests attempting to assign the same volunteer to the same
        event: the second request blocks on the lock, observes the committed row,
        and raises ``EventVolunteerAlreadyExistsError``.  The unique database
        index on ``(volunteer_id, event_id)`` provides a secondary safety net.

        ``apply_to_event`` — acquires the same parent event row lock before the
        event-state check and duplicate-assignment check.  This serialises two
        concurrent self-application requests for the same event so the later
        request observes the committed assignment and returns a conflict.

        ``update_volunteer_status`` — acquires a row-level lock on the
        event-volunteer row before the ownership and transition checks to
        serialise concurrent status updates on the same assignment and eliminate
        TOCTOU races between the validity check and the subsequent write.

        ``remove_volunteer`` — acquires a row-level lock on the event-volunteer
        row before the ownership check and the delete to prevent a concurrent
        status update from racing with the removal.

    Args:
        repo: Concrete implementation of ``IEventVolunteerRepository``.
        db:   The active async database session used for commit and rollback.
    """

    def __init__(self, repo: IEventVolunteerRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def assign_volunteer(self, data: AssignVolunteerInput) -> AssignVolunteerOutput:
        """Assign and accept a volunteer to an event.

        Only the event organizer may perform this action.  Acquiring a lock on
        the parent event row first prevents a concurrent event deletion from
        racing with the assignment.

        Args:
            data: ``AssignVolunteerInput`` containing the event ID, volunteer ID,
                  and the actor's user ID.

        Returns:
            ``AssignVolunteerOutput`` wrapping the newly created
            ``EventVolunteer`` entity with JOINED status.

        Raises:
            EventNotFoundError:                No event exists for ``data.event_id``.
            UnauthorizedEventVolunteerOperationError: Actor is not the event organizer.
            VolunteerNotFoundError:             No volunteer exists for ``data.volunteer_id``.
            EventVolunteerAlreadyExistsError:   The volunteer is already assigned to this event.
        """
        event = await self.repo.get_event_by_id(data.event_id, for_update=True)
        if not event:
            raise EventNotFoundError(str(data.event_id))

        if event.created_by != data.actor_id:
            raise UnauthorizedEventVolunteerOperationError()

        volunteer = await self.repo.get_volunteer_by_alias(data.alias)
        if not volunteer:
            raise VolunteerNotFoundError(data.alias)

        try:
            existing = await self.repo.get_event_volunteer_by_volunteer_and_event(volunteer.id, data.event_id, for_update=True)
            if existing:
                raise EventVolunteerAlreadyExistsError(str(volunteer.id), str(data.event_id))

            event_volunteer = await self.repo.create_event_volunteer(
                volunteer_id=volunteer.id,
                event_id=data.event_id,
            )
        except (
            EventVolunteerAlreadyExistsError,
            EventNotFoundError,
            VolunteerNotFoundError,
            UnauthorizedEventVolunteerOperationError,
        ):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return AssignVolunteerOutput(event_volunteer=event_volunteer)

    async def apply_to_event(self, data: ApplyEventVolunteerInput) -> ApplyEventVolunteerOutput:
        """Create a pending event-volunteer application for the authenticated volunteer.

        The caller is resolved through their volunteer profile rather than an
        organizer-supplied alias.  A row-level lock on the event serialises
        concurrent applications for the same event and protects the status check
        from racing with event updates.

        Args:
            data: ``ApplyEventVolunteerInput`` containing the event ID, actor ID,
                  and optional applicant message for audit context.

        Returns:
            ``ApplyEventVolunteerOutput`` wrapping the newly created
            ``EventVolunteer`` entity with PENDING status.

        Raises:
            EventNotFoundError: No event exists for ``data.event_id``.
            EventVolunteerApplicationClosedError: Event status does not accept applications.
            VolunteerNotFoundError: The caller has no volunteer profile.
            VolunteerInactiveError: The caller's volunteer profile is not active.
            EventVolunteerAlreadyExistsError: The volunteer already has an event assignment/application.
        """
        event = await self.repo.get_event_by_id(data.event_id, for_update=True)
        if not event:
            raise EventNotFoundError(str(data.event_id))

        if event.status not in _APPLICATION_OPEN_EVENT_STATUSES:
            raise EventVolunteerApplicationClosedError(str(data.event_id))

        volunteer = await self.repo.get_volunteer_by_user_id(data.actor_id)
        if not volunteer:
            raise VolunteerNotFoundError(str(data.actor_id))

        if volunteer.status != VolunteerStatus.ACTIVE:
            raise VolunteerInactiveError(str(volunteer.id))

        try:
            existing = await self.repo.get_event_volunteer_by_volunteer_and_event(volunteer.id, data.event_id, for_update=True)
            if existing:
                raise EventVolunteerAlreadyExistsError(str(volunteer.id), str(data.event_id))

            event_volunteer = await self.repo.create_event_volunteer(
                volunteer_id=volunteer.id,
                event_id=data.event_id,
                status=EventVolunteerStatus.PENDING,
            )
        except (
            EventVolunteerAlreadyExistsError,
            EventNotFoundError,
            EventVolunteerApplicationClosedError,
            VolunteerInactiveError,
            VolunteerNotFoundError,
        ):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return ApplyEventVolunteerOutput(event_volunteer=event_volunteer)

    async def update_volunteer_status(self, data: UpdateEventVolunteerStatusInput) -> UpdateEventVolunteerStatusOutput:
        """Update the status of an event volunteer assignment.

        Acquires a row-level lock on the event-volunteer row before all checks
        to serialise concurrent status updates on the same record.  Only the
        event organizer may perform this action.

        Transition rules:
            PENDING → JOINED:   Volunteer accepted for the event.
            PENDING → REJECTED: Volunteer rejected.
            JOINED  → LEFT:     Volunteer left the event after joining.

        Args:
            data: ``UpdateEventVolunteerStatusInput`` with the event-volunteer ID,
                  actor's user ID, and the target status.

        Returns:
            ``UpdateEventVolunteerStatusOutput`` with the updated entity and the
            status value before the transition.

        Raises:
            EventVolunteerNotFoundError:             No event-volunteer row for
                ``data.event_volunteer_id``.
            EventNotFoundError:                      The parent event no longer exists.
            UnauthorizedEventVolunteerOperationError: Actor is not the event organizer.
            InvalidEventVolunteerStatusTransitionError: The current status does not permit
                the requested transition.
        """
        event_volunteer = await self.repo.get_event_volunteer_by_id(data.event_volunteer_id, for_update=True)
        if not event_volunteer:
            raise EventVolunteerNotFoundError(str(data.event_volunteer_id))

        event = await self.repo.get_event_by_id(event_volunteer.event_id)
        if not event:
            raise EventNotFoundError(str(event_volunteer.event_id))

        if event.created_by != data.actor_id:
            raise UnauthorizedEventVolunteerOperationError(str(data.event_volunteer_id))

        old_status = event_volunteer.status
        allowed_targets = _ALLOWED_VOLUNTEER_TRANSITIONS.get(old_status, frozenset())
        if data.new_status not in allowed_targets:
            raise InvalidEventVolunteerStatusTransitionError(
                str(data.event_volunteer_id),
                old_status.value,
                data.new_status.value,
            )

        try:
            updated = await self.repo.update_event_volunteer_status(data.event_volunteer_id, data.new_status)
            if updated is None:
                raise EventVolunteerNotFoundError(str(data.event_volunteer_id))
        except (
            EventVolunteerNotFoundError,
            InvalidEventVolunteerStatusTransitionError,
            UnauthorizedEventVolunteerOperationError,
        ):
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateEventVolunteerStatusOutput(event_volunteer=updated, old_status=old_status)

    async def remove_volunteer(self, data: RemoveEventVolunteerInput) -> RemoveEventVolunteerOutput:
        """Remove a volunteer assignment from an event.

        Acquires a row-level lock on the event-volunteer row before the ownership
        check and the delete, preventing a concurrent status update from racing
        with the removal.  Only the event organizer may perform this action.

        Args:
            data: ``RemoveEventVolunteerInput`` with the event-volunteer ID and
                  the actor's user ID.

        Returns:
            ``RemoveEventVolunteerOutput`` with the snapshot of the deleted entity.

        Raises:
            EventVolunteerNotFoundError:             No event-volunteer row for
                ``data.event_volunteer_id``.
            EventNotFoundError:                      The parent event no longer exists.
            UnauthorizedEventVolunteerOperationError: Actor is not the event organizer.
        """
        event_volunteer = await self.repo.get_event_volunteer_by_id(data.event_volunteer_id, for_update=True)
        if not event_volunteer:
            raise EventVolunteerNotFoundError(str(data.event_volunteer_id))

        event = await self.repo.get_event_by_id(event_volunteer.event_id)
        if not event:
            raise EventNotFoundError(str(event_volunteer.event_id))

        if event.created_by != data.actor_id:
            raise UnauthorizedEventVolunteerOperationError(str(data.event_volunteer_id))

        snapshot = event_volunteer

        try:
            deleted = await self.repo.delete_event_volunteer(data.event_volunteer_id)
            if not deleted:
                raise EventVolunteerNotFoundError(str(data.event_volunteer_id))
        except EventVolunteerNotFoundError, UnauthorizedEventVolunteerOperationError:
            await self.db.rollback()
            raise
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return RemoveEventVolunteerOutput(event_volunteer=snapshot)

    async def list_volunteers(self, data: ListEventVolunteersInput) -> ListEventVolunteersOutput:
        """List all volunteer assignments for an event.

        Read-only; no transaction lock is required.  Only the event organizer
        may view the volunteer roster.

        Args:
            data: ``ListEventVolunteersInput`` with the event ID, actor's user ID,
                  and an optional status filter.

        Returns:
            ``ListEventVolunteersOutput`` with the list of matching
            ``EventVolunteer`` entities.

        Raises:
            EventNotFoundError:                      No event exists for ``data.event_id``.
            UnauthorizedEventVolunteerOperationError: Actor is not the event organizer.
        """
        event = await self.repo.get_event_by_id(data.event_id)
        if not event:
            raise EventNotFoundError(str(data.event_id))

        if event.created_by != data.actor_id:
            raise UnauthorizedEventVolunteerOperationError()

        event_volunteers = await self.repo.get_event_volunteers_by_event(data.event_id, status=data.status)
        return ListEventVolunteersOutput(event_volunteers=event_volunteers)
