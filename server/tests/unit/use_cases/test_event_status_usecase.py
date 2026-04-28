"""Unit tests for EventStatusUseCase — update_event_status and update_event_session_status."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_status_dto import (
    UpdateEventSessionStatusInput,
    UpdateEventStatusInput,
)
from app.application.use_cases.event_status_usecase import EventStatusUseCase
from app.domain.entities.event_entity import Event, EventSession, EventSessionStatus, EventStatus
from app.domain.exceptions.event_exceptions import (
    EventNotFoundError,
    EventStatusTransitionError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventSessionNotFoundError,
    EventSessionStatusTransitionError,
)
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
        status=EventSessionStatus.DRAFT,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


# ---------------------------------------------------------------------------
# update_event_status
# ---------------------------------------------------------------------------


def _make_event_status_repo(event=None, updated_event=None):
    repo = MagicMock(spec=EventRepository)
    repo.get_event_by_id = AsyncMock(return_value=event or _sample_event())
    repo.update_event_status = AsyncMock(return_value=updated_event or _sample_event(status=EventStatus.POSTED))
    return repo


def _make_event_status_uc(repo=None):
    repo = repo or _make_event_status_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventStatusUseCase(repo, db), repo, db


def _event_status_input(**overrides):
    defaults = dict(
        event_id=EVENT_ID,
        updated_by=CREATOR_ID,
        new_status=EventStatus.POSTED,
    )
    defaults.update(overrides)
    return UpdateEventStatusInput(**defaults)


@pytest.mark.asyncio
async def test_update_event_status_raises_not_found_when_event_missing():
    repo = _make_event_status_repo(event=None)
    uc, _, _ = _make_event_status_uc(repo)
    with pytest.raises(EventNotFoundError):
        await uc.update_event_status(_event_status_input())


@pytest.mark.asyncio
async def test_update_event_status_raises_unauthorized_when_not_creator():
    uc, _, _ = _make_event_status_uc()
    with pytest.raises(UnauthorizedEventOperationError):
        await uc.update_event_status(_event_status_input(updated_by=OTHER_ID))


@pytest.mark.asyncio
async def test_update_event_status_raises_transition_error_when_invalid_from_draft():
    uc, _, _ = _make_event_status_uc()
    with pytest.raises(EventStatusTransitionError):
        await uc.update_event_status(_event_status_input(new_status=EventStatus.STARTED))


@pytest.mark.asyncio
async def test_update_event_status_raises_transition_error_from_terminal_ended():
    repo = _make_event_status_repo(event=_sample_event(status=EventStatus.ENDED))
    uc, _, _ = _make_event_status_uc(repo)
    with pytest.raises(EventStatusTransitionError):
        await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))


@pytest.mark.asyncio
async def test_update_event_status_raises_transition_error_from_terminal_cancelled():
    repo = _make_event_status_repo(event=_sample_event(status=EventStatus.CANCELLED))
    uc, _, _ = _make_event_status_uc(repo)
    with pytest.raises(EventStatusTransitionError):
        await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))


@pytest.mark.asyncio
async def test_update_event_status_draft_to_posted_succeeds():
    uc, repo, _ = _make_event_status_uc()
    await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))
    repo.update_event_status.assert_called_once_with(event_id=EVENT_ID, new_status=EventStatus.POSTED)


@pytest.mark.asyncio
async def test_update_event_status_draft_to_cancelled_succeeds():
    uc, repo, _ = _make_event_status_uc()
    await uc.update_event_status(_event_status_input(new_status=EventStatus.CANCELLED))
    repo.update_event_status.assert_called_once_with(event_id=EVENT_ID, new_status=EventStatus.CANCELLED)


@pytest.mark.asyncio
async def test_update_event_status_posted_to_started_succeeds():
    repo = _make_event_status_repo(event=_sample_event(status=EventStatus.POSTED))
    uc, repo, _ = _make_event_status_uc(repo)
    await uc.update_event_status(_event_status_input(new_status=EventStatus.STARTED))
    repo.update_event_status.assert_called_once_with(event_id=EVENT_ID, new_status=EventStatus.STARTED)


@pytest.mark.asyncio
async def test_update_event_status_posted_to_postponed_succeeds():
    repo = _make_event_status_repo(event=_sample_event(status=EventStatus.POSTED))
    uc, repo, _ = _make_event_status_uc(repo)
    await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTPONED))
    repo.update_event_status.assert_called_once_with(event_id=EVENT_ID, new_status=EventStatus.POSTPONED)


@pytest.mark.asyncio
async def test_update_event_status_started_to_ended_succeeds():
    repo = _make_event_status_repo(event=_sample_event(status=EventStatus.STARTED))
    uc, repo, _ = _make_event_status_uc(repo)
    await uc.update_event_status(_event_status_input(new_status=EventStatus.ENDED))
    repo.update_event_status.assert_called_once_with(event_id=EVENT_ID, new_status=EventStatus.ENDED)


@pytest.mark.asyncio
async def test_update_event_status_postponed_to_posted_succeeds():
    repo = _make_event_status_repo(event=_sample_event(status=EventStatus.POSTPONED))
    uc, repo, _ = _make_event_status_uc(repo)
    await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))
    repo.update_event_status.assert_called_once_with(event_id=EVENT_ID, new_status=EventStatus.POSTED)


@pytest.mark.asyncio
async def test_update_event_status_commits_on_success():
    uc, _, db = _make_event_status_uc()
    await uc.update_event_status(_event_status_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_event_status_rolls_back_on_repo_failure():
    repo = _make_event_status_repo()
    repo.update_event_status = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, db = _make_event_status_uc(repo)
    with pytest.raises(RuntimeError):
        await uc.update_event_status(_event_status_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_update_event_status_returns_old_and_new_event():
    old_event = _sample_event(status=EventStatus.DRAFT)
    new_event = _sample_event(status=EventStatus.POSTED)
    repo = _make_event_status_repo(event=old_event, updated_event=new_event)
    uc, _, _ = _make_event_status_uc(repo)
    result = await uc.update_event_status(_event_status_input())
    assert result.old_event.status == EventStatus.DRAFT
    assert result.event.status == EventStatus.POSTED


@pytest.mark.asyncio
async def test_update_event_status_does_not_commit_on_not_found():
    repo = _make_event_status_repo(event=None)
    uc, _, db = _make_event_status_uc(repo)
    with pytest.raises(EventNotFoundError):
        await uc.update_event_status(_event_status_input())
    db.commit.assert_not_called()


# ---------------------------------------------------------------------------
# update_event_session_status
# ---------------------------------------------------------------------------


def _make_session_status_repo(session=None, event=None, updated_session=None):
    repo = MagicMock(spec=EventRepository)
    repo.get_session_by_id = AsyncMock(return_value=session or _sample_session())
    repo.get_event_by_id = AsyncMock(return_value=event or _sample_event())
    repo.update_session_status = AsyncMock(return_value=updated_session or _sample_session(status=EventSessionStatus.POSTED))
    return repo


def _make_session_status_uc(repo=None):
    repo = repo or _make_session_status_repo()
    db = AsyncMock(spec=AsyncSession)
    return EventStatusUseCase(repo, db), repo, db


def _session_status_input(**overrides):
    defaults = dict(
        session_id=SESSION_ID,
        updated_by=CREATOR_ID,
        new_status=EventSessionStatus.POSTED,
    )
    defaults.update(overrides)
    return UpdateEventSessionStatusInput(**defaults)


@pytest.mark.asyncio
async def test_update_session_status_raises_not_found_when_session_missing():
    repo = _make_session_status_repo(session=None)
    uc, _, _ = _make_session_status_uc(repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.update_event_session_status(_session_status_input())


@pytest.mark.asyncio
async def test_update_session_status_raises_not_found_when_event_missing():
    repo = _make_session_status_repo(event=None)
    uc, _, _ = _make_session_status_uc(repo)
    with pytest.raises(EventNotFoundError):
        await uc.update_event_session_status(_session_status_input())


@pytest.mark.asyncio
async def test_update_session_status_raises_unauthorized_when_not_creator():
    uc, _, _ = _make_session_status_uc()
    with pytest.raises(UnauthorizedEventOperationError):
        await uc.update_event_session_status(_session_status_input(updated_by=OTHER_ID))


@pytest.mark.asyncio
async def test_update_session_status_raises_transition_error_when_invalid_from_draft():
    uc, _, _ = _make_session_status_uc()
    with pytest.raises(EventSessionStatusTransitionError):
        await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.STARTED))


@pytest.mark.asyncio
async def test_update_session_status_raises_transition_error_from_terminal_ended():
    repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.ENDED))
    uc, _, _ = _make_session_status_uc(repo)
    with pytest.raises(EventSessionStatusTransitionError):
        await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTED))


@pytest.mark.asyncio
async def test_update_session_status_raises_transition_error_from_terminal_cancelled():
    repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.CANCELLED))
    uc, _, _ = _make_session_status_uc(repo)
    with pytest.raises(EventSessionStatusTransitionError):
        await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTED))


@pytest.mark.asyncio
async def test_update_session_status_draft_to_posted_succeeds():
    uc, repo, _ = _make_session_status_uc()
    await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTED))
    repo.update_session_status.assert_called_once_with(session_id=SESSION_ID, new_status=EventSessionStatus.POSTED)


@pytest.mark.asyncio
async def test_update_session_status_posted_to_started_succeeds():
    repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.POSTED))
    uc, repo, _ = _make_session_status_uc(repo)
    await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.STARTED))
    repo.update_session_status.assert_called_once_with(session_id=SESSION_ID, new_status=EventSessionStatus.STARTED)


@pytest.mark.asyncio
async def test_update_session_status_posted_to_postponed_succeeds():
    repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.POSTED))
    uc, repo, _ = _make_session_status_uc(repo)
    await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTPONED))
    repo.update_session_status.assert_called_once_with(session_id=SESSION_ID, new_status=EventSessionStatus.POSTPONED)


@pytest.mark.asyncio
async def test_update_session_status_started_to_ended_succeeds():
    repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.STARTED))
    uc, repo, _ = _make_session_status_uc(repo)
    await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.ENDED))
    repo.update_session_status.assert_called_once_with(session_id=SESSION_ID, new_status=EventSessionStatus.ENDED)


@pytest.mark.asyncio
async def test_update_session_status_postponed_to_cancelled_succeeds():
    repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.POSTPONED))
    uc, repo, _ = _make_session_status_uc(repo)
    await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.CANCELLED))
    repo.update_session_status.assert_called_once_with(session_id=SESSION_ID, new_status=EventSessionStatus.CANCELLED)


@pytest.mark.asyncio
async def test_update_session_status_commits_on_success():
    uc, _, db = _make_session_status_uc()
    await uc.update_event_session_status(_session_status_input())
    db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_session_status_rolls_back_on_repo_failure():
    repo = _make_session_status_repo()
    repo.update_session_status = AsyncMock(side_effect=RuntimeError("db error"))
    uc, _, db = _make_session_status_uc(repo)
    with pytest.raises(RuntimeError):
        await uc.update_event_session_status(_session_status_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_update_session_status_returns_old_and_new_session():
    old_session = _sample_session(status=EventSessionStatus.DRAFT)
    new_session = _sample_session(status=EventSessionStatus.POSTED)
    repo = _make_session_status_repo(session=old_session, updated_session=new_session)
    uc, _, _ = _make_session_status_uc(repo)
    result = await uc.update_event_session_status(_session_status_input())
    assert result.old_session.status == EventSessionStatus.DRAFT
    assert result.session.status == EventSessionStatus.POSTED


@pytest.mark.asyncio
async def test_update_session_status_raises_not_found_when_repo_update_returns_none():
    repo = _make_session_status_repo()
    repo.update_session_status = AsyncMock(return_value=None)
    uc, _, db = _make_session_status_uc(repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.update_event_session_status(_session_status_input())
    db.rollback.assert_called_once()


@pytest.mark.asyncio
async def test_update_session_status_does_not_commit_on_session_not_found():
    repo = _make_session_status_repo(session=None)
    uc, _, db = _make_session_status_uc(repo)
    with pytest.raises(EventSessionNotFoundError):
        await uc.update_event_session_status(_session_status_input())
    db.commit.assert_not_called()
