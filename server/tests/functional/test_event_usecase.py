"""Functional test cases for CreateEventUseCase, UpdateEventMetadataUseCase, and UpdateEventSessionUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_dto import (
    CreateEventInput,
    CreateEventSessionForEventInput,
    CreateEventSessionInput,
    UpdateEventMetadataInput,
    UpdateEventSessionInput,
)
from app.application.use_cases.event_usecase import EventUseCase
from app.domain.entities.event_entity import Event, EventSession, EventSessionStatus, EventStatus
from app.domain.exceptions.event_exceptions import (
    EventDateValidationError,
    EventNotFoundError,
    EventValidationError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
    EventSessionNotFoundError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError, VenueNotPartnerError
from app.infrastructure.database.repositories.event_repository import EventRepository

EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
OTHER_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
VENUE_ID = uuid.uuid4()
SESSION_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")

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
        status=EventStatus.DRAFT,
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
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


# ---------------------------------------------------------------------------
# CreateEventUseCase
# ---------------------------------------------------------------------------


def _make_create_repo():
    repo = MagicMock(spec=EventRepository)
    repo.venue_exists = AsyncMock(return_value=True)
    repo.venue_is_partner = AsyncMock(return_value=True)
    repo.create_event = AsyncMock(return_value=_sample_event())
    repo.create_session = AsyncMock(return_value=_sample_session())
    return repo


def _make_create_uc(repo=None):
    repo = repo or _make_create_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventUseCase(repo, db), repo, db


def _create_input(**overrides):
    sessions = overrides.pop("sessions", [_create_session_input()])
    defaults = dict(
        title="Hackathon",
        description="<p>desc</p>",
        start_date=EVENT_START,
        end_date=EVENT_END,
        created_by=CREATOR_ID,
        banner_url="https://cdn.example.com/banner.jpg",
        sessions=sessions,
    )
    defaults.update(overrides)
    return CreateEventInput(**defaults)


def _create_session_input(**overrides):
    defaults = dict(
        venue_id=VENUE_ID,
        title="Session One",
        description=None,
        start_datetime=SESSION_START,
        end_datetime=SESSION_END,
        max_slots=None,
    )
    defaults.update(overrides)
    return CreateEventSessionInput(**defaults)


@pytest.mark.asyncio
async def test_create_raises_date_error_when_end_before_start():
    """Rejects event when end_date is before start_date."""
    uc, _, _ = _make_create_uc()
    with pytest.raises(EventDateValidationError):
        await uc.create_event(_create_input(start_date=EVENT_END, end_date=EVENT_START))


@pytest.mark.asyncio
async def test_create_raises_date_error_when_end_equals_start():
    """Rejects event when end_date equals start_date."""
    uc, _, _ = _make_create_uc()
    with pytest.raises(EventDateValidationError):
        await uc.create_event(_create_input(start_date=EVENT_START, end_date=EVENT_START))


@pytest.mark.asyncio
async def test_create_raises_validation_error_when_sessions_empty():
    """Rejects event with no sessions."""
    uc, _, _ = _make_create_uc()
    with pytest.raises(EventValidationError):
        await uc.create_event(_create_input(sessions=[]))


@pytest.mark.asyncio
async def test_create_raises_invalid_session_date_when_end_before_start():
    """Rejects session when its end_datetime is before start_datetime."""
    uc, _, _ = _make_create_uc()
    with pytest.raises(InvalidEventSessionDateError):
        await uc.create_event(_create_input(sessions=[_create_session_input(start_datetime=SESSION_END, end_datetime=SESSION_START)]))


@pytest.mark.asyncio
async def test_create_raises_invalid_session_date_when_end_equals_start():
    """Rejects session when its end_datetime equals start_datetime."""
    uc, _, _ = _make_create_uc()
    with pytest.raises(InvalidEventSessionDateError):
        await uc.create_event(_create_input(sessions=[_create_session_input(start_datetime=SESSION_START, end_datetime=SESSION_START)]))


@pytest.mark.asyncio
async def test_create_raises_bounds_error_when_session_start_before_event():
    """Rejects session whose start_datetime falls before the event start."""
    uc, _, _ = _make_create_uc()
    early = datetime(2025, 5, 31, tzinfo=UTC)
    with pytest.raises(EventSessionExceedsEventBoundsError):
        await uc.create_event(_create_input(sessions=[_create_session_input(start_datetime=early, end_datetime=SESSION_END)]))


@pytest.mark.asyncio
async def test_create_raises_bounds_error_when_session_end_after_event():
    """Rejects session whose end_datetime falls after the event end."""
    uc, _, _ = _make_create_uc()
    late = datetime(2025, 6, 11, tzinfo=UTC)
    with pytest.raises(EventSessionExceedsEventBoundsError):
        await uc.create_event(_create_input(sessions=[_create_session_input(start_datetime=SESSION_START, end_datetime=late)]))


@pytest.mark.asyncio
async def test_create_raises_venue_not_found():
    """Rejects event when a session references a non-existent venue."""
    repo = _make_create_repo()
    repo.venue_exists = AsyncMock(return_value=False)
    uc, _, _ = _make_create_uc(repo)
    with pytest.raises(VenueNotFoundError):
        await uc.create_event(_create_input())


@pytest.mark.asyncio
async def test_create_raises_venue_not_partner():
    """Rejects event when a session references a venue that is not partnered."""
    repo = _make_create_repo()
    repo.venue_is_partner = AsyncMock(return_value=False)
    uc, _, _ = _make_create_uc(repo)
    with pytest.raises(VenueNotPartnerError):
        await uc.create_event(_create_input())


@pytest.mark.asyncio
async def test_create_persists_event_and_sessions():
    """Calls create_event and create_session when all inputs are valid."""
    uc, repo, _ = _make_create_uc()
    await uc.create_event(_create_input())
    repo.create_event.assert_called_once()
    repo.create_session.assert_called_once()


@pytest.mark.asyncio
async def test_create_persists_multiple_sessions():
    """Calls create_session once per session in the input list."""
    uc, repo, _ = _make_create_uc()
    await uc.create_event(_create_input(sessions=[_create_session_input(), _create_session_input()]))
    assert repo.create_session.call_count == 2


@pytest.mark.asyncio
async def test_create_commits_transaction_on_success():
    """Commits the database transaction after successful creation."""
    uc, _, db = _make_create_uc()
    await uc.create_event(_create_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_rolls_back_on_failure():
    """Rolls back the transaction when a repository operation raises."""
    repo = _make_create_repo()
    repo.create_event = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, db = _make_create_uc(repo)
    with pytest.raises(RuntimeError):
        await uc.create_event(_create_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_create_returns_event_with_all_sessions():
    """Returns the created event and full session list in the output."""
    uc, _, _ = _make_create_uc()
    result = await uc.create_event(_create_input())
    assert result.event.id == EVENT_ID
    assert len(result.sessions) == 1


@pytest.mark.asyncio
async def test_create_does_not_commit_when_venue_not_found():
    """Does not commit when venue validation fails before any DB write."""
    repo = _make_create_repo()
    repo.venue_exists = AsyncMock(return_value=False)
    uc, _, db = _make_create_uc(repo)
    with pytest.raises(VenueNotFoundError):
        await uc.create_event(_create_input())
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_create_does_not_commit_when_venue_not_partner():
    """Does not commit when partner venue validation fails before any DB write."""
    repo = _make_create_repo()
    repo.venue_is_partner = AsyncMock(return_value=False)
    uc, _, db = _make_create_uc(repo)
    with pytest.raises(VenueNotPartnerError):
        await uc.create_event(_create_input())
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# UpdateEventMetadataUseCase
# ---------------------------------------------------------------------------


def _make_meta_repo():
    repo = MagicMock(spec=EventRepository)
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.update_event = AsyncMock(return_value=_sample_event(title="Updated"))
    return repo


def _make_meta_uc(repo=None):
    repo = repo or _make_meta_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventUseCase(repo, db), repo, db


def _meta_input(**overrides):
    defaults = dict(
        event_id=EVENT_ID,
        updated_by=CREATOR_ID,
        title="Updated Title",
        description="<p>updated</p>",
        start_date=EVENT_START,
        end_date=EVENT_END,
        banner_url="https://cdn.example.com/updated-banner.jpg",
    )
    defaults.update(overrides)
    return UpdateEventMetadataInput(**defaults)


@pytest.mark.asyncio
async def test_meta_raises_not_found_when_event_missing():
    """Raises EventNotFoundError when the target event does not exist."""
    repo = _make_meta_repo()
    repo.get_event_by_id = AsyncMock(return_value=None)
    uc, _, _ = _make_meta_uc(repo)
    with pytest.raises(EventNotFoundError):
        await uc.update_event_metadata(_meta_input())


@pytest.mark.asyncio
async def test_meta_raises_unauthorized_when_not_creator():
    """Raises UnauthorizedEventOperationError when caller is not the creator."""
    uc, _, _ = _make_meta_uc()
    with pytest.raises(UnauthorizedEventOperationError):
        await uc.update_event_metadata(_meta_input(updated_by=OTHER_ID))


@pytest.mark.asyncio
async def test_meta_raises_date_error_when_end_before_start():
    """Rejects update when new end_date is before start_date."""
    uc, _, _ = _make_meta_uc()
    with pytest.raises(EventDateValidationError):
        await uc.update_event_metadata(_meta_input(start_date=EVENT_END, end_date=EVENT_START))


@pytest.mark.asyncio
async def test_meta_raises_date_error_when_end_equals_start():
    """Rejects update when new end_date equals start_date."""
    uc, _, _ = _make_meta_uc()
    with pytest.raises(EventDateValidationError):
        await uc.update_event_metadata(_meta_input(start_date=EVENT_START, end_date=EVENT_START))


@pytest.mark.asyncio
async def test_meta_acquires_row_lock_before_read():
    """Fetches the event with FOR UPDATE to serialise concurrent updates."""
    uc, repo, _ = _make_meta_uc()
    await uc.update_event_metadata(_meta_input())
    repo.get_event_by_id.assert_called_once_with(EVENT_ID, for_update=True)


@pytest.mark.asyncio
async def test_meta_calls_update_event_with_new_values():
    """Calls update_event with all supplied field values."""
    uc, repo, _ = _make_meta_uc()
    await uc.update_event_metadata(_meta_input())
    repo.update_event.assert_called_once_with(
        event_id=EVENT_ID,
        title="Updated Title",
        description="<p>updated</p>",
        start_date=EVENT_START,
        end_date=EVENT_END,
        banner_url="https://cdn.example.com/updated-banner.jpg",
        status=EventStatus.DRAFT,
    )


@pytest.mark.asyncio
async def test_meta_commits_transaction_on_success():
    """Commits the database transaction after successful update."""
    uc, _, db = _make_meta_uc()
    await uc.update_event_metadata(_meta_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_meta_updates_posted_event_to_started_when_new_dates_are_active():
    """Sends STARTED to the repository when a posted event date range now contains the current time."""
    now = datetime.now(UTC)
    repo = _make_meta_repo()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(status=EventStatus.POSTED))
    uc, repo, _ = _make_meta_uc(repo)
    await uc.update_event_metadata(_meta_input(start_date=now - timedelta(days=1), end_date=now + timedelta(days=1)))
    assert repo.update_event.call_args.kwargs["status"] == EventStatus.STARTED


@pytest.mark.asyncio
async def test_meta_updates_started_event_to_ended_when_new_dates_are_past():
    """Sends ENDED to the repository when a started event date range is already over."""
    now = datetime.now(UTC)
    repo = _make_meta_repo()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(status=EventStatus.STARTED))
    uc, repo, _ = _make_meta_uc(repo)
    await uc.update_event_metadata(_meta_input(start_date=now - timedelta(days=2), end_date=now - timedelta(days=1)))
    assert repo.update_event.call_args.kwargs["status"] == EventStatus.ENDED


@pytest.mark.asyncio
async def test_meta_keeps_draft_status_when_dates_are_active():
    """Keeps explicit DRAFT status even when the new date range is active."""
    now = datetime.now(UTC)
    uc, repo, _ = _make_meta_uc()
    await uc.update_event_metadata(_meta_input(start_date=now - timedelta(days=1), end_date=now + timedelta(days=1)))
    assert repo.update_event.call_args.kwargs["status"] == EventStatus.DRAFT


@pytest.mark.asyncio
async def test_meta_rolls_back_on_repo_failure():
    """Rolls back the transaction when the repository update raises."""
    repo = _make_meta_repo()
    repo.update_event = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, db = _make_meta_uc(repo)
    with pytest.raises(RuntimeError):
        await uc.update_event_metadata(_meta_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_meta_returns_updated_event_and_pre_update_snapshot():
    """Returns both the updated event and the old event for audit logging."""
    uc, _, _ = _make_meta_uc()
    result = await uc.update_event_metadata(_meta_input())
    assert result.event.title == "Updated"
    assert result.old_event.id == EVENT_ID


# ---------------------------------------------------------------------------
# UpdateEventSessionUseCase
# ---------------------------------------------------------------------------


def _make_session_repo():
    repo = MagicMock(spec=EventRepository)
    repo.get_session_by_id = AsyncMock(return_value=_sample_session())
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.venue_exists = AsyncMock(return_value=True)
    repo.venue_is_partner = AsyncMock(return_value=True)
    repo.update_session = AsyncMock(return_value=_sample_session(title="Updated Session"))
    repo.create_session = AsyncMock(return_value=_sample_session(title="Created Session"))
    return repo


def _make_session_uc(repo=None):
    repo = repo or _make_session_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventUseCase(repo, db), repo, db


def _session_input(**overrides):
    defaults = dict(
        session_id=SESSION_ID,
        updated_by=CREATOR_ID,
        venue_id=VENUE_ID,
        title="Updated Session",
        description=None,
        start_datetime=SESSION_START,
        end_datetime=SESSION_END,
        max_slots=None,
    )
    defaults.update(overrides)
    return UpdateEventSessionInput(**defaults)


def _create_event_session_input(**overrides):
    defaults = dict(
        event_id=EVENT_ID,
        updated_by=CREATOR_ID,
        venue_id=VENUE_ID,
        title="Created Session",
        description=None,
        start_datetime=SESSION_START,
        end_datetime=SESSION_END,
        max_slots=None,
    )
    defaults.update(overrides)
    return CreateEventSessionForEventInput(**defaults)


@pytest.mark.asyncio
async def test_create_session_raises_venue_not_partner():
    """Rejects session creation when the selected venue is not partnered."""
    repo = _make_session_repo()
    repo.venue_is_partner = AsyncMock(return_value=False)
    uc, _, _ = _make_session_uc(repo)
    with pytest.raises(VenueNotPartnerError):
        await uc.create_event_session(_create_event_session_input())


@pytest.mark.asyncio
async def test_create_session_persists_when_venue_is_partner():
    """Creates a session when the selected venue is partnered."""
    uc, repo, db = _make_session_uc()
    await uc.create_event_session(_create_event_session_input())
    repo.create_session.assert_called_once()
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_session_raises_not_found_when_session_missing():
    """Raises EventSessionNotFoundError when the session does not exist."""
    repo = _make_session_repo()
    repo.get_session_by_id = AsyncMock(return_value=None)
    uc, _, _ = _make_session_uc(repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.update_event_session(_session_input())


@pytest.mark.asyncio
async def test_session_raises_not_found_when_parent_event_missing():
    """Raises EventNotFoundError when the session's parent event no longer exists."""
    repo = _make_session_repo()
    repo.get_event_by_id = AsyncMock(return_value=None)
    uc, _, _ = _make_session_uc(repo)
    with pytest.raises(EventNotFoundError):
        await uc.update_event_session(_session_input())


@pytest.mark.asyncio
async def test_session_raises_unauthorized_when_not_creator():
    """Raises UnauthorizedEventOperationError when caller is not the event creator."""
    uc, _, _ = _make_session_uc()
    with pytest.raises(UnauthorizedEventOperationError):
        await uc.update_event_session(_session_input(updated_by=OTHER_ID))


@pytest.mark.asyncio
async def test_session_raises_invalid_date_when_end_before_start():
    """Rejects update when session end_datetime is before start_datetime."""
    uc, _, _ = _make_session_uc()
    with pytest.raises(InvalidEventSessionDateError):
        await uc.update_event_session(_session_input(start_datetime=SESSION_END, end_datetime=SESSION_START))


@pytest.mark.asyncio
async def test_session_raises_invalid_date_when_end_equals_start():
    """Rejects update when session end_datetime equals start_datetime."""
    uc, _, _ = _make_session_uc()
    with pytest.raises(InvalidEventSessionDateError):
        await uc.update_event_session(_session_input(start_datetime=SESSION_START, end_datetime=SESSION_START))


@pytest.mark.asyncio
async def test_session_raises_bounds_error_when_start_before_event():
    """Rejects update when session start falls before the parent event start."""
    uc, _, _ = _make_session_uc()
    early = datetime(2025, 5, 31, tzinfo=UTC)
    with pytest.raises(EventSessionExceedsEventBoundsError):
        await uc.update_event_session(_session_input(start_datetime=early, end_datetime=SESSION_END))


@pytest.mark.asyncio
async def test_session_raises_bounds_error_when_end_after_event():
    """Rejects update when session end falls after the parent event end."""
    uc, _, _ = _make_session_uc()
    late = datetime(2025, 6, 11, tzinfo=UTC)
    with pytest.raises(EventSessionExceedsEventBoundsError):
        await uc.update_event_session(_session_input(start_datetime=SESSION_START, end_datetime=late))


@pytest.mark.asyncio
async def test_session_raises_venue_not_found():
    """Raises VenueNotFoundError when the referenced venue does not exist."""
    repo = _make_session_repo()
    repo.venue_exists = AsyncMock(return_value=False)
    uc, _, _ = _make_session_uc(repo)
    with pytest.raises(VenueNotFoundError):
        await uc.update_event_session(_session_input())


@pytest.mark.asyncio
async def test_session_raises_venue_not_partner():
    """Raises VenueNotPartnerError when the referenced venue is not partnered."""
    repo = _make_session_repo()
    repo.venue_is_partner = AsyncMock(return_value=False)
    uc, _, _ = _make_session_uc(repo)
    with pytest.raises(VenueNotPartnerError):
        await uc.update_event_session(_session_input())


@pytest.mark.asyncio
async def test_session_raises_not_found_when_concurrent_delete_wins():
    """Raises EventSessionNotFoundError when update_session returns None (concurrent delete)."""
    repo = _make_session_repo()
    repo.update_session = AsyncMock(return_value=None)
    uc, _, _ = _make_session_uc(repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.update_event_session(_session_input())


@pytest.mark.asyncio
async def test_session_acquires_event_lock_via_session_event_id():
    """Locks the parent event row using the session's event_id."""
    uc, repo, _ = _make_session_uc()
    await uc.update_event_session(_session_input())
    repo.get_event_by_id.assert_called_once_with(EVENT_ID, for_update=True)


@pytest.mark.asyncio
async def test_session_calls_update_session_with_correct_args():
    """Calls update_session with all supplied field values."""
    uc, repo, _ = _make_session_uc()
    await uc.update_event_session(_session_input())
    repo.update_session.assert_called_once_with(
        session_id=SESSION_ID,
        venue_id=VENUE_ID,
        title="Updated Session",
        description=None,
        start_datetime=SESSION_START,
        end_datetime=SESSION_END,
        max_slots=None,
        status=EventSessionStatus.ENDED,
    )


@pytest.mark.asyncio
async def test_session_updates_ended_session_to_posted_when_new_dates_are_future():
    """Sends POSTED to the repository when an ended session is rescheduled into the future."""
    now = datetime.now(UTC)
    event_start = now + timedelta(days=1)
    event_end = now + timedelta(days=5)
    session_start = now + timedelta(days=2)
    session_end = now + timedelta(days=3)
    repo = _make_session_repo()
    repo.get_session_by_id = AsyncMock(
        return_value=_sample_session(
            status=EventSessionStatus.ENDED,
            start_datetime=now - timedelta(days=3),
            end_datetime=now - timedelta(days=2),
        )
    )
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(start_date=event_start, end_date=event_end))
    uc, repo, _ = _make_session_uc(repo)
    await uc.update_event_session(_session_input(start_datetime=session_start, end_datetime=session_end))
    assert repo.update_session.call_args.kwargs["status"] == EventSessionStatus.POSTED


@pytest.mark.asyncio
async def test_session_updates_posted_session_to_started_when_new_dates_are_active():
    """Sends STARTED to the repository when a posted session date range now contains the current time."""
    now = datetime.now(UTC)
    event_start = now - timedelta(days=2)
    event_end = now + timedelta(days=2)
    session_start = now - timedelta(hours=1)
    session_end = now + timedelta(hours=1)
    repo = _make_session_repo()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(start_date=event_start, end_date=event_end))
    uc, repo, _ = _make_session_uc(repo)
    await uc.update_event_session(_session_input(start_datetime=session_start, end_datetime=session_end))
    assert repo.update_session.call_args.kwargs["status"] == EventSessionStatus.STARTED


@pytest.mark.asyncio
async def test_session_keeps_draft_status_when_new_dates_are_active():
    """Keeps explicit DRAFT status even when the new session date range is active."""
    now = datetime.now(UTC)
    event_start = now - timedelta(days=2)
    event_end = now + timedelta(days=2)
    session_start = now - timedelta(hours=1)
    session_end = now + timedelta(hours=1)
    repo = _make_session_repo()
    repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.DRAFT))
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(start_date=event_start, end_date=event_end))
    uc, repo, _ = _make_session_uc(repo)
    await uc.update_event_session(_session_input(start_datetime=session_start, end_datetime=session_end))
    assert repo.update_session.call_args.kwargs["status"] == EventSessionStatus.DRAFT


@pytest.mark.asyncio
async def test_session_commits_transaction_on_success():
    """Commits the database transaction after a successful session update."""
    uc, _, db = _make_session_uc()
    await uc.update_event_session(_session_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_session_rolls_back_on_repo_failure():
    """Rolls back the transaction when the repository update raises."""
    repo = _make_session_repo()
    repo.update_session = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, db = _make_session_uc(repo)
    with pytest.raises(RuntimeError):
        await uc.update_event_session(_session_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_session_returns_updated_session_and_pre_update_snapshot():
    """Returns both the updated session and the old session for audit logging."""
    uc, _, _ = _make_session_uc()
    result = await uc.update_event_session(_session_input())
    assert result.session.title == "Updated Session"
    assert result.old_session.id == SESSION_ID
