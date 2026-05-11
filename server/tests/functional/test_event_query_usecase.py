"""Functional test cases for GetAllEventsUseCase and GetEventWithSessionsUseCase."""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.event_dto import GetAllEventsInput, GetEventWithSessionsInput
from app.application.use_cases.event_query_usecase import GetEventUseCase
from app.domain.entities.event_entity import Event, EventSession, EventSessionStatus, EventStatus
from app.domain.exceptions.event_exceptions import EventNotFoundError
from app.infrastructure.database.repositories.event_repository import EventRepository

EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
SESSION_ID = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
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
        created_at=None,
        updated_at=None,
    )
    defaults.update(overrides)
    return EventSession(**defaults)


def _make_repo():
    repo = MagicMock(spec=EventRepository)
    repo.get_all_events = AsyncMock(return_value=[_sample_event()])
    repo.count_all_events = AsyncMock(return_value=1)
    repo.get_event_by_id = AsyncMock(return_value=_sample_event())
    repo.get_sessions_by_event_id = AsyncMock(return_value=[_sample_session()])
    return repo


def _make_uc(repo=None):
    repo = repo or _make_repo()
    return GetEventUseCase(repo), repo


# ---------------------------------------------------------------------------
# GetAllEventsUseCase
# ---------------------------------------------------------------------------


class TestGetAllEventsUseCase:
    @pytest.mark.asyncio
    async def test_returns_events_and_pagination_metadata(self):
        """Returns events list with correct total, page, and total_pages metadata."""
        uc, _ = _make_uc()
        result = await uc.get_all_events(GetAllEventsInput(page=1, page_size=20))
        assert len(result.events) == 1
        assert result.total == 1
        assert result.page == 1
        assert result.total_pages == 1

    @pytest.mark.asyncio
    async def test_calls_repository_with_correct_offset_for_page_three(self):
        """Passes offset=20 to the repository when requesting page 3 with page_size=10."""
        uc, repo = _make_uc()
        await uc.get_all_events(GetAllEventsInput(page=3, page_size=10))
        repo.get_all_events.assert_called_once_with(status=None, limit=10, offset=20)

    @pytest.mark.asyncio
    async def test_caps_page_size_at_max_page_size(self):
        """Silently reduces an oversized page_size to MAX_PAGE_SIZE to prevent runaway queries."""
        uc, repo = _make_uc()
        await uc.get_all_events(GetAllEventsInput(page=1, page_size=9999))
        assert repo.get_all_events.call_args.kwargs["limit"] == GetEventUseCase.MAX_PAGE_SIZE

    @pytest.mark.asyncio
    async def test_passes_none_status_when_no_filter_is_supplied(self):
        """Passes status=None to both repository calls when no status filter is requested."""
        uc, repo = _make_uc()
        await uc.get_all_events(GetAllEventsInput(page=1, page_size=20))
        repo.get_all_events.assert_called_once_with(status=None, limit=20, offset=0)
        repo.count_all_events.assert_called_once_with(status=None)

    @pytest.mark.asyncio
    async def test_passes_status_filter_to_both_repository_calls(self):
        """Forwards the status filter to both get_all_events and count_all_events."""
        uc, repo = _make_uc()
        await uc.get_all_events(GetAllEventsInput(page=1, page_size=20, status=EventStatus.POSTED))
        repo.get_all_events.assert_called_once_with(status=EventStatus.POSTED, limit=20, offset=0)
        repo.count_all_events.assert_called_once_with(status=EventStatus.POSTED)

    @pytest.mark.asyncio
    async def test_returns_empty_list_and_zero_totals_when_no_events_exist(self):
        """Returns an empty events list with total=0 and total_pages=0 when the table is empty."""
        repo = _make_repo()
        repo.get_all_events = AsyncMock(return_value=[])
        repo.count_all_events = AsyncMock(return_value=0)
        uc = GetEventUseCase(repo)
        result = await uc.get_all_events(GetAllEventsInput(page=1, page_size=20))
        assert result.events == []
        assert result.total == 0
        assert result.total_pages == 0

    @pytest.mark.asyncio
    async def test_calculates_total_pages_as_ceiling_of_total_divided_by_page_size(self):
        """Returns total_pages=3 when total=25 and page_size=10 (ceiling division)."""
        repo = _make_repo()
        repo.count_all_events = AsyncMock(return_value=25)
        repo.get_all_events = AsyncMock(return_value=[_sample_event()] * 10)
        uc = GetEventUseCase(repo)
        result = await uc.get_all_events(GetAllEventsInput(page=1, page_size=10))
        assert result.total_pages == 3

    @pytest.mark.asyncio
    async def test_total_pages_is_one_when_total_exactly_equals_page_size(self):
        """Returns total_pages=1 when total rows exactly matches page_size."""
        repo = _make_repo()
        repo.count_all_events = AsyncMock(return_value=20)
        repo.get_all_events = AsyncMock(return_value=[_sample_event()] * 20)
        uc = GetEventUseCase(repo)
        result = await uc.get_all_events(GetAllEventsInput(page=1, page_size=20))
        assert result.total_pages == 1

    @pytest.mark.asyncio
    async def test_effective_page_size_is_reflected_in_output(self):
        """Reports the effective (possibly capped) page_size in the output DTO."""
        uc, _ = _make_uc()
        result = await uc.get_all_events(GetAllEventsInput(page=1, page_size=15))
        assert result.page_size == 15


# ---------------------------------------------------------------------------
# GetEventWithSessionsUseCase
# ---------------------------------------------------------------------------


class TestGetEventWithSessionsUseCase:
    @pytest.mark.asyncio
    async def test_returns_event_and_sessions_for_valid_event_id(self):
        """Returns the event entity and its associated session list for a known event ID."""
        uc, _ = _make_uc()
        result = await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        assert result.event.id == EVENT_ID
        assert len(result.sessions) == 1

    @pytest.mark.asyncio
    async def test_raises_event_not_found_when_no_row_exists_for_event_id(self):
        """Raises EventNotFoundError when the repository returns None for the given event ID."""
        repo = _make_repo()
        repo.get_event_by_id = AsyncMock(return_value=None)
        uc = GetEventUseCase(repo)
        with pytest.raises(EventNotFoundError):
            await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))

    @pytest.mark.asyncio
    async def test_skips_session_query_entirely_when_event_is_not_found(self):
        """Never calls get_sessions_by_event_id when the parent event does not exist."""
        repo = _make_repo()
        repo.get_event_by_id = AsyncMock(return_value=None)
        uc = GetEventUseCase(repo)
        with pytest.raises(EventNotFoundError):
            await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        repo.get_sessions_by_event_id.assert_not_called()

    @pytest.mark.asyncio
    async def test_returns_event_with_empty_sessions_when_event_has_no_sessions(self):
        """Returns an empty sessions list when the event exists but has no sessions."""
        repo = _make_repo()
        repo.get_sessions_by_event_id = AsyncMock(return_value=[])
        uc = GetEventUseCase(repo)
        result = await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        assert result.sessions == []

    @pytest.mark.asyncio
    async def test_fetches_sessions_using_the_supplied_event_id(self):
        """Passes the exact event_id from the input DTO to get_sessions_by_event_id."""
        uc, repo = _make_uc()
        await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        repo.get_sessions_by_event_id.assert_called_once_with(EVENT_ID)

    @pytest.mark.asyncio
    async def test_fetches_event_without_acquiring_a_row_lock(self):
        """Calls get_event_by_id without for_update=True since no mutation follows the read."""
        uc, repo = _make_uc()
        await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        repo.get_event_by_id.assert_called_once_with(EVENT_ID)

    @pytest.mark.asyncio
    async def test_sessions_carry_venue_name_and_location_populated_by_repository(self):
        """Sessions in the output include venue_name and venue_location as provided by the repository."""
        session_with_venue = _sample_session(venue_name="SMX Convention Center", venue_location="Davao City")
        repo = _make_repo()
        repo.get_sessions_by_event_id = AsyncMock(return_value=[session_with_venue])
        uc = GetEventUseCase(repo)
        result = await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        assert result.sessions[0].venue_name == "SMX Convention Center"
        assert result.sessions[0].venue_location == "Davao City"

    @pytest.mark.asyncio
    async def test_sessions_have_none_for_venue_fields_when_repository_omits_them(self):
        """Sessions with no joined venue data report None for venue_name and venue_location."""
        uc, _ = _make_uc()
        result = await uc.get_event_with_sessions(GetEventWithSessionsInput(event_id=EVENT_ID))
        assert result.sessions[0].venue_name is None
        assert result.sessions[0].venue_location is None
