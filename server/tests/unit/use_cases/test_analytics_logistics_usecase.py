"""Unit tests for LogisticsAnalyticsUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.analytics_dto import (
    GetEventLogisticsInput,
    GetRegistrationLogisticsInput,
    GetSessionTimelineInput,
    GetVolunteerLogisticsInput,
)
from app.application.use_cases.analytics_logistics_usecase import LogisticsAnalyticsUseCase
from app.domain.entities.analytics_entities import (
    EventLogisticsOverview,
    RegistrationLogistics,
    SessionTimeline,
    SessionTimelineEntry,
    SessionUtilisation,
    SessionVenueAssignment,
    VenueCapacityVsRegistration,
    VolunteerLogistics,
    VolunteerRosterEntry,
)
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, EventNotFoundError

EVENT_ID = uuid.uuid4()
SESSION_ID = uuid.uuid4()
VENUE_ID = uuid.uuid4()
VOLUNTEER_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
NOW = datetime.now(UTC)


def _make_venue_assignment(**overrides):
    defaults = {
        "session_id": SESSION_ID,
        "session_title": "Test Session",
        "venue_id": VENUE_ID,
        "venue_name": "Test Venue",
        "venue_city": "Test City",
        "venue_capacity": 100,
    }
    return SessionVenueAssignment(**(defaults | overrides))


def _make_session_utilisation(**overrides):
    defaults = {
        "session_id": SESSION_ID,
        "session_title": "Test Session",
        "checked_in": 50,
        "max_slots": 100,
        "utilisation_pct": 50.0,
        "over_capacity": False,
    }
    return SessionUtilisation(**(defaults | overrides))


def _make_overview(**overrides):
    defaults = {
        "event_id": EVENT_ID,
        "event_title": "Test Event",
        "total_sessions": 1,
        "scheduled_dates": [NOW],
        "venue_assignments": [_make_venue_assignment()],
        "session_utilisation": [_make_session_utilisation()],
        "over_capacity_sessions": [],
        "venue_capacity_vs_registrations": [
            VenueCapacityVsRegistration(
                session_id=SESSION_ID, session_title="Test Session",
                venue_capacity=100, registered_count=50,
            )
        ],
    }
    return EventLogisticsOverview(**(defaults | overrides))


def _make_timeline(**overrides):
    entry = SessionTimelineEntry(
        session_id=SESSION_ID, session_title="Test Session",
        event_id=EVENT_ID, event_title="Test Event",
        venue_id=VENUE_ID, venue_name="Test Venue",
        start_datetime=NOW, end_datetime=NOW + timedelta(hours=2),
        status="started",
    )
    defaults = {"ongoing": [entry], "upcoming": [], "completed": []}
    return SessionTimeline(**(defaults | overrides))


def _make_volunteer_logistics(**overrides):
    roster = VolunteerRosterEntry(
        volunteer_id=VOLUNTEER_ID, user_id=USER_ID,
        first_name="John", last_name="Doe", alias="johnd",
        role_name="Usher", contact_phone="1234567890", status="joined",
    )
    defaults = {
        "event_id": EVENT_ID, "event_title": "Test Event",
        "joined_volunteer_count": 1, "joined_volunteer_roster": [roster],
        "volunteer_to_participant_ratio": 0.5, "pending_volunteer_count": 2,
    }
    return VolunteerLogistics(**(defaults | overrides))


def _make_registration_logistics(**overrides):
    defaults = {
        "session_id": SESSION_ID, "session_title": "Test Session",
        "total_registrations": 100, "cancelled_count": 10,
        "cancellation_rate_pct": 10.0, "no_show_count": 5,
        "no_show_rate_pct": 5.56, "qr_checkin_count": 60,
        "manual_checkin_count": 25,
    }
    return RegistrationLogistics(**(defaults | overrides))


def _make_repo(**overrides):
    repo = MagicMock()
    repo.get_event_logistics_overview = AsyncMock(return_value=_make_overview())
    repo.get_session_utilisation = AsyncMock(return_value=[])
    repo.get_session_timeline = AsyncMock(return_value=_make_timeline())
    repo.get_volunteer_logistics = AsyncMock(return_value=_make_volunteer_logistics())
    repo.get_registration_logistics = AsyncMock(return_value=[_make_registration_logistics()])
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    return LogisticsAnalyticsUseCase(repo or _make_repo())


class TestGetEventLogisticsOverview:
    @pytest.mark.asyncio
    async def test_returns_overview_for_valid_event(self):
        result = await _make_uc().get_event_logistics_overview(
            GetEventLogisticsInput(event_id=EVENT_ID)
        )
        overview = result.overview
        assert overview.event_id == EVENT_ID
        assert overview.event_title == "Test Event"
        assert overview.total_sessions == 1
        assert len(overview.venue_assignments) == 1

    @pytest.mark.asyncio
    async def test_raises_event_not_found_when_event_does_not_exist(self):
        repo = _make_repo(
            get_event_logistics_overview=AsyncMock(
                side_effect=EventNotFoundError(f"Event {EVENT_ID} not found")
            )
        )
        with pytest.raises(EventNotFoundError):
            await _make_uc(repo).get_event_logistics_overview(
                GetEventLogisticsInput(event_id=EVENT_ID)
            )

    @pytest.mark.asyncio
    async def test_calls_repo_with_correct_event_id(self):
        repo = _make_repo()
        await _make_uc(repo).get_event_logistics_overview(
            GetEventLogisticsInput(event_id=EVENT_ID)
        )
        repo.get_event_logistics_overview.assert_awaited_once_with(EVENT_ID)

    @pytest.mark.asyncio
    async def test_empty_event_returns_zero_sessions(self):
        repo = _make_repo(get_event_logistics_overview=AsyncMock(
            return_value=_make_overview(
                total_sessions=0, 
                scheduled_dates=[], 
                venue_assignments=[], 
                session_utilisation=[], 
                venue_capacity_vs_registrations=[]
            )
        ))
        result = await _make_uc(repo).get_event_logistics_overview(
            GetEventLogisticsInput(event_id=EVENT_ID)
        )
        assert result.overview.total_sessions == 0
        assert result.overview.session_utilisation == []

    @pytest.mark.asyncio
    async def test_returns_over_capacity_flag(self):
        util = _make_session_utilisation(over_capacity=True)
        repo = _make_repo(get_event_logistics_overview=AsyncMock(
            return_value=_make_overview(over_capacity_sessions=[util])
        ))
        result = await _make_uc(repo).get_event_logistics_overview(
            GetEventLogisticsInput(event_id=EVENT_ID)
        )
        assert len(result.overview.over_capacity_sessions) == 1
        assert result.overview.over_capacity_sessions[0].over_capacity is True

    @pytest.mark.asyncio
    async def test_utilisation_100_percent(self):
        util = _make_session_utilisation(checked_in=100, max_slots=100, utilisation_pct=100.0)
        repo = _make_repo(get_event_logistics_overview=AsyncMock(
            return_value=_make_overview(session_utilisation=[util])
        ))
        result = await _make_uc(repo).get_event_logistics_overview(
            GetEventLogisticsInput(event_id=EVENT_ID)
        )
        assert result.overview.session_utilisation[0].utilisation_pct == 100.0

    @pytest.mark.asyncio
    async def test_utilisation_none_when_max_slots_none(self):
        util = _make_session_utilisation(max_slots=None, utilisation_pct=None)
        repo = _make_repo(get_event_logistics_overview=AsyncMock(
            return_value=_make_overview(session_utilisation=[util])
        ))
        result = await _make_uc(repo).get_event_logistics_overview(
            GetEventLogisticsInput(event_id=EVENT_ID)
        )
        assert result.overview.session_utilisation[0].utilisation_pct is None

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_repo_failure(self):
        repo = _make_repo(
            get_event_logistics_overview=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_event_logistics_overview(
                    GetEventLogisticsInput(event_id=EVENT_ID)
                )

    @pytest.mark.asyncio
    async def test_error_message_includes_cause_when_debug_true(self):
        repo = _make_repo(
            get_event_logistics_overview=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = True
            with pytest.raises(AnalyticsDataFetchError) as exc_info:
                await _make_uc(repo).get_event_logistics_overview(
                    GetEventLogisticsInput(event_id=EVENT_ID)
                )
        assert "db down" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_reraises_analytics_error_without_wrapping(self):
        original = AnalyticsDataFetchError("already typed")
        repo = _make_repo(get_event_logistics_overview=AsyncMock(side_effect=original))
        with pytest.raises(AnalyticsDataFetchError) as exc_info:
            await _make_uc(repo).get_event_logistics_overview(
                GetEventLogisticsInput(event_id=EVENT_ID)
            )
        assert exc_info.value is original


class TestGetSessionTimeline:
    @pytest.mark.asyncio
    async def test_returns_timeline_with_ongoing_sessions(self):
        result = await _make_uc().get_session_timeline(GetSessionTimelineInput())
        assert len(result.timeline.ongoing) == 1
        assert result.timeline.ongoing[0].status == "started"

    @pytest.mark.asyncio
    async def test_empty_timeline_returns_empty_lists(self):
        repo = _make_repo(get_session_timeline=AsyncMock(
            return_value=SessionTimeline(ongoing=[], upcoming=[], completed=[])
        ))
        result = await _make_uc(repo).get_session_timeline(GetSessionTimelineInput())
        assert result.timeline.ongoing == []
        assert result.timeline.upcoming == []
        assert result.timeline.completed == []

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_repo_failure(self):
        repo = _make_repo(
            get_session_timeline=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_session_timeline(GetSessionTimelineInput())

    @pytest.mark.asyncio
    async def test_calls_repo_get_session_timeline(self):
        repo = _make_repo()
        await _make_uc(repo).get_session_timeline(GetSessionTimelineInput())
        repo.get_session_timeline.assert_awaited_once()


class TestGetVolunteerLogistics:
    @pytest.mark.asyncio
    async def test_returns_volunteer_logistics_for_valid_event(self):
        result = await _make_uc().get_volunteer_logistics(
            GetVolunteerLogisticsInput(event_id=EVENT_ID)
        )
        assert result.logistics.event_id == EVENT_ID
        assert result.logistics.joined_volunteer_count == 1
        assert result.logistics.pending_volunteer_count == 2
        assert result.logistics.volunteer_to_participant_ratio == 0.5
        assert len(result.logistics.joined_volunteer_roster) == 1

    @pytest.mark.asyncio
    async def test_raises_event_not_found(self):
        repo = _make_repo(
            get_volunteer_logistics=AsyncMock(
                side_effect=EventNotFoundError(f"Event {EVENT_ID} not found")
            )
        )
        with pytest.raises(EventNotFoundError):
            await _make_uc(repo).get_volunteer_logistics(
                GetVolunteerLogisticsInput(event_id=EVENT_ID)
            )

    @pytest.mark.asyncio
    async def test_zero_volunteers_returns_empty_roster(self):
        repo = _make_repo(get_volunteer_logistics=AsyncMock(
            return_value=_make_volunteer_logistics(
                joined_volunteer_count=0, joined_volunteer_roster=[],
                volunteer_to_participant_ratio=None, pending_volunteer_count=0,
            )
        ))
        result = await _make_uc(repo).get_volunteer_logistics(
            GetVolunteerLogisticsInput(event_id=EVENT_ID)
        )
        assert result.logistics.joined_volunteer_count == 0
        assert result.logistics.volunteer_to_participant_ratio is None

    @pytest.mark.asyncio
    async def test_ratio_none_when_no_checkins(self):
        repo = _make_repo(get_volunteer_logistics=AsyncMock(
            return_value=_make_volunteer_logistics(volunteer_to_participant_ratio=None)
        ))
        result = await _make_uc(repo).get_volunteer_logistics(
            GetVolunteerLogisticsInput(event_id=EVENT_ID)
        )
        assert result.logistics.volunteer_to_participant_ratio is None

    @pytest.mark.asyncio
    async def test_calls_repo_with_correct_event_id(self):
        repo = _make_repo()
        await _make_uc(repo).get_volunteer_logistics(
            GetVolunteerLogisticsInput(event_id=EVENT_ID)
        )
        repo.get_volunteer_logistics.assert_awaited_once_with(EVENT_ID)


class TestGetRegistrationLogistics:
    @pytest.mark.asyncio
    async def test_returns_registration_logistics_for_valid_event(self):
        result = await _make_uc().get_registration_logistics(
            GetRegistrationLogisticsInput(event_id=EVENT_ID)
        )
        assert len(result.registrations) == 1
        reg = result.registrations[0]
        assert reg.total_registrations == 100
        assert reg.cancelled_count == 10
        assert reg.cancellation_rate_pct == 10.0
        assert reg.no_show_count == 5
        assert reg.qr_checkin_count == 60
        assert reg.manual_checkin_count == 25

    @pytest.mark.asyncio
    async def test_empty_event_returns_empty_list(self):
        repo = _make_repo(get_registration_logistics=AsyncMock(return_value=[]))
        result = await _make_uc(repo).get_registration_logistics(
            GetRegistrationLogisticsInput(event_id=EVENT_ID)
        )
        assert result.registrations == []

    @pytest.mark.asyncio
    async def test_zero_registrations_returns_zero_rates(self):
        repo = _make_repo(get_registration_logistics=AsyncMock(return_value=[
            _make_registration_logistics(
                total_registrations=0, cancelled_count=0, cancellation_rate_pct=None,
                no_show_count=0, no_show_rate_pct=None,
                qr_checkin_count=0, manual_checkin_count=0,
            )
        ]))
        result = await _make_uc(repo).get_registration_logistics(
            GetRegistrationLogisticsInput(event_id=EVENT_ID)
        )
        reg = result.registrations[0]
        assert reg.cancellation_rate_pct is None
        assert reg.no_show_rate_pct is None

    @pytest.mark.asyncio
    async def test_all_cancelled_returns_100_percent(self):
        repo = _make_repo(get_registration_logistics=AsyncMock(return_value=[
            _make_registration_logistics(
                total_registrations=50, cancelled_count=50, cancellation_rate_pct=100.0,
                no_show_count=0, no_show_rate_pct=None,
            )
        ]))
        result = await _make_uc(repo).get_registration_logistics(
            GetRegistrationLogisticsInput(event_id=EVENT_ID)
        )
        assert result.registrations[0].cancellation_rate_pct == 100.0

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_repo_failure(self):
        repo = _make_repo(
            get_registration_logistics=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_registration_logistics(
                    GetRegistrationLogisticsInput(event_id=EVENT_ID)
                )

    @pytest.mark.asyncio
    async def test_calls_repo_with_correct_event_id(self):
        repo = _make_repo()
        await _make_uc(repo).get_registration_logistics(
            GetRegistrationLogisticsInput(event_id=EVENT_ID)
        )
        repo.get_registration_logistics.assert_awaited_once_with(EVENT_ID)
