"""Functional test cases for EventDeletionUseCase — delete_event and delete_event_session."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.event_dto import DeleteEventInput, DeleteEventSessionInput
from app.application.use_cases.event_deletion_usecase import EventDeletionUseCase
from app.domain.entities.event_entity import Event, EventSession, EventSessionStatus, EventStatus
from app.domain.exceptions.event_exceptions import (
    EventDeletionNotAllowedError,
    EventNotFoundError,
    UnauthorizedEventOperationError,
)
from app.domain.exceptions.event_session_exceptions import (
    EventLastSessionError,
    EventSessionDeletionNotAllowedError,
    EventSessionNotFoundError,
)
from app.infrastructure.database.repositories.event_repository import EventRepository

EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
OTHER_ID = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
SESSION_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
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
        title="Session A",
        description=None,
        start_datetime=SESSION_START,
        end_datetime=SESSION_END,
        status=EventSessionStatus.DRAFT,
        max_slots=None,
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


def _make_use_case() -> tuple[EventDeletionUseCase, MagicMock]:
    repo = MagicMock(spec=EventRepository)
    db = AsyncMock(spec=AsyncSession)
    return EventDeletionUseCase(repo, db), repo


# ---------------------------------------------------------------------------
# delete_event — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_draft_event_returns_snapshot():
    """Deleting a DRAFT event returns a snapshot of the deleted event entity."""
    use_case, repo = _make_use_case()
    event = _sample_event(status=EventStatus.DRAFT)
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.delete_event = AsyncMock(return_value=True)

    result = await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))

    assert result.event.id == EVENT_ID
    assert result.event.status == EventStatus.DRAFT
    repo.delete_event.assert_awaited_once_with(EVENT_ID)


@pytest.mark.asyncio
async def test_delete_cancelled_event_returns_snapshot():
    """Deleting a CANCELLED event returns a snapshot of the deleted event entity."""
    use_case, repo = _make_use_case()
    event = _sample_event(status=EventStatus.CANCELLED)
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.delete_event = AsyncMock(return_value=True)

    result = await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))

    assert result.event.status == EventStatus.CANCELLED


@pytest.mark.asyncio
async def test_delete_event_acquires_row_lock():
    """get_event_by_id is called with for_update=True to serialise concurrent deletes."""
    use_case, repo = _make_use_case()
    event = _sample_event()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.delete_event = AsyncMock(return_value=True)

    await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))

    repo.get_event_by_id.assert_awaited_once_with(EVENT_ID, for_update=True)


# ---------------------------------------------------------------------------
# delete_event — error paths
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_event_raises_not_found_when_missing():
    """EventNotFoundError is raised when the event row does not exist."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=None)

    with pytest.raises(EventNotFoundError):
        await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_event_raises_unauthorized_for_non_creator():
    """UnauthorizedEventOperationError is raised when caller is not the event creator."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(created_by=CREATOR_ID))

    with pytest.raises(UnauthorizedEventOperationError):
        await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=OTHER_ID))


@pytest.mark.asyncio
async def test_delete_posted_event_raises_deletion_not_allowed():
    """EventDeletionNotAllowedError is raised when the event status is POSTED."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(status=EventStatus.POSTED))

    with pytest.raises(EventDeletionNotAllowedError):
        await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_started_event_raises_deletion_not_allowed():
    """EventDeletionNotAllowedError is raised when the event status is STARTED."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(status=EventStatus.STARTED))

    with pytest.raises(EventDeletionNotAllowedError):
        await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_ended_event_raises_deletion_not_allowed():
    """EventDeletionNotAllowedError is raised when the event status is ENDED."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(status=EventStatus.ENDED))

    with pytest.raises(EventDeletionNotAllowedError):
        await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_event_does_not_call_delete_when_unauthorized():
    """delete_event repository method is never called when the caller is not the creator."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.delete_event = AsyncMock()

    with pytest.raises(UnauthorizedEventOperationError):
        await use_case.delete_event(DeleteEventInput(event_id=EVENT_ID, deleted_by=OTHER_ID))

    repo.delete_event.assert_not_awaited()


# ---------------------------------------------------------------------------
# delete_event_session — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_draft_session_returns_snapshot():
    """Deleting a DRAFT session returns a snapshot of the deleted session entity."""
    use_case, repo = _make_use_case()
    event = _sample_event()
    session = _sample_session(status=EventSessionStatus.DRAFT)
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=3)
    repo.delete_session = AsyncMock(return_value=True)

    result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))

    assert result.session.id == SESSION_ID
    repo.delete_session.assert_awaited_once_with(SESSION_ID)


@pytest.mark.asyncio
async def test_delete_cancelled_session_returns_snapshot():
    """Deleting a CANCELLED session returns a snapshot of the deleted session entity."""
    use_case, repo = _make_use_case()
    event = _sample_event()
    session = _sample_session(status=EventSessionStatus.CANCELLED)
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=2)
    repo.delete_session = AsyncMock(return_value=True)

    result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))

    assert result.session.status == EventSessionStatus.CANCELLED


@pytest.mark.asyncio
async def test_delete_session_acquires_event_row_lock():
    """get_event_by_id is called with for_update=True to serialise concurrent session deletes."""
    use_case, repo = _make_use_case()
    event = _sample_event()
    session = _sample_session()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=2)
    repo.delete_session = AsyncMock(return_value=True)

    await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))

    repo.get_event_by_id.assert_awaited_once_with(EVENT_ID, for_update=True)


@pytest.mark.asyncio
async def test_delete_session_with_two_sessions_remaining_succeeds():
    """Session can be deleted when exactly two sessions exist (one will remain after)."""
    use_case, repo = _make_use_case()
    event = _sample_event()
    session = _sample_session()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=2)
    repo.delete_session = AsyncMock(return_value=True)

    result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))

    assert result.session is session


# ---------------------------------------------------------------------------
# delete_event_session — error paths
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_session_raises_not_found_when_event_missing():
    """EventNotFoundError is raised when the parent event row does not exist."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=None)

    with pytest.raises(EventNotFoundError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_session_raises_unauthorized_for_non_creator():
    """UnauthorizedEventOperationError is raised when caller is not the event creator."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event(created_by=CREATOR_ID))

    with pytest.raises(UnauthorizedEventOperationError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=OTHER_ID))


@pytest.mark.asyncio
async def test_delete_session_raises_not_found_when_session_missing():
    """EventSessionNotFoundError is raised when the session row does not exist."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=None)

    with pytest.raises(EventSessionNotFoundError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_session_raises_not_found_when_session_belongs_to_other_event():
    """EventSessionNotFoundError is raised when session.event_id does not match the route event_id."""
    use_case, repo = _make_use_case()
    other_event_id = uuid.uuid4()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=_sample_session(event_id=other_event_id))

    with pytest.raises(EventSessionNotFoundError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_posted_session_raises_deletion_not_allowed():
    """EventSessionDeletionNotAllowedError is raised when the session status is POSTED."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.POSTED))

    with pytest.raises(EventSessionDeletionNotAllowedError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_started_session_raises_deletion_not_allowed():
    """EventSessionDeletionNotAllowedError is raised when the session status is STARTED."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.STARTED))

    with pytest.raises(EventSessionDeletionNotAllowedError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_ended_session_raises_deletion_not_allowed():
    """EventSessionDeletionNotAllowedError is raised when the session status is ENDED."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=_sample_session(status=EventSessionStatus.ENDED))

    with pytest.raises(EventSessionDeletionNotAllowedError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_only_session_raises_last_session_error():
    """EventLastSessionError is raised when the session is the sole remaining session."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=_sample_session())
    repo.count_sessions_by_event_id = AsyncMock(return_value=1)

    with pytest.raises(EventLastSessionError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))


@pytest.mark.asyncio
async def test_delete_session_does_not_call_delete_when_last_session():
    """delete_session repository method is never called when it would remove the last session."""
    use_case, repo = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_session_by_id = AsyncMock(return_value=_sample_session())
    repo.count_sessions_by_event_id = AsyncMock(return_value=1)
    repo.delete_session = AsyncMock()

    with pytest.raises(EventLastSessionError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=SESSION_ID, event_id=EVENT_ID, deleted_by=CREATOR_ID))

    repo.delete_session.assert_not_awaited()
