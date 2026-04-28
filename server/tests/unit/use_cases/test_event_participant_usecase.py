"""Unit tests for EventParticipantUseCase (register_for_session and update_participant_status)."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_participant_dto import RegisterForSessionInput, UpdateParticipantStatusInput
from app.application.use_cases.event_participant_usecase import EventParticipantUseCase
from app.domain.entities.event_entity import (
    Event,
    EventParticipant,
    EventParticipantStatus,
    EventSession,
    EventSessionStatus,
    EventStatus,
)
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.domain.exceptions.event_participant_exceptions import (
    DuplicateEventParticipantError,
    EventParticipantNotFoundError,
    InvalidEventParticipantStatusTransitionError,
    RegistrationNotOpenError,
    SessionSlotsFullError,
    UnauthorizedEventParticipantOperationError,
)
from app.domain.exceptions.event_session_exceptions import EventSessionNotFoundError
from app.infrastructure.database.repositories.event_participant_repository import EventParticipantRepository
from app.infrastructure.database.repositories.event_repository import EventRepository

EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
OTHER_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
USER_ID = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
SESSION_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
PARTICIPANT_ID = uuid.UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")
VENUE_ID = uuid.uuid4()

EVENT_START = datetime(2025, 6, 1, tzinfo=UTC)
EVENT_END = datetime(2025, 6, 10, tzinfo=UTC)
SESSION_START = datetime(2025, 6, 2, tzinfo=UTC)
SESSION_END = datetime(2025, 6, 3, tzinfo=UTC)


def _sample_event(**overrides) -> Event:
    defaults = dict(
        id=EVENT_ID,
        title="Test Event",
        description="<p>desc</p>",
        start_date=EVENT_START,
        end_date=EVENT_END,
        status=EventStatus.POSTED,
        created_by=CREATOR_ID,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _sample_session(**overrides) -> EventSession:
    defaults = dict(
        id=SESSION_ID,
        event_id=EVENT_ID,
        venue_id=VENUE_ID,
        title="Session Title",
        description=None,
        start_datetime=SESSION_START,
        end_datetime=SESSION_END,
        status=EventSessionStatus.POSTED,
        max_slots=None,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


def _sample_participant(**overrides) -> EventParticipant:
    defaults = dict(
        id=PARTICIPANT_ID,
        user_id=USER_ID,
        event_session_id=SESSION_ID,
        status=EventParticipantStatus.REGISTERED,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return EventParticipant(**defaults)


# ---------------------------------------------------------------------------
# RegisterForSession
# ---------------------------------------------------------------------------


def _make_register_repos():
    event_repo = MagicMock(spec=EventRepository)
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session())
    event_repo.get_venue_capacity = AsyncMock(return_value=100)

    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_user_and_session = AsyncMock(return_value=None)
    participant_repo.count_active_participants = AsyncMock(return_value=0)
    participant_repo.create = AsyncMock(return_value=_sample_participant())

    return event_repo, participant_repo


def _make_register_uc(event_repo=None, participant_repo=None):
    default_event_repo, default_participant_repo = _make_register_repos()
    event_repo = event_repo or default_event_repo
    participant_repo = participant_repo or default_participant_repo
    db = AsyncMock(spec=AsyncSession)
    return EventParticipantUseCase(participant_repo, event_repo, db), event_repo, participant_repo, db


def _register_input(**overrides):
    defaults = dict(user_id=USER_ID, session_id=SESSION_ID)
    defaults.update(overrides)
    return RegisterForSessionInput(**defaults)


@pytest.mark.asyncio
async def test_register_raises_session_not_found_when_session_missing():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=None)
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_raises_registration_not_open_when_session_is_draft():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.DRAFT))
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(RegistrationNotOpenError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_raises_registration_not_open_when_session_is_started():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.STARTED))
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(RegistrationNotOpenError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_raises_registration_not_open_when_session_is_cancelled():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.CANCELLED))
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(RegistrationNotOpenError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_raises_duplicate_when_user_already_registered():
    event_repo, participant_repo = _make_register_repos()
    participant_repo.get_by_user_and_session = AsyncMock(return_value=_sample_participant())
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(DuplicateEventParticipantError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_acquires_session_lock_before_checking_status():
    uc, event_repo, _, _ = _make_register_uc()
    await uc.register_for_session(_register_input())
    event_repo.get_session_by_id.assert_called_once_with(SESSION_ID, for_update=True)


@pytest.mark.asyncio
async def test_register_calls_create_with_correct_args():
    uc, _, participant_repo, _ = _make_register_uc()
    await uc.register_for_session(_register_input())
    participant_repo.create.assert_called_once_with(user_id=USER_ID, session_id=SESSION_ID)


@pytest.mark.asyncio
async def test_register_commits_on_success():
    uc, _, _, db = _make_register_uc()
    await uc.register_for_session(_register_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_register_rollbacks_on_repo_failure():
    event_repo, participant_repo = _make_register_repos()
    participant_repo.create = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, _, db = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(RuntimeError):
        await uc.register_for_session(_register_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_register_does_not_commit_when_session_not_found():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=None)
    uc, _, _, db = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.register_for_session(_register_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_register_returns_registered_participant():
    uc, _, _, _ = _make_register_uc()
    result = await uc.register_for_session(_register_input())
    assert result.participant.id == PARTICIPANT_ID
    assert result.participant.status == EventParticipantStatus.REGISTERED


@pytest.mark.asyncio
async def test_register_raises_slots_full_when_session_max_slots_exhausted():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(max_slots=50))
    participant_repo.count_active_participants = AsyncMock(return_value=50)
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(SessionSlotsFullError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_raises_slots_full_when_venue_capacity_exhausted():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(max_slots=None))
    event_repo.get_venue_capacity = AsyncMock(return_value=100)
    participant_repo.count_active_participants = AsyncMock(return_value=100)
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(SessionSlotsFullError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_uses_session_max_slots_over_venue_capacity():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(max_slots=10))
    event_repo.get_venue_capacity = AsyncMock(return_value=100)
    participant_repo.count_active_participants = AsyncMock(return_value=10)
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    with pytest.raises(SessionSlotsFullError):
        await uc.register_for_session(_register_input())


@pytest.mark.asyncio
async def test_register_succeeds_when_slot_below_session_max_slots():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(max_slots=50))
    participant_repo.count_active_participants = AsyncMock(return_value=49)
    uc, _, _, _ = _make_register_uc(event_repo, participant_repo)
    result = await uc.register_for_session(_register_input())
    assert result.participant.id == PARTICIPANT_ID


@pytest.mark.asyncio
async def test_register_fetches_venue_capacity_when_session_max_slots_is_none():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(max_slots=None))
    uc, event_repo_used, _, _ = _make_register_uc(event_repo, participant_repo)
    await uc.register_for_session(_register_input())
    event_repo_used.get_venue_capacity.assert_called_once_with(VENUE_ID)


@pytest.mark.asyncio
async def test_register_skips_venue_capacity_lookup_when_session_max_slots_set():
    event_repo, participant_repo = _make_register_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session(max_slots=50))
    uc, event_repo_used, _, _ = _make_register_uc(event_repo, participant_repo)
    await uc.register_for_session(_register_input())
    event_repo_used.get_venue_capacity.assert_not_called()


# ---------------------------------------------------------------------------
# UpdateParticipantStatus
# ---------------------------------------------------------------------------


def _make_update_repos():
    event_repo = MagicMock(spec=EventRepository)
    event_repo.get_session_by_id = AsyncMock(return_value=_sample_session())
    event_repo.get_event_by_id = AsyncMock(return_value=_sample_event())

    participant_repo = MagicMock(spec=EventParticipantRepository)
    participant_repo.get_by_id = AsyncMock(return_value=_sample_participant())
    participant_repo.update_status = AsyncMock(return_value=_sample_participant(status=EventParticipantStatus.ATTENDED))

    return event_repo, participant_repo


def _make_update_uc(event_repo=None, participant_repo=None):
    default_event_repo, default_participant_repo = _make_update_repos()
    event_repo = event_repo or default_event_repo
    participant_repo = participant_repo or default_participant_repo
    db = AsyncMock(spec=AsyncSession)
    return EventParticipantUseCase(participant_repo, event_repo, db), event_repo, participant_repo, db


def _update_input(**overrides):
    defaults = dict(
        participant_id=PARTICIPANT_ID,
        updated_by=CREATOR_ID,
        new_status=EventParticipantStatus.ATTENDED,
    )
    defaults.update(overrides)
    return UpdateParticipantStatusInput(**defaults)


@pytest.mark.asyncio
async def test_update_raises_participant_not_found_when_participant_missing():
    event_repo, participant_repo = _make_update_repos()
    participant_repo.get_by_id = AsyncMock(return_value=None)
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(EventParticipantNotFoundError):
        await uc.update_participant_status(_update_input())


@pytest.mark.asyncio
async def test_update_raises_session_not_found_when_session_missing():
    event_repo, participant_repo = _make_update_repos()
    event_repo.get_session_by_id = AsyncMock(return_value=None)
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.update_participant_status(_update_input())


@pytest.mark.asyncio
async def test_update_raises_event_not_found_when_event_missing():
    event_repo, participant_repo = _make_update_repos()
    event_repo.get_event_by_id = AsyncMock(return_value=None)
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(EventNotFoundError):
        await uc.update_participant_status(_update_input())


@pytest.mark.asyncio
async def test_update_raises_unauthorized_when_not_event_creator():
    uc, _, _, _ = _make_update_uc()
    with pytest.raises(UnauthorizedEventParticipantOperationError):
        await uc.update_participant_status(_update_input(updated_by=OTHER_ID))


@pytest.mark.asyncio
async def test_update_raises_transition_error_when_status_is_attended():
    event_repo, participant_repo = _make_update_repos()
    participant_repo.get_by_id = AsyncMock(return_value=_sample_participant(status=EventParticipantStatus.ATTENDED))
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(InvalidEventParticipantStatusTransitionError):
        await uc.update_participant_status(_update_input(new_status=EventParticipantStatus.REGISTERED))


@pytest.mark.asyncio
async def test_update_raises_transition_error_when_status_is_no_show():
    event_repo, participant_repo = _make_update_repos()
    participant_repo.get_by_id = AsyncMock(return_value=_sample_participant(status=EventParticipantStatus.NO_SHOW))
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(InvalidEventParticipantStatusTransitionError):
        await uc.update_participant_status(_update_input(new_status=EventParticipantStatus.ATTENDED))


@pytest.mark.asyncio
async def test_update_raises_transition_error_when_status_is_cancelled():
    event_repo, participant_repo = _make_update_repos()
    participant_repo.get_by_id = AsyncMock(return_value=_sample_participant(status=EventParticipantStatus.CANCELLED))
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(InvalidEventParticipantStatusTransitionError):
        await uc.update_participant_status(_update_input(new_status=EventParticipantStatus.ATTENDED))


@pytest.mark.asyncio
async def test_update_raises_participant_not_found_when_update_returns_none():
    event_repo, participant_repo = _make_update_repos()
    participant_repo.update_status = AsyncMock(return_value=None)
    uc, _, _, _ = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(EventParticipantNotFoundError):
        await uc.update_participant_status(_update_input())


@pytest.mark.asyncio
async def test_update_acquires_participant_lock_before_reading():
    uc, _, participant_repo, _ = _make_update_uc()
    await uc.update_participant_status(_update_input())
    participant_repo.get_by_id.assert_called_once_with(PARTICIPANT_ID, for_update=True)


@pytest.mark.asyncio
async def test_update_calls_update_status_with_correct_args():
    uc, _, participant_repo, _ = _make_update_uc()
    await uc.update_participant_status(_update_input())
    participant_repo.update_status.assert_called_once_with(
        participant_id=PARTICIPANT_ID,
        new_status=EventParticipantStatus.ATTENDED,
    )


@pytest.mark.asyncio
async def test_update_commits_on_success():
    uc, _, _, db = _make_update_uc()
    await uc.update_participant_status(_update_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_rollbacks_on_repo_failure():
    event_repo, participant_repo = _make_update_repos()
    participant_repo.update_status = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, _, db = _make_update_uc(event_repo, participant_repo)
    with pytest.raises(RuntimeError):
        await uc.update_participant_status(_update_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_update_returns_updated_and_old_participant():
    uc, _, _, _ = _make_update_uc()
    result = await uc.update_participant_status(_update_input())
    assert result.participant.status == EventParticipantStatus.ATTENDED
    assert result.old_participant.id == PARTICIPANT_ID
    assert result.old_participant.status == EventParticipantStatus.REGISTERED
