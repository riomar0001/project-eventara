"""Functional test cases for EventStatusUseCase — update_event_status and update_event_session_status."""

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


_UNSET = object()


def _make_event_status_repo(event=_UNSET, updated_event=_UNSET):
    repo = MagicMock(spec=EventRepository)
    repo.get_event_by_id = AsyncMock(return_value=_sample_event() if event is _UNSET else event)
    repo.update_event_status = AsyncMock(return_value=_sample_event(status=EventStatus.POSTED) if updated_event is _UNSET else updated_event)
    return repo


def _make_session_status_repo(session=_UNSET, event=_UNSET, updated_session=_UNSET):
    repo = MagicMock(spec=EventRepository)
    repo.get_session_by_id = AsyncMock(return_value=_sample_session() if session is _UNSET else session)
    repo.get_event_by_id = AsyncMock(return_value=_sample_event() if event is _UNSET else event)
    repo.update_session_status = AsyncMock(
        return_value=_sample_session(status=EventSessionStatus.POSTED) if updated_session is _UNSET else updated_session
    )
    return repo


def _make_uc(repo):
    db = AsyncMock(spec=AsyncSession)
    return EventStatusUseCase(repo, db), db


def _event_status_input(**overrides):
    defaults = dict(event_id=EVENT_ID, updated_by=CREATOR_ID, new_status=EventStatus.POSTED)
    defaults.update(overrides)
    return UpdateEventStatusInput(**defaults)


def _session_status_input(**overrides):
    defaults = dict(session_id=SESSION_ID, updated_by=CREATOR_ID, new_status=EventSessionStatus.POSTED)
    defaults.update(overrides)
    return UpdateEventSessionStatusInput(**defaults)


# ---------------------------------------------------------------------------
# update_event_status
# ---------------------------------------------------------------------------


class TestUpdateEventStatus:
    @pytest.mark.asyncio
    async def test_raises_not_found_when_event_does_not_exist(self):
        """Raises EventNotFoundError when the event ID has no matching row."""
        repo = _make_event_status_repo(event=None)
        uc, _ = _make_uc(repo)
        with pytest.raises(EventNotFoundError):
            await uc.update_event_status(_event_status_input())

    @pytest.mark.asyncio
    async def test_raises_unauthorized_when_caller_is_not_creator(self):
        """Raises UnauthorizedEventOperationError when the caller did not create the event."""
        repo = _make_event_status_repo()
        uc, _ = _make_uc(repo)
        with pytest.raises(UnauthorizedEventOperationError):
            await uc.update_event_status(_event_status_input(updated_by=OTHER_ID))

    @pytest.mark.asyncio
    async def test_raises_transition_error_for_invalid_transition_from_draft(self):
        """Raises EventStatusTransitionError when jumping from DRAFT directly to STARTED."""
        repo = _make_event_status_repo()
        uc, _ = _make_uc(repo)
        with pytest.raises(EventStatusTransitionError):
            await uc.update_event_status(_event_status_input(new_status=EventStatus.STARTED))

    @pytest.mark.asyncio
    async def test_raises_transition_error_from_terminal_ended_state(self):
        """Raises EventStatusTransitionError when attempting any transition from ENDED."""
        repo = _make_event_status_repo(event=_sample_event(status=EventStatus.ENDED))
        uc, _ = _make_uc(repo)
        with pytest.raises(EventStatusTransitionError):
            await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))

    @pytest.mark.asyncio
    async def test_raises_transition_error_from_terminal_cancelled_state(self):
        """Raises EventStatusTransitionError when attempting any transition from CANCELLED."""
        repo = _make_event_status_repo(event=_sample_event(status=EventStatus.CANCELLED))
        uc, _ = _make_uc(repo)
        with pytest.raises(EventStatusTransitionError):
            await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))

    @pytest.mark.asyncio
    async def test_transitions_draft_to_posted_successfully(self):
        """Commits the DRAFT → POSTED transition and returns both old and new event states."""
        repo = _make_event_status_repo()
        uc, db = _make_uc(repo)
        result = await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))
        db.commit.assert_called_once()
        assert result.old_event.status == EventStatus.DRAFT

    @pytest.mark.asyncio
    async def test_transitions_draft_to_cancelled_successfully(self):
        """Commits the DRAFT → CANCELLED transition and returns the updated event."""
        repo = _make_event_status_repo(updated_event=_sample_event(status=EventStatus.CANCELLED))
        uc, db = _make_uc(repo)
        result = await uc.update_event_status(_event_status_input(new_status=EventStatus.CANCELLED))
        db.commit.assert_called_once()
        assert result.event.status == EventStatus.CANCELLED

    @pytest.mark.asyncio
    async def test_transitions_posted_to_started_successfully(self):
        """Commits the POSTED → STARTED transition when the caller is the event creator."""
        repo = _make_event_status_repo(
            event=_sample_event(status=EventStatus.POSTED),
            updated_event=_sample_event(status=EventStatus.STARTED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_status(_event_status_input(new_status=EventStatus.STARTED))
        db.commit.assert_called_once()
        assert result.event.status == EventStatus.STARTED

    @pytest.mark.asyncio
    async def test_transitions_posted_to_postponed_successfully(self):
        """Commits the POSTED → POSTPONED transition and returns the updated event."""
        repo = _make_event_status_repo(
            event=_sample_event(status=EventStatus.POSTED),
            updated_event=_sample_event(status=EventStatus.POSTPONED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTPONED))
        db.commit.assert_called_once()
        assert result.event.status == EventStatus.POSTPONED

    @pytest.mark.asyncio
    async def test_transitions_started_to_ended_successfully(self):
        """Commits the STARTED → ENDED transition and returns the updated event."""
        repo = _make_event_status_repo(
            event=_sample_event(status=EventStatus.STARTED),
            updated_event=_sample_event(status=EventStatus.ENDED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_status(_event_status_input(new_status=EventStatus.ENDED))
        db.commit.assert_called_once()
        assert result.event.status == EventStatus.ENDED

    @pytest.mark.asyncio
    async def test_transitions_postponed_to_posted_successfully(self):
        """Commits the POSTPONED → POSTED transition and returns the updated event."""
        repo = _make_event_status_repo(
            event=_sample_event(status=EventStatus.POSTPONED),
            updated_event=_sample_event(status=EventStatus.POSTED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_status(_event_status_input(new_status=EventStatus.POSTED))
        db.commit.assert_called_once()
        assert result.event.status == EventStatus.POSTED

    @pytest.mark.asyncio
    async def test_rolls_back_and_reraises_on_repository_failure(self):
        """Rolls back the transaction and re-raises when the repository update raises."""
        repo = _make_event_status_repo()
        repo.update_event_status = AsyncMock(side_effect=RuntimeError("db error"))
        uc, db = _make_uc(repo)
        with pytest.raises(RuntimeError):
            await uc.update_event_status(_event_status_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_does_not_commit_when_event_not_found(self):
        """Does not commit or call the repository update when the event cannot be located."""
        repo = _make_event_status_repo(event=None)
        uc, db = _make_uc(repo)
        with pytest.raises(EventNotFoundError):
            await uc.update_event_status(_event_status_input())
        db.commit.assert_not_called()
        repo.update_event_status.assert_not_called()


# ---------------------------------------------------------------------------
# update_event_session_status
# ---------------------------------------------------------------------------


class TestUpdateEventSessionStatus:
    @pytest.mark.asyncio
    async def test_raises_not_found_when_session_does_not_exist(self):
        """Raises EventSessionNotFoundError when the session ID has no matching row."""
        repo = _make_session_status_repo(session=None)
        uc, _ = _make_uc(repo)
        with pytest.raises(EventSessionNotFoundError):
            await uc.update_event_session_status(_session_status_input())

    @pytest.mark.asyncio
    async def test_raises_not_found_when_parent_event_does_not_exist(self):
        """Raises EventNotFoundError when the parent event row is missing."""
        repo = _make_session_status_repo(event=None)
        uc, _ = _make_uc(repo)
        with pytest.raises(EventNotFoundError):
            await uc.update_event_session_status(_session_status_input())

    @pytest.mark.asyncio
    async def test_raises_unauthorized_when_caller_is_not_creator(self):
        """Raises UnauthorizedEventOperationError when the caller did not create the event."""
        repo = _make_session_status_repo()
        uc, _ = _make_uc(repo)
        with pytest.raises(UnauthorizedEventOperationError):
            await uc.update_event_session_status(_session_status_input(updated_by=OTHER_ID))

    @pytest.mark.asyncio
    async def test_raises_transition_error_for_invalid_transition_from_draft(self):
        """Raises EventSessionStatusTransitionError when jumping from DRAFT directly to STARTED."""
        repo = _make_session_status_repo()
        uc, _ = _make_uc(repo)
        with pytest.raises(EventSessionStatusTransitionError):
            await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.STARTED))

    @pytest.mark.asyncio
    async def test_raises_transition_error_from_terminal_ended_state(self):
        """Raises EventSessionStatusTransitionError when attempting any transition from ENDED."""
        repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.ENDED))
        uc, _ = _make_uc(repo)
        with pytest.raises(EventSessionStatusTransitionError):
            await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTED))

    @pytest.mark.asyncio
    async def test_raises_transition_error_from_terminal_cancelled_state(self):
        """Raises EventSessionStatusTransitionError when attempting any transition from CANCELLED."""
        repo = _make_session_status_repo(session=_sample_session(status=EventSessionStatus.CANCELLED))
        uc, _ = _make_uc(repo)
        with pytest.raises(EventSessionStatusTransitionError):
            await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTED))

    @pytest.mark.asyncio
    async def test_transitions_draft_to_posted_successfully(self):
        """Commits the DRAFT → POSTED transition and returns both old and new session states."""
        repo = _make_session_status_repo()
        uc, db = _make_uc(repo)
        result = await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTED))
        db.commit.assert_called_once()
        assert result.old_session.status == EventSessionStatus.DRAFT

    @pytest.mark.asyncio
    async def test_transitions_posted_to_started_successfully(self):
        """Commits the POSTED → STARTED transition and returns the updated session."""
        repo = _make_session_status_repo(
            session=_sample_session(status=EventSessionStatus.POSTED),
            updated_session=_sample_session(status=EventSessionStatus.STARTED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.STARTED))
        db.commit.assert_called_once()
        assert result.session.status == EventSessionStatus.STARTED

    @pytest.mark.asyncio
    async def test_transitions_posted_to_postponed_successfully(self):
        """Commits the POSTED → POSTPONED transition and returns the updated session."""
        repo = _make_session_status_repo(
            session=_sample_session(status=EventSessionStatus.POSTED),
            updated_session=_sample_session(status=EventSessionStatus.POSTPONED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.POSTPONED))
        db.commit.assert_called_once()
        assert result.session.status == EventSessionStatus.POSTPONED

    @pytest.mark.asyncio
    async def test_transitions_started_to_ended_successfully(self):
        """Commits the STARTED → ENDED transition and returns the updated session."""
        repo = _make_session_status_repo(
            session=_sample_session(status=EventSessionStatus.STARTED),
            updated_session=_sample_session(status=EventSessionStatus.ENDED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.ENDED))
        db.commit.assert_called_once()
        assert result.session.status == EventSessionStatus.ENDED

    @pytest.mark.asyncio
    async def test_transitions_postponed_to_cancelled_successfully(self):
        """Commits the POSTPONED → CANCELLED transition and returns the updated session."""
        repo = _make_session_status_repo(
            session=_sample_session(status=EventSessionStatus.POSTPONED),
            updated_session=_sample_session(status=EventSessionStatus.CANCELLED),
        )
        uc, db = _make_uc(repo)
        result = await uc.update_event_session_status(_session_status_input(new_status=EventSessionStatus.CANCELLED))
        db.commit.assert_called_once()
        assert result.session.status == EventSessionStatus.CANCELLED

    @pytest.mark.asyncio
    async def test_rolls_back_and_reraises_on_repository_failure(self):
        """Rolls back the transaction and re-raises when the repository update raises."""
        repo = _make_session_status_repo()
        repo.update_session_status = AsyncMock(side_effect=RuntimeError("db error"))
        uc, db = _make_uc(repo)
        with pytest.raises(RuntimeError):
            await uc.update_event_session_status(_session_status_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_raises_not_found_and_rolls_back_when_update_returns_none(self):
        """Raises EventSessionNotFoundError and rolls back when the repository update returns None."""
        repo = _make_session_status_repo()
        repo.update_session_status = AsyncMock(return_value=None)
        uc, db = _make_uc(repo)
        with pytest.raises(EventSessionNotFoundError):
            await uc.update_event_session_status(_session_status_input())
        db.rollback.assert_called_once()

    @pytest.mark.asyncio
    async def test_does_not_commit_when_session_not_found(self):
        """Does not commit or call the repository update when the session cannot be located."""
        repo = _make_session_status_repo(session=None)
        uc, db = _make_uc(repo)
        with pytest.raises(EventSessionNotFoundError):
            await uc.update_event_session_status(_session_status_input())
        db.commit.assert_not_called()
        repo.update_session_status.assert_not_called()
