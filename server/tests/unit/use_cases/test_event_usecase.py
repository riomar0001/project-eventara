"""Unit tests for CreateEventUseCase."""

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.event_dto import CreateEventInput, CreateEventSessionInput
from app.application.use_cases.event_usecase import CreateEventUseCase
from app.domain.entities.event_entity import Event, EventSession, EventSessionStatus, EventStatus
from app.domain.exceptions.event_exceptions import EventDateValidationError, EventValidationError
from app.domain.exceptions.event_session_exceptions import (
    EventSessionExceedsEventBoundsError,
    InvalidEventSessionDateError,
)
from app.domain.exceptions.venue_exceptions import VenueNotFoundError

# ─── Constants ────────────────────────────────────────────────────────────────

USER_ID = uuid.uuid4()
VENUE_ID = uuid.uuid4()
EVENT_ID = uuid.uuid4()
SESSION_ID = uuid.uuid4()

_T = datetime(2025, 6, 1, 9, 0, tzinfo=timezone.utc)
_T2 = datetime(2025, 6, 1, 18, 0, tzinfo=timezone.utc)
_T3 = datetime(2025, 6, 3, 18, 0, tzinfo=timezone.utc)

# ─── Helpers ──────────────────────────────────────────────────────────────────


def _make_event(**overrides: Any) -> Event:
    defaults: dict[str, Any] = dict(
        id=EVENT_ID,
        title="Hackathon 2025",
        description="<p>Annual hackathon</p>",
        start_date=_T,
        end_date=_T3,
        status=EventStatus.DRAFT,
        created_by=USER_ID,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _make_session(**overrides: Any) -> EventSession:
    defaults: dict[str, Any] = dict(
        id=SESSION_ID,
        event_id=EVENT_ID,
        venue_id=VENUE_ID,
        title="Ideation Phase",
        description=None,
        start_datetime=_T,
        end_datetime=_T2,
        status=EventSessionStatus.SCHEDULED,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


def _make_repo(
    *,
    venue_exists: bool = True,
    created_event: Event | None = None,
    created_session: EventSession | None = None,
) -> MagicMock:
    repo = MagicMock()
    repo.venue_exists = AsyncMock(return_value=venue_exists)
    repo.create_event = AsyncMock(return_value=created_event or _make_event())
    repo.create_session = AsyncMock(return_value=created_session or _make_session())
    return repo


def _make_uc(repo: MagicMock | None = None) -> CreateEventUseCase:
    return CreateEventUseCase(repo=repo or _make_repo(), db=AsyncMock())


def _session_input(**overrides: Any) -> CreateEventSessionInput:
    defaults: dict[str, Any] = dict(
        venue_id=VENUE_ID,
        title="Ideation Phase",
        description=None,
        start_datetime=_T,
        end_datetime=_T2,
    )
    defaults.update(overrides)
    return CreateEventSessionInput(**defaults)


def _event_input(**overrides: Any) -> CreateEventInput:
    defaults: dict[str, Any] = dict(
        title="Hackathon 2025",
        description="<p>Annual hackathon</p>",
        start_date=_T,
        end_date=_T3,
        created_by=USER_ID,
        sessions=[_session_input()],
    )
    defaults.update(overrides)
    return CreateEventInput(**defaults)


# ─── CreateEventUseCase.execute ───────────────────────────────────────────────


class TestCreateEvent:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_event_with_sessions(self):
        event = _make_event()
        session = _make_session()
        repo = _make_repo(created_event=event, created_session=session)
        db = AsyncMock()
        result = await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        assert result.event is event
        assert result.sessions == [session]
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_creates_one_session_per_input(self):
        repo = _make_repo()
        db = AsyncMock()
        inputs = _event_input(sessions=[_session_input(), _session_input(title="Building Phase")])
        result = await CreateEventUseCase(repo=repo, db=db).execute(inputs)
        assert repo.create_session.await_count == 2
        assert len(result.sessions) == 2

    @pytest.mark.asyncio
    async def test_raises_event_date_error_when_end_not_after_start(self):
        with pytest.raises(EventDateValidationError):
            await _make_uc().execute(_event_input(end_date=_T, start_date=_T))

    @pytest.mark.asyncio
    async def test_raises_event_date_error_when_end_before_start(self):
        with pytest.raises(EventDateValidationError):
            await _make_uc().execute(_event_input(start_date=_T3, end_date=_T))

    @pytest.mark.asyncio
    async def test_raises_validation_error_when_sessions_list_is_empty(self):
        with pytest.raises(EventValidationError):
            await _make_uc().execute(_event_input(sessions=[]))

    @pytest.mark.asyncio
    async def test_raises_invalid_session_date_when_session_end_equals_start(self):
        bad_session = _session_input(start_datetime=_T, end_datetime=_T)
        with pytest.raises(InvalidEventSessionDateError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_invalid_session_date_when_session_end_before_start(self):
        bad_session = _session_input(start_datetime=_T2, end_datetime=_T)
        with pytest.raises(InvalidEventSessionDateError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_exceeds_bounds_when_session_starts_before_event(self):
        before_event = datetime(2025, 5, 31, 9, 0, tzinfo=timezone.utc)
        bad_session = _session_input(start_datetime=before_event, end_datetime=_T2)
        with pytest.raises(EventSessionExceedsEventBoundsError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_exceeds_bounds_when_session_ends_after_event(self):
        after_event = datetime(2025, 6, 4, 18, 0, tzinfo=timezone.utc)
        bad_session = _session_input(start_datetime=_T, end_datetime=after_event)
        with pytest.raises(EventSessionExceedsEventBoundsError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).execute(_event_input())

    @pytest.mark.asyncio
    async def test_rolls_back_and_reraises_on_create_event_failure(self):
        repo = _make_repo()
        repo.create_event = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_rolls_back_and_reraises_on_create_session_failure(self):
        repo = _make_repo()
        repo.create_session = AsyncMock(side_effect=RuntimeError("session db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_does_not_commit_when_event_creation_fails(self):
        repo = _make_repo()
        repo.create_event = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_checks_venue_existence_for_each_session(self):
        repo = _make_repo(venue_exists=True)
        second_venue = uuid.uuid4()
        sessions = [_session_input(), _session_input(venue_id=second_venue)]
        await _make_uc(repo).execute(_event_input(sessions=sessions))
        assert repo.venue_exists.await_count == 2
