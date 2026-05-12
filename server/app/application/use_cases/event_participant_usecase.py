"""Use cases for event session registration, withdrawal, check-in, and participant status management."""

from datetime import UTC, datetime

from arq.connections import ArqRedis
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_participant_dto import (
    CheckInParticipantInput,
    CheckInParticipantOutput,
    RegisterForSessionInput,
    RegisterForSessionOutput,
    UpdateParticipantStatusInput,
    UpdateParticipantStatusOutput,
    WithdrawRegistrationInput,
    WithdrawRegistrationOutput,
)
from app.domain.entities.event_entity import EventParticipantStatus, EventSessionStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_participant_exceptions import (
    DuplicateEventParticipantError,
    EventParticipantAlreadyCheckedInError,
    EventParticipantCheckInNotOpenError,
    EventParticipantNotFoundError,
    InvalidEventParticipantStatusTransitionError,
    RegistrationNotOpenError,
    SessionSlotsFullError,
    UnauthorizedEventParticipantOperationError,
)
from app.domain.exceptions.event_session_exceptions import EventSessionNotFoundError
from app.domain.exceptions.role_exceptions import RoleAlreadyAssignedError
from app.infrastructure.database.repositories.event_participant_repository import EventParticipantRepository
from app.infrastructure.database.repositories.event_repository import EventRepository
from app.infrastructure.database.repositories.event_volunteer_repository import EventVolunteerRepository
from app.infrastructure.database.repositories.role_repository import RoleRepository
from app.infrastructure.database.repositories.user_repository import UserRepository

_REGISTRATION_OPEN_STATUSES = frozenset({EventSessionStatus.POSTED})
_CHECK_IN_OPEN_STATUSES = frozenset({EventSessionStatus.POSTED, EventSessionStatus.STARTED})
_PARTICIPANT_RBAC_ROLE_NAME = "participant"

_ALLOWED_PARTICIPANT_TRANSITIONS: dict[EventParticipantStatus, frozenset[EventParticipantStatus]] = {
    EventParticipantStatus.REGISTERED: frozenset(
        {
            EventParticipantStatus.ATTENDED,
            EventParticipantStatus.NO_SHOW,
            EventParticipantStatus.CANCELLED,
        }
    ),
}


class EventParticipantUseCase:
    """Application service for event session registration, withdrawal, check-in, and participant status management.

    Owns the transaction lifecycle for every mutating operation: commits on
    success, rolls back on any validation or infrastructure failure, then
    re-raises the exception.

    Concurrency strategy:
        ``register_for_session`` — acquires a ``SELECT … FOR UPDATE`` lock on
        the target event session row before validating registration eligibility.
        This serialises concurrent registration attempts for the same session,
        preventing a TOCTOU race where two concurrent requests for the same user
        both read "not registered" and both attempt to insert. Within the locked
        transaction, the duplicate check is authoritative; the unique index on
        ``(user_id, event_session_id)`` serves as the final database-level guard.
        Locking the session row also prevents a status-change race where a session
        transitions to CANCELLED or ENDED between the status check and the insert.

        ``update_participant_status`` — acquires a ``SELECT … FOR UPDATE`` lock on
        the participant row before any read-then-write sequence, serialising
        concurrent status updates on the same participant and eliminating TOCTOU
        races between the transition validity check and the subsequent update.

        ``withdraw_registration`` and ``check_in_participant`` lock the participant
        row before eligibility checks and mutation so a cancellation, status update,
        and check-in for the same attendee cannot interleave into an impossible
        state.

    Args:
        participant_repo: Concrete ``EventParticipantRepository`` providing participant access.
        event_repo:       Concrete ``EventRepository`` providing session and event access.
        role_repo:        ``RoleRepository`` used to assign the RBAC 'participant' role on
                          successful registration without opening a separate transaction.
        db:               The active async database session used for commit and rollback.
    """

    def __init__(
        self,
        participant_repo: EventParticipantRepository,
        event_repo: EventRepository,
        role_repo: RoleRepository,
        db: AsyncSession,
        event_volunteer_repo: EventVolunteerRepository | None = None,
        user_repo: UserRepository | None = None,
        arq: ArqRedis | None = None,
    ) -> None:
        self.participant_repo = participant_repo
        self.event_repo = event_repo
        self.role_repo = role_repo
        self.db = db
        self.event_volunteer_repo = event_volunteer_repo
        self.user_repo = user_repo
        self.arq = arq

    async def register_for_session(self, data: RegisterForSessionInput) -> RegisterForSessionOutput:
        """Register the authenticated user for an event session.

        Acquires a session-level row lock to serialise concurrent registrations,
        guard against concurrent session status changes, and make the slot-count
        check atomic. Because all concurrent registrations for the same session
        must acquire the same row lock, the slot count seen within a locked
        transaction reflects all previously committed registrations, ensuring
        the capacity limit is never exceeded.

        Slot resolution:
            If ``session.max_slots`` is set, that value overrides the venue
            capacity. Otherwise the venue's own capacity is used as the limit.
            A registration with CANCELLED status does not occupy a slot.

        Validation order:
        1. Session exists (with row lock).
        2. Session status allows registration (must be POSTED).
        3. User is not already registered for this session.
        4. Session still has available slots.

        Raises:
            EventSessionNotFoundError:      No session exists for ``data.session_id``.
            RegistrationNotOpenError:       Session status does not permit new registrations.
            DuplicateEventParticipantError: User is already registered for this session.
            SessionSlotsFullError:          All available slots are occupied.
        """
        session = await self.event_repo.get_session_by_id(data.session_id, for_update=True)
        if session is None:
            raise EventSessionNotFoundError(str(data.session_id))

        if session.status not in _REGISTRATION_OPEN_STATUSES:
            raise RegistrationNotOpenError(str(data.session_id), session.status.value)

        existing = await self.participant_repo.get_by_user_and_session(data.user_id, data.session_id)
        if existing is not None:
            raise DuplicateEventParticipantError(str(data.user_id), str(data.session_id))

        effective_slots = session.max_slots
        if effective_slots is None:
            effective_slots = await self.event_repo.get_venue_capacity(session.venue_id)

        if effective_slots is not None:
            active_count = await self.participant_repo.count_active_participants(data.session_id)
            if active_count >= effective_slots:
                raise SessionSlotsFullError(str(data.session_id), active_count, effective_slots)

        try:
            participant = await self.participant_repo.create(
                user_id=data.user_id,
                session_id=data.session_id,
            )
            await self._assign_rbac_participant_role(data.user_id)
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return RegisterForSessionOutput(participant=participant)

    async def withdraw_registration(self, data: WithdrawRegistrationInput) -> WithdrawRegistrationOutput:
        """Cancel the authenticated user's own registration for an event session.

        The participant row is locked before validation so concurrent withdrawal,
        check-in, and organizer status updates on the same registration are
        serialised. Only REGISTERED, not-yet-checked-in participants can withdraw.

        Args:
            data: ``WithdrawRegistrationInput`` containing the authenticated user's
                  ID, event ID, and event session ID.

        Returns:
            ``WithdrawRegistrationOutput`` with the updated participant and the
            original participant snapshot for audit logging.

        Raises:
            EventParticipantNotFoundError: No registration exists for the user-session pair.
            EventParticipantAlreadyCheckedInError: The attendee has already checked in.
            InvalidEventParticipantStatusTransitionError: The current participant status is terminal.
        """
        old_participant = await self.participant_repo.get_by_user_and_session(data.user_id, data.session_id, for_update=True)
        if old_participant is None:
            raise EventParticipantNotFoundError(str(data.session_id))

        session = await self.event_repo.get_session_by_id(data.session_id)
        if session is None or session.event_id != data.event_id:
            raise EventSessionNotFoundError(str(data.session_id))

        if old_participant.is_checked_in:
            raise EventParticipantAlreadyCheckedInError(str(old_participant.id))

        if old_participant.status != EventParticipantStatus.REGISTERED:
            raise InvalidEventParticipantStatusTransitionError(
                str(old_participant.id),
                old_participant.status.value,
                EventParticipantStatus.CANCELLED.value,
            )

        try:
            updated = await self.participant_repo.update_status(
                participant_id=old_participant.id,
                new_status=EventParticipantStatus.CANCELLED,
            )
            if updated is None:
                raise EventParticipantNotFoundError(str(old_participant.id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return WithdrawRegistrationOutput(participant=updated, old_participant=old_participant)

    async def _assign_rbac_participant_role(self, user_id) -> None:
        """Assign the platform 'participant' RBAC role to the user if available.

        Silently skips if no RBAC role named 'participant' exists or if the user
        already holds the assignment, so that missing platform configuration never
        blocks event registration.
        """
        rbac_role = await self.role_repo.get_role_by_name(_PARTICIPANT_RBAC_ROLE_NAME)
        if not rbac_role:
            return

        existing = await self.role_repo.get_active_assignment(user_id, rbac_role.id)
        if existing:
            return

        try:
            await self.role_repo.create_assignment(
                user_id=user_id,
                role_id=rbac_role.id,
                expires_at=None,
                assigned_by=user_id,
            )
        except RoleAlreadyAssignedError:
            return

    async def update_participant_status(self, data: UpdateParticipantStatusInput) -> UpdateParticipantStatusOutput:
        """Update the attendance status of a registered event session participant.

        Only the event creator may perform this operation. Valid transitions
        from REGISTERED are ATTENDED, NO_SHOW, and CANCELLED. All other
        participant statuses are terminal — no further transitions are permitted.

        Validation order:
        1. Participant exists (with row lock).
        2. Participant's session exists.
        3. Parent event exists.
        4. Caller is the event creator.
        5. Status transition is valid from the participant's current status.

        Raises:
            EventParticipantNotFoundError:           No participant record for ``data.participant_id``.
            EventSessionNotFoundError:               The participant's session no longer exists.
            EventNotFoundError:                      The parent event no longer exists.
            UnauthorizedEventParticipantOperationError: Caller is not the event creator.
            InvalidEventParticipantStatusTransitionError: Transition from current status is not allowed.
        """
        old_participant = await self.participant_repo.get_by_id(data.participant_id, for_update=True)
        if old_participant is None:
            raise EventParticipantNotFoundError(str(data.participant_id))

        session = await self.event_repo.get_session_by_id(old_participant.event_session_id)
        if session is None:
            raise EventSessionNotFoundError(str(old_participant.event_session_id))

        event = await self.event_repo.get_event_by_id(session.event_id)
        if event is None:
            raise EventNotFoundError(str(session.event_id))

        if event.created_by != data.updated_by:
            raise UnauthorizedEventParticipantOperationError(str(event.id))

        allowed_targets = _ALLOWED_PARTICIPANT_TRANSITIONS.get(old_participant.status, frozenset())
        if data.new_status not in allowed_targets:
            raise InvalidEventParticipantStatusTransitionError(
                str(old_participant.id),
                old_participant.status.value,
                data.new_status.value,
            )

        try:
            updated = await self.participant_repo.update_status(
                participant_id=data.participant_id,
                new_status=data.new_status,
            )
            if updated is None:
                raise EventParticipantNotFoundError(str(data.participant_id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        return UpdateParticipantStatusOutput(participant=updated, old_participant=old_participant)

    async def check_in_participant(self, data: CheckInParticipantInput) -> CheckInParticipantOutput:
        """Check in a registered attendee and queue an email receipt.

        A participant row lock serialises concurrent check-in and cancellation
        requests for the same attendee. The event/session read validates that
        check-in is being performed by the event creator or a joined volunteer
        while the session is open for arrival. The email receipt is queued after
        the database commit so email delivery cannot roll back a successful
        check-in.

        Args:
            data: ``CheckInParticipantInput`` containing the event ID, session ID,
                  participant ID, and actor ID of the organizer or joined volunteer
                  doing check-in.

        Returns:
            ``CheckInParticipantOutput`` with the checked-in participant and the
            original participant snapshot for audit logging.

        Raises:
            EventParticipantNotFoundError: No participant record exists.
            EventSessionNotFoundError: The participant's session no longer exists.
            EventNotFoundError: The parent event no longer exists.
            UnauthorizedEventParticipantOperationError: Actor cannot check in attendees.
            EventParticipantAlreadyCheckedInError: Participant was already checked in.
            EventParticipantCheckInNotOpenError: Session status does not permit check-in.
            InvalidEventParticipantStatusTransitionError: Participant is not in REGISTERED status.
        """
        old_participant = await self.participant_repo.get_by_id(data.participant_id, for_update=True)
        if old_participant is None:
            raise EventParticipantNotFoundError(str(data.participant_id))

        if old_participant.event_session_id != data.session_id:
            raise EventParticipantNotFoundError(str(data.participant_id))

        session = await self.event_repo.get_session_by_id(old_participant.event_session_id)
        if session is None:
            raise EventSessionNotFoundError(str(old_participant.event_session_id))

        if session.event_id != data.event_id:
            raise EventSessionNotFoundError(str(data.session_id))

        event = await self.event_repo.get_event_by_id(session.event_id)
        if event is None:
            raise EventNotFoundError(str(session.event_id))

        if event.created_by != data.checked_in_by:
            joined_assignment = None
            if self.event_volunteer_repo is not None:
                joined_assignment = await self.event_volunteer_repo.get_joined_event_volunteer_for_user(data.checked_in_by, event.id)
            if joined_assignment is None:
                raise UnauthorizedEventParticipantOperationError(str(old_participant.id))

        if session.status not in _CHECK_IN_OPEN_STATUSES:
            raise EventParticipantCheckInNotOpenError(str(session.id), session.status.value)

        if old_participant.is_checked_in:
            raise EventParticipantAlreadyCheckedInError(str(old_participant.id))

        if old_participant.status != EventParticipantStatus.REGISTERED:
            raise InvalidEventParticipantStatusTransitionError(
                str(old_participant.id),
                old_participant.status.value,
                EventParticipantStatus.ATTENDED.value,
            )

        try:
            updated = await self.participant_repo.check_in(
                participant_id=data.participant_id,
                checked_in_by=data.checked_in_by,
                checked_in_time=datetime.now(UTC),
            )
            if updated is None:
                raise EventParticipantNotFoundError(str(data.participant_id))
        except Exception:
            await self.db.rollback()
            raise

        await self.db.commit()
        await self._send_check_in_receipt(updated, event.title, session.title)
        return CheckInParticipantOutput(participant=updated, old_participant=old_participant)

    async def _send_check_in_receipt(self, participant, event_title: str, session_title: str) -> None:
        """Queue a check-in receipt email for the attendee when email dependencies are available.

        Args:
            participant: The checked-in participant entity.
            event_title: Title of the event that owns the session.
            session_title: Title of the checked-in session.

        Side effects:
            Enqueues a ``send_email_job`` through ARQ when user and queue
            dependencies were provided. Any queue failure is intentionally
            swallowed so the committed check-in remains durable.
        """
        if self.arq is None or self.user_repo is None:
            return

        attendee = await self.user_repo.get_by_id(participant.user_id)
        checker = await self.user_repo.get_by_id(participant.checked_in_by) if participant.checked_in_by else None
        if attendee is None:
            return

        checker_label = checker.email if checker else str(participant.checked_in_by)
        checked_in_time = participant.checked_in_time.isoformat() if participant.checked_in_time else ""
        html = (
            f"<p>Your check-in for <strong>{event_title}</strong> is confirmed.</p>"
            f"<p>Session: {session_title}</p>"
            f"<p>Checked in at: {checked_in_time}</p>"
            f"<p>Checked in by: {checker_label}</p>"
        )

        try:
            from app.infrastructure.messaging.email import send_email

            await send_email(
                self.arq,
                attendee.email,
                f"Check-in receipt for {event_title}",
                html,
            )
        except Exception:
            return
