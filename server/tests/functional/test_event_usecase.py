"""Functional test cases for CreateEventUseCase and UpdateEventUseCase."""

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.event_dto import CreateEventInput, CreateEventSessionInput, UpdateEventInput, UpdateEventSessionInput
from app.application.use_cases.event_usecase import CreateEventUseCase, UpdateEventUseCase
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
        """Commits the transaction and returns the created event with sessions on success"""
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
        """Calls create_session once for every session descriptor in the input"""
        repo = _make_repo()
        db = AsyncMock()
        inputs = _event_input(sessions=[_session_input(), _session_input(title="Building Phase")])
        result = await CreateEventUseCase(repo=repo, db=db).execute(inputs)
        assert repo.create_session.await_count == 2
        assert len(result.sessions) == 2

    @pytest.mark.asyncio
    async def test_raises_event_date_error_when_end_not_after_start(self):
        """Raises EventDateValidationError when event end_date equals start_date"""
        with pytest.raises(EventDateValidationError):
            await _make_uc().execute(_event_input(end_date=_T, start_date=_T))

    @pytest.mark.asyncio
    async def test_raises_event_date_error_when_end_before_start(self):
        """Raises EventDateValidationError when event end_date precedes start_date"""
        with pytest.raises(EventDateValidationError):
            await _make_uc().execute(_event_input(start_date=_T3, end_date=_T))

    @pytest.mark.asyncio
    async def test_raises_validation_error_when_sessions_list_is_empty(self):
        """Raises EventValidationError when no sessions are provided"""
        with pytest.raises(EventValidationError):
            await _make_uc().execute(_event_input(sessions=[]))

    @pytest.mark.asyncio
    async def test_raises_invalid_session_date_when_session_end_equals_start(self):
        """Raises InvalidEventSessionDateError when session end_datetime equals start_datetime"""
        bad_session = _session_input(start_datetime=_T, end_datetime=_T)
        with pytest.raises(InvalidEventSessionDateError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_invalid_session_date_when_session_end_before_start(self):
        """Raises InvalidEventSessionDateError when session end_datetime precedes start_datetime"""
        bad_session = _session_input(start_datetime=_T2, end_datetime=_T)
        with pytest.raises(InvalidEventSessionDateError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_exceeds_bounds_when_session_starts_before_event(self):
        """Raises EventSessionExceedsEventBoundsError when session starts before the event"""
        before_event = datetime(2025, 5, 31, 9, 0, tzinfo=timezone.utc)
        bad_session = _session_input(start_datetime=before_event, end_datetime=_T2)
        with pytest.raises(EventSessionExceedsEventBoundsError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_exceeds_bounds_when_session_ends_after_event(self):
        """Raises EventSessionExceedsEventBoundsError when session ends after the event"""
        after_event = datetime(2025, 6, 4, 18, 0, tzinfo=timezone.utc)
        bad_session = _session_input(start_datetime=_T, end_datetime=after_event)
        with pytest.raises(EventSessionExceedsEventBoundsError):
            await _make_uc().execute(_event_input(sessions=[bad_session]))

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when a session references a non-existent venue"""
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).execute(_event_input())

    @pytest.mark.asyncio
    async def test_rolls_back_and_reraises_on_create_event_failure(self):
        """Rolls back the transaction and re-raises when the event insert fails"""
        repo = _make_repo()
        repo.create_event = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_rolls_back_and_reraises_on_create_session_failure(self):
        """Rolls back the transaction and re-raises when a session insert fails"""
        repo = _make_repo()
        repo.create_session = AsyncMock(side_effect=RuntimeError("session db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_does_not_commit_when_event_creation_fails(self):
        """Never commits when the event insert raises an exception"""
        repo = _make_repo()
        repo.create_event = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await CreateEventUseCase(repo=repo, db=db).execute(_event_input())
        db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_checks_venue_existence_for_each_session(self):
        """Calls venue_exists once per session to validate all venue references"""
        repo = _make_repo(venue_exists=True)
        second_venue = uuid.uuid4()
        sessions = [_session_input(), _session_input(venue_id=second_venue)]
        await _make_uc(repo).execute(_event_input(sessions=sessions))
        assert repo.venue_exists.await_count == 2


# ─── UpdateEventUseCase helpers ───────────────────────────────────────────────

OTHER_USER_ID = uuid.uuid4()


def _make_update_repo(
    *,
    event: Event | None = None,
    existing_sessions: list[EventSession] | None = None,
    venue_exists: bool = True,
    updated_event: Event | None = None,
    updated_session: EventSession | None = None,
    created_session: EventSession | None = None,
) -> MagicMock:
    base_event = event or _make_event()
    repo = MagicMock()
    repo.get_event_by_id = AsyncMock(return_value=base_event)
    repo.get_sessions_by_event_id = AsyncMock(return_value=existing_sessions if existing_sessions is not None else [_make_session()])
    repo.venue_exists = AsyncMock(return_value=venue_exists)
    repo.update_event = AsyncMock(return_value=updated_event or _make_event())
    repo.update_session = AsyncMock(return_value=updated_session or _make_session())
    repo.create_session = AsyncMock(return_value=created_session or _make_session())
    repo.delete_session = AsyncMock(return_value=True)
    return repo


def _make_update_uc(repo: MagicMock | None = None) -> UpdateEventUseCase:
    return UpdateEventUseCase(repo=repo or _make_update_repo(), db=AsyncMock())


def _update_session_input(*, with_id: uuid.UUID | None = SESSION_ID, **overrides: Any) -> UpdateEventSessionInput:
    defaults: dict[str, Any] = dict(
        id=with_id,
        venue_id=VENUE_ID,
        title="Ideation Phase",
        description=None,
        start_datetime=_T,
        end_datetime=_T2,
    )
    defaults.update(overrides)
    return UpdateEventSessionInput(**defaults)


def _update_input(**overrides: Any) -> UpdateEventInput:
    defaults: dict[str, Any] = dict(
        event_id=EVENT_ID,
        updated_by=USER_ID,
        title="Hackathon 2025 Updated",
        description="<p>Updated</p>",
        start_date=_T,
        end_date=_T3,
        sessions=[_update_session_input()],
    )
    defaults.update(overrides)
    return UpdateEventInput(**defaults)


# ─── UpdateEventUseCase ───────────────────────────────────────────────────────


class TestUpdateEvent:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_updated_event_with_sessions(self):
        """Commits the transaction and returns the updated event with sessions on success"""
        event = _make_event()
        session = _make_session()
        repo = _make_update_repo(updated_event=event, updated_session=session)
        db = AsyncMock()
        result = await UpdateEventUseCase(repo=repo, db=db).execute(_update_input())
        assert result.event is event
        assert result.sessions == [session]
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_output_carries_old_event_and_sessions_for_audit(self):
        """Includes the pre-update event and session snapshots in the output for audit logging"""
        old_event = _make_event()
        old_session = _make_session()
        repo = _make_update_repo(event=old_event, existing_sessions=[old_session])
        result = await _make_update_uc(repo).execute(_update_input())
        assert result.old_event is old_event
        assert result.old_sessions == [old_session]

    @pytest.mark.asyncio
    async def test_raises_not_found_when_event_missing(self):
        """Raises EventNotFoundError when the target event does not exist"""
        repo = _make_update_repo()
        repo.get_event_by_id = AsyncMock(return_value=None)
        with pytest.raises(EventNotFoundError):
            await _make_update_uc(repo).execute(_update_input())

    @pytest.mark.asyncio
    async def test_raises_unauthorized_when_caller_is_not_creator(self):
        """Raises UnauthorizedEventOperationError when the caller did not create the event"""
        repo = _make_update_repo(event=_make_event(created_by=OTHER_USER_ID))
        with pytest.raises(UnauthorizedEventOperationError):
            await _make_update_uc(repo).execute(_update_input())

    @pytest.mark.asyncio
    async def test_raises_date_error_when_event_end_equals_start(self):
        """Raises EventDateValidationError when updated end_date equals start_date"""
        with pytest.raises(EventDateValidationError):
            await _make_update_uc().execute(_update_input(start_date=_T, end_date=_T))

    @pytest.mark.asyncio
    async def test_raises_date_error_when_event_end_before_start(self):
        """Raises EventDateValidationError when updated end_date precedes start_date"""
        with pytest.raises(EventDateValidationError):
            await _make_update_uc().execute(_update_input(start_date=_T3, end_date=_T))

    @pytest.mark.asyncio
    async def test_raises_validation_error_when_sessions_list_is_empty(self):
        """Raises EventValidationError when the updated sessions list is empty"""
        with pytest.raises(EventValidationError):
            await _make_update_uc().execute(_update_input(sessions=[]))

    @pytest.mark.asyncio
    async def test_raises_invalid_session_date_when_session_end_before_start(self):
        """Raises InvalidEventSessionDateError when a session's end_datetime precedes start_datetime"""
        bad = _update_session_input(start_datetime=_T2, end_datetime=_T)
        with pytest.raises(InvalidEventSessionDateError):
            await _make_update_uc().execute(_update_input(sessions=[bad]))

    @pytest.mark.asyncio
    async def test_raises_exceeds_bounds_when_session_starts_before_event(self):
        """Raises EventSessionExceedsEventBoundsError when a session starts before the updated event"""
        before = datetime(2025, 5, 31, 9, 0, tzinfo=timezone.utc)
        bad = _update_session_input(start_datetime=before, end_datetime=_T2)
        with pytest.raises(EventSessionExceedsEventBoundsError):
            await _make_update_uc().execute(_update_input(sessions=[bad]))

    @pytest.mark.asyncio
    async def test_raises_exceeds_bounds_when_session_ends_after_event(self):
        """Raises EventSessionExceedsEventBoundsError when a session ends after the updated event"""
        after = datetime(2025, 6, 4, 18, 0, tzinfo=timezone.utc)
        bad = _update_session_input(start_datetime=_T, end_datetime=after)
        with pytest.raises(EventSessionExceedsEventBoundsError):
            await _make_update_uc().execute(_update_input(sessions=[bad]))

    @pytest.mark.asyncio
    async def test_raises_session_not_found_when_session_id_not_on_this_event(self):
        """Raises EventSessionNotFoundError when a session id in the request does not belong to this event"""
        foreign_id = uuid.uuid4()
        bad = _update_session_input(with_id=foreign_id)
        repo = _make_update_repo(existing_sessions=[_make_session()])
        with pytest.raises(EventSessionNotFoundError):
            await _make_update_uc(repo).execute(_update_input(sessions=[bad]))

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when a session references a non-existent venue"""
        repo = _make_update_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_update_uc(repo).execute(_update_input())

    @pytest.mark.asyncio
    async def test_deletes_sessions_absent_from_incoming_list(self):
        """Calls delete_session for every session that exists on the event but is not in the update request"""
        extra_session_id = uuid.uuid4()
        extra = _make_session(id=extra_session_id)
        existing = _make_session()
        repo = _make_update_repo(existing_sessions=[existing, extra])
        db = AsyncMock()
        await UpdateEventUseCase(repo=repo, db=db).execute(_update_input(sessions=[_update_session_input(with_id=SESSION_ID)]))
        repo.delete_session.assert_awaited_once_with(extra_session_id)

    @pytest.mark.asyncio
    async def test_updates_sessions_with_id(self):
        """Calls update_session and not create_session when a session id is provided"""
        repo = _make_update_repo()
        await _make_update_uc(repo).execute(_update_input(sessions=[_update_session_input(with_id=SESSION_ID)]))
        repo.update_session.assert_awaited_once()
        repo.create_session.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_creates_sessions_without_id(self):
        """Calls create_session and not update_session when no session id is provided"""
        repo = _make_update_repo(existing_sessions=[])
        await _make_update_uc(repo).execute(_update_input(sessions=[_update_session_input(with_id=None)]))
        repo.create_session.assert_awaited_once()
        repo.update_session.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_rolls_back_on_update_event_failure(self):
        """Rolls back the transaction and re-raises when the event update fails"""
        repo = _make_update_repo()
        repo.update_event = AsyncMock(side_effect=RuntimeError("db"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await UpdateEventUseCase(repo=repo, db=db).execute(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_rolls_back_on_update_session_failure(self):
        """Rolls back the transaction and re-raises when a session update fails"""
        repo = _make_update_repo()
        repo.update_session = AsyncMock(side_effect=RuntimeError("db"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await UpdateEventUseCase(repo=repo, db=db).execute(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_does_not_commit_when_mutation_fails(self):
        """Never commits when any mutation raises an exception"""
        repo = _make_update_repo()
        repo.update_event = AsyncMock(side_effect=RuntimeError("db"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await UpdateEventUseCase(repo=repo, db=db).execute(_update_input())
        db.commit.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_acquires_lock_on_event_row(self):
        """Calls get_event_by_id with for_update=True to acquire a pessimistic row lock"""
        repo = _make_update_repo()
        await _make_update_uc(repo).execute(_update_input())
        repo.get_event_by_id.assert_awaited_once_with(EVENT_ID, for_update=True)
