import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_participant_dto import CheckInParticipantInput, CheckInParticipantQrCodeInput, WithdrawRegistrationInput
from app.application.use_cases.event_participant_usecase import EventParticipantUseCase
from app.domain.entities.event_entity import Event, EventParticipant, EventParticipantStatus, EventSession, EventSessionStatus, EventStatus
from app.domain.exceptions.event_participant_exceptions import (
    EventParticipantAlreadyCheckedInError,
    EventParticipantCheckInNotOpenError,
    EventParticipantNotFoundError,
    EventParticipantQrTokenInvalidError,
    EventParticipantQrTokenMismatchError,
    InvalidEventParticipantStatusTransitionError,
)
from app.domain.exceptions.event_session_exceptions import EventSessionNotFoundError
from app.infrastructure.database.repositories.event_participant_repository import EventParticipantRepository
from app.infrastructure.database.repositories.event_repository import EventRepository
from app.infrastructure.database.repositories.event_volunteer_repository import EventVolunteerRepository
from app.infrastructure.database.repositories.role_repository import RoleRepository
from app.infrastructure.database.repositories.user_repository import UserRepository

EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
USER_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
SESSION_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
PARTICIPANT_ID = uuid.UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")
VENUE_ID = uuid.uuid4()


def _event(**overrides):
    defaults = dict(
        id=EVENT_ID,
        title="Test Event",
        description="desc",
        start_date=datetime(2026, 1, 1, tzinfo=UTC),
        end_date=datetime(2026, 1, 2, tzinfo=UTC),
        status=EventStatus.STARTED,
        created_by=CREATOR_ID,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _session(**overrides):
    defaults = dict(
        id=SESSION_ID,
        event_id=EVENT_ID,
        venue_id=VENUE_ID,
        title="Session Title",
        start_datetime=datetime(2026, 1, 1, tzinfo=UTC),
        end_datetime=datetime(2026, 1, 1, 1, tzinfo=UTC),
        status=EventSessionStatus.STARTED,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


def _participant(**overrides):
    defaults = dict(
        id=PARTICIPANT_ID,
        user_id=USER_ID,
        event_session_id=SESSION_ID,
        status=EventParticipantStatus.REGISTERED,
        is_checked_in=False,
    )
    defaults.update(overrides)
    return EventParticipant(**defaults)


def _use_case(participant_repo=None, event_repo=None, qr_token_verifier=None):
    if participant_repo is None:
        participant_repo = MagicMock(spec=EventParticipantRepository)
        participant_repo.get_by_user_and_session = AsyncMock(return_value=_participant())
        participant_repo.get_by_id = AsyncMock(return_value=_participant())
        participant_repo.update_status = AsyncMock(return_value=_participant(status=EventParticipantStatus.CANCELLED))
        participant_repo.check_in = AsyncMock(
            return_value=_participant(status=EventParticipantStatus.ATTENDED, is_checked_in=True, checked_in_by=CREATOR_ID)
        )

    if event_repo is None:
        event_repo = MagicMock(spec=EventRepository)
        event_repo.get_session_by_id = AsyncMock(return_value=_session())
        event_repo.get_event_by_id = AsyncMock(return_value=_event())

    role_repo = MagicMock(spec=RoleRepository)
    event_volunteer_repo = MagicMock(spec=EventVolunteerRepository)
    event_volunteer_repo.get_joined_event_volunteer_for_user = AsyncMock(return_value=None)
    user_repo = MagicMock(spec=UserRepository)
    user_repo.get_by_id = AsyncMock(return_value=None)
    db = AsyncMock(spec=AsyncSession)
    qr_token_verifier = qr_token_verifier or MagicMock(return_value=_qr_payload())
    return (
        EventParticipantUseCase(participant_repo, event_repo, role_repo, db, event_volunteer_repo, user_repo, qr_token_verifier=qr_token_verifier),
        participant_repo,
        event_repo,
        db,
    )


def _withdraw_input():
    return WithdrawRegistrationInput(user_id=USER_ID, event_id=EVENT_ID, session_id=SESSION_ID)


def _check_in_input():
    return CheckInParticipantInput(event_id=EVENT_ID, session_id=SESSION_ID, participant_id=PARTICIPANT_ID, checked_in_by=CREATOR_ID)


def _qr_input():
    return CheckInParticipantQrCodeInput(token="qr.jwt", checked_in_by=CREATOR_ID)


def _qr_payload(**overrides):
    defaults = {
        "sub": str(USER_ID),
        "participant_id": str(PARTICIPANT_ID),
        "event_id": str(EVENT_ID),
        "event_name": "Test Event",
        "event_session_id": str(SESSION_ID),
        "event_session_name": "Session Title",
    }
    defaults.update(overrides)
    return defaults


@pytest.mark.asyncio
async def test_withdraw_locks_user_session_registration_before_update():
    """Fetches the user-session registration with a row lock before withdrawal."""
    uc, participant_repo, _, _ = _use_case()
    await uc.withdraw_registration(_withdraw_input())
    participant_repo.get_by_user_and_session.assert_called_once_with(USER_ID, SESSION_ID, for_update=True)


@pytest.mark.asyncio
async def test_withdraw_sets_status_to_cancelled_and_commits():
    """Cancels an active registration and commits the transaction."""
    uc, participant_repo, _, db = _use_case()
    result = await uc.withdraw_registration(_withdraw_input())
    participant_repo.update_status.assert_called_once_with(participant_id=PARTICIPANT_ID, new_status=EventParticipantStatus.CANCELLED)
    assert result.participant.status == EventParticipantStatus.CANCELLED
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_withdraw_fails_when_registration_missing():
    """Raises EventParticipantNotFoundError when the attendee has no registration."""
    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_user_and_session = AsyncMock(return_value=None)
    uc, _, _, _ = _use_case(participant_repo=participant_repo)
    with pytest.raises(EventParticipantNotFoundError):
        await uc.withdraw_registration(_withdraw_input())


@pytest.mark.asyncio
async def test_withdraw_fails_when_participant_already_checked_in():
    """Raises EventParticipantAlreadyCheckedInError when the attendee already checked in."""
    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_user_and_session = AsyncMock(return_value=_participant(is_checked_in=True))
    uc, _, _, _ = _use_case(participant_repo=participant_repo)
    with pytest.raises(EventParticipantAlreadyCheckedInError):
        await uc.withdraw_registration(_withdraw_input())


@pytest.mark.asyncio
async def test_check_in_locks_participant_before_update():
    """Fetches the participant with a row lock before check-in."""
    uc, participant_repo, _, _ = _use_case()
    await uc.check_in_participant(_check_in_input())
    participant_repo.get_by_id.assert_called_once_with(PARTICIPANT_ID, for_update=True)


@pytest.mark.asyncio
async def test_check_in_records_actor_and_commits():
    """Marks the participant checked in with the actor ID and commits."""
    uc, participant_repo, _, db = _use_case()
    result = await uc.check_in_participant(_check_in_input())
    assert participant_repo.check_in.call_args.kwargs["participant_id"] == PARTICIPANT_ID
    assert participant_repo.check_in.call_args.kwargs["checked_in_by"] == CREATOR_ID
    assert result.participant.is_checked_in is True
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_check_in_fails_when_participant_missing():
    """Raises EventParticipantNotFoundError when the participant record is absent."""
    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_id = AsyncMock(return_value=None)
    uc, _, _, _ = _use_case(participant_repo=participant_repo)
    with pytest.raises(EventParticipantNotFoundError):
        await uc.check_in_participant(_check_in_input())


@pytest.mark.asyncio
async def test_check_in_fails_when_session_missing():
    """Raises EventSessionNotFoundError when the participant session no longer exists."""
    event_repo = MagicMock(spec=EventRepository)
    event_repo.get_session_by_id = AsyncMock(return_value=None)
    uc, _, _, _ = _use_case(event_repo=event_repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.check_in_participant(_check_in_input())


@pytest.mark.asyncio
async def test_check_in_fails_when_session_not_open():
    """Raises EventParticipantCheckInNotOpenError when session status disallows check-in."""
    event_repo = MagicMock(spec=EventRepository)
    event_repo.get_session_by_id = AsyncMock(return_value=_session(status=EventSessionStatus.ENDED))
    event_repo.get_event_by_id = AsyncMock(return_value=_event())
    uc, _, _, _ = _use_case(event_repo=event_repo)
    with pytest.raises(EventParticipantCheckInNotOpenError):
        await uc.check_in_participant(_check_in_input())


@pytest.mark.asyncio
async def test_check_in_fails_when_participant_status_is_cancelled():
    """Raises InvalidEventParticipantStatusTransitionError when participant is cancelled."""
    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_id = AsyncMock(return_value=_participant(status=EventParticipantStatus.CANCELLED))
    uc, _, _, _ = _use_case(participant_repo=participant_repo)
    with pytest.raises(InvalidEventParticipantStatusTransitionError):
        await uc.check_in_participant(_check_in_input())


@pytest.mark.asyncio
async def test_qr_check_in_verifies_token_and_locks_participant_before_update():
    """Verifies QR token and locks the participant before mutating check-in state."""
    qr_token_verifier = MagicMock(return_value=_qr_payload())
    uc, participant_repo, _, _ = _use_case(qr_token_verifier=qr_token_verifier)
    await uc.check_in_participant_with_qr_code(_qr_input())
    qr_token_verifier.assert_called_once_with("qr.jwt")
    participant_repo.get_by_id.assert_called_once_with(PARTICIPANT_ID, for_update=True)


@pytest.mark.asyncio
async def test_qr_check_in_records_actor_and_commits():
    """Marks the QR participant checked in with the actor ID and commits."""
    uc, participant_repo, _, db = _use_case()
    result = await uc.check_in_participant_with_qr_code(_qr_input())
    assert participant_repo.check_in.call_args.kwargs["participant_id"] == PARTICIPANT_ID
    assert participant_repo.check_in.call_args.kwargs["checked_in_by"] == CREATOR_ID
    assert result.participant.is_checked_in is True
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_qr_check_in_fails_when_token_invalid():
    """Raises EventParticipantQrTokenInvalidError when QR token verification fails."""
    qr_token_verifier = MagicMock(side_effect=ValueError("Token has expired"))
    uc, _, _, _ = _use_case(qr_token_verifier=qr_token_verifier)
    with pytest.raises(EventParticipantQrTokenInvalidError):
        await uc.check_in_participant_with_qr_code(_qr_input())


@pytest.mark.asyncio
async def test_qr_check_in_fails_when_token_user_does_not_match_participant():
    """Raises EventParticipantQrTokenMismatchError when token attendee differs from participant."""
    qr_token_verifier = MagicMock(return_value=_qr_payload(sub=str(uuid.uuid4())))
    uc, _, _, _ = _use_case(qr_token_verifier=qr_token_verifier)
    with pytest.raises(EventParticipantQrTokenMismatchError):
        await uc.check_in_participant_with_qr_code(_qr_input())
