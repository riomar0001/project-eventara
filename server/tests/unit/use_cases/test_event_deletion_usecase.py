import uuid
from datetime import datetime
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


def _make_event(status: EventStatus = EventStatus.DRAFT, creator_id: uuid.UUID | None = None) -> Event:
    return Event(
        id=uuid.uuid4(),
        title="Test Event",
        description="desc",
        start_date=datetime(2030, 1, 1),
        end_date=datetime(2030, 1, 2),
        status=status,
        created_by=creator_id or uuid.uuid4(),
        created_at=datetime(2030, 1, 1),
        updated_at=datetime(2030, 1, 1),
    )


def _make_session(
    event_id: uuid.UUID,
    status: EventSessionStatus = EventSessionStatus.DRAFT,
) -> EventSession:
    return EventSession(
        id=uuid.uuid4(),
        event_id=event_id,
        venue_id=uuid.uuid4(),
        title="Session A",
        description=None,
        start_datetime=datetime(2030, 1, 1, 10),
        end_datetime=datetime(2030, 1, 1, 12),
        status=status,
        max_slots=None,
        created_at=datetime(2030, 1, 1),
        updated_at=datetime(2030, 1, 1),
    )


def _make_use_case(event_repo: MagicMock | None = None) -> tuple[EventDeletionUseCase, MagicMock, AsyncMock]:
    repo = event_repo or MagicMock()
    db = AsyncMock(spec=AsyncSession)
    return EventDeletionUseCase(repo, db), repo, db


# ---------------------------------------------------------------------------
# delete_event — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_event_draft_succeeds():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.delete_event = AsyncMock(return_value=True)

    result = await use_case.delete_event(DeleteEventInput(event_id=event.id, deleted_by=caller))

    repo.delete_event.assert_awaited_once_with(event.id)
    assert result.event is event


@pytest.mark.asyncio
async def test_delete_event_cancelled_succeeds():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.CANCELLED, caller)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.delete_event = AsyncMock(return_value=True)

    result = await use_case.delete_event(DeleteEventInput(event_id=event.id, deleted_by=caller))

    assert result.event is event


# ---------------------------------------------------------------------------
# delete_event — error paths
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_event_not_found_raises():
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=None)

    with pytest.raises(EventNotFoundError):
        await use_case.delete_event(DeleteEventInput(event_id=uuid.uuid4(), deleted_by=uuid.uuid4()))


@pytest.mark.asyncio
async def test_delete_event_unauthorized_raises():
    event = _make_event(EventStatus.DRAFT)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)

    with pytest.raises(UnauthorizedEventOperationError):
        await use_case.delete_event(DeleteEventInput(event_id=event.id, deleted_by=uuid.uuid4()))


@pytest.mark.asyncio
async def test_delete_event_posted_status_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.POSTED, caller)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)

    with pytest.raises(EventDeletionNotAllowedError):
        await use_case.delete_event(DeleteEventInput(event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_started_status_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.STARTED, caller)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)

    with pytest.raises(EventDeletionNotAllowedError):
        await use_case.delete_event(DeleteEventInput(event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_ended_status_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.ENDED, caller)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)

    with pytest.raises(EventDeletionNotAllowedError):
        await use_case.delete_event(DeleteEventInput(event_id=event.id, deleted_by=caller))


# ---------------------------------------------------------------------------
# delete_event_session — happy path
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_event_session_draft_succeeds():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    session = _make_session(event.id, EventSessionStatus.DRAFT)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=3)
    repo.delete_session = AsyncMock(return_value=True)

    result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))

    repo.delete_session.assert_awaited_once_with(session.id)
    assert result.session is session


@pytest.mark.asyncio
async def test_delete_event_session_cancelled_succeeds():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    session = _make_session(event.id, EventSessionStatus.CANCELLED)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=2)
    repo.delete_session = AsyncMock(return_value=True)

    result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))

    assert result.session is session


# ---------------------------------------------------------------------------
# delete_event_session — error paths
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_delete_event_session_event_not_found_raises():
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=None)

    with pytest.raises(EventNotFoundError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=uuid.uuid4(), event_id=uuid.uuid4(), deleted_by=uuid.uuid4()))


@pytest.mark.asyncio
async def test_delete_event_session_unauthorized_raises():
    event = _make_event(EventStatus.DRAFT)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)

    with pytest.raises(UnauthorizedEventOperationError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=uuid.uuid4(), event_id=event.id, deleted_by=uuid.uuid4()))


@pytest.mark.asyncio
async def test_delete_event_session_not_found_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=None)

    with pytest.raises(EventSessionNotFoundError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=uuid.uuid4(), event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_session_wrong_event_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    other_event_id = uuid.uuid4()
    session = _make_session(other_event_id, EventSessionStatus.DRAFT)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)

    with pytest.raises(EventSessionNotFoundError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_session_posted_status_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    session = _make_session(event.id, EventSessionStatus.POSTED)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)

    with pytest.raises(EventSessionDeletionNotAllowedError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_session_started_status_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    session = _make_session(event.id, EventSessionStatus.STARTED)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)

    with pytest.raises(EventSessionDeletionNotAllowedError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_session_ended_status_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    session = _make_session(event.id, EventSessionStatus.ENDED)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)

    with pytest.raises(EventSessionDeletionNotAllowedError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_session_last_session_raises():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.DRAFT, caller)
    session = _make_session(event.id, EventSessionStatus.DRAFT)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=1)

    with pytest.raises(EventLastSessionError):
        await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))


@pytest.mark.asyncio
async def test_delete_event_session_with_exactly_two_sessions_succeeds():
    caller = uuid.uuid4()
    event = _make_event(EventStatus.CANCELLED, caller)
    session = _make_session(event.id, EventSessionStatus.CANCELLED)
    use_case, repo, _ = _make_use_case()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.get_session_by_id = AsyncMock(return_value=session)
    repo.count_sessions_by_event_id = AsyncMock(return_value=2)
    repo.delete_session = AsyncMock(return_value=True)

    result = await use_case.delete_event_session(DeleteEventSessionInput(session_id=session.id, event_id=event.id, deleted_by=caller))

    assert result.session is session
    repo.delete_session.assert_awaited_once()
