"""Unit tests for PerformanceAnalyticsUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.analytics_dto import (
    GetEventPerformanceInput,
    GetHistoricalPerformanceInput,
    GetOngoingPerformanceInput,
)
from app.application.use_cases.analytics_performance_usecase import PerformanceAnalyticsUseCase
from app.domain.entities.analytics_entities import (
    AttendanceRate,
    EventAttendanceRate,
    EventPerformance,
    EventStatusTransition,
    FeedbackScoreSummary,
    FeedbackTrendPoint,
    HistoricalPerformance,
    LiveAttendance,
    OngoingPerformance,
    OrganizerOutput,
    SessionStatusDistribution,
    TopRatedEvent,
    VolunteerPerformance,
    YearOverYearAttendance,
)
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError

EVENT_ID = uuid.uuid4()
SESSION_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
VOLUNTEER_ID = uuid.uuid4()


def _make_attendance_rate(**overrides):
    defaults = {
        "session_id": SESSION_ID, "session_title": "Test Session",
        "event_id": EVENT_ID, "registered_count": 100,
        "attended_count": 80, "attendance_rate_pct": 80.0,
    }
    return AttendanceRate(**(defaults | overrides))


def _make_event_attendance_rate(**overrides):
    defaults = {
        "event_id": EVENT_ID, "event_title": "Test Event",
        "registered_count": 200, "attended_count": 160,
        "attendance_rate_pct": 80.0,
    }
    return EventAttendanceRate(**(defaults | overrides))


def _make_repo(**overrides):
    repo = MagicMock()
    repo.get_attendance_rates = AsyncMock(return_value=[_make_attendance_rate()])
    repo.get_event_attendance_rates = AsyncMock(return_value=[_make_event_attendance_rate()])
    repo.get_feedback_summaries = AsyncMock(return_value=[
        FeedbackScoreSummary(event_id=EVENT_ID, event_title="Test Event", average_rating=4.5, total_feedback_count=10)
    ])
    repo.get_feedback_trend = AsyncMock(return_value=[
        FeedbackTrendPoint(event_id=EVENT_ID, event_title="Test Event", end_date=None, average_rating=4.5, feedback_count=10)
    ])
    repo.get_top_rated_events = AsyncMock(return_value=[
        TopRatedEvent(event_id=EVENT_ID, event_title="Test Event", average_rating=4.8, feedback_count=15)
    ])
    repo.get_volunteer_performance = AsyncMock(return_value=[
        VolunteerPerformance(
            volunteer_id=VOLUNTEER_ID, 
            user_id=USER_ID, first_name="John", 
            last_name="Doe", alias="johnd", 
            role_name="Usher", 
            joined_count=5, 
            left_count=1)
    ])
    repo.get_organizer_output = AsyncMock(return_value=[
        OrganizerOutput(
            organizer_id=USER_ID, 
            first_name="Jane", 
            last_name="Doe", 
            alias="janed", 
            total_events_created=10, 
            average_sessions_per_event=2.5, 
            average_attendance_rate_pct=75.0)
    ])
    repo.get_session_status_distribution = AsyncMock(return_value=[
        SessionStatusDistribution(status="started", count=3),
        SessionStatusDistribution(status="ended", count=10),
    ])
    repo.get_repeat_attendee_rate = AsyncMock(return_value=25.0)
    repo.get_average_registration_to_checkin_lead_time = AsyncMock(return_value=48.5)
    repo.get_live_attendance = AsyncMock(return_value=[
        LiveAttendance(
            session_id=SESSION_ID, 
            session_title="Test", 
            event_id=EVENT_ID, event_title="Test Event", 
            checked_in_count=50, 
            max_slots=100, 
            remaining_slots=50)
    ])
    repo.get_year_over_year_attendance = AsyncMock(return_value=[
        YearOverYearAttendance(year=2025, attended_count=100, growth_pct=None),
        YearOverYearAttendance(year=2026, attended_count=150, growth_pct=50.0),
    ])
    repo.get_events_by_status_over_time = AsyncMock(return_value=[
        EventStatusTransition(period="2026-01", status="ended", count=3),
    ])
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    return PerformanceAnalyticsUseCase(repo or _make_repo())


class TestGetEventPerformance:
    @pytest.mark.asyncio
    async def test_returns_full_performance_data(self):
        result = await _make_uc().get_event_performance(GetEventPerformanceInput())
        perf = result.performance
        assert isinstance(perf, EventPerformance)
        assert len(perf.attendance_rates) == 1
        assert len(perf.event_attendance_rates) == 1
        assert len(perf.feedback_summaries) == 1
        assert len(perf.feedback_trend) == 1
        assert len(perf.top_rated_events) == 1
        assert len(perf.volunteer_performance) == 1
        assert len(perf.organizer_output) == 1
        assert len(perf.session_status_distribution) == 2
        assert perf.repeat_attendee_rate_pct == 25.0
        assert perf.average_registration_to_checkin_lead_time_hours == 48.5

    @pytest.mark.asyncio
    async def test_empty_data_returns_zero_lists(self):
        repo = _make_repo(
            get_attendance_rates=AsyncMock(return_value=[]),
            get_event_attendance_rates=AsyncMock(return_value=[]),
            get_feedback_summaries=AsyncMock(return_value=[]),
            get_feedback_trend=AsyncMock(return_value=[]),
            get_top_rated_events=AsyncMock(return_value=[]),
            get_volunteer_performance=AsyncMock(return_value=[]),
            get_organizer_output=AsyncMock(return_value=[]),
            get_session_status_distribution=AsyncMock(return_value=[]),
            get_repeat_attendee_rate=AsyncMock(return_value=None),
            get_average_registration_to_checkin_lead_time=AsyncMock(return_value=None),
        )
        result = await _make_uc(repo).get_event_performance(GetEventPerformanceInput())
        perf = result.performance
        assert perf.attendance_rates == []
        assert perf.repeat_attendee_rate_pct is None
        assert perf.average_registration_to_checkin_lead_time_hours is None

    @pytest.mark.asyncio
    async def test_filters_by_event_id(self):
        repo = _make_repo()
        event_id = uuid.uuid4()
        await _make_uc(repo).get_event_performance(
            GetEventPerformanceInput(event_id=event_id)
        )
        repo.get_attendance_rates.assert_awaited_once_with(event_id)

    @pytest.mark.asyncio
    async def test_passes_min_feedback_count_to_repo(self):
        repo = _make_repo()
        await _make_uc(repo).get_event_performance(
            GetEventPerformanceInput(min_feedback_count=5)
        )
        repo.get_top_rated_events.assert_awaited_once_with(10, 5)

    @pytest.mark.asyncio
    async def test_passes_feedback_trend_limit_to_repo(self):
        repo = _make_repo()
        await _make_uc(repo).get_event_performance(
            GetEventPerformanceInput(feedback_trend_limit=6)
        )
        repo.get_feedback_trend.assert_awaited_once_with(6)

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_failure(self):
        repo = _make_repo(
            get_attendance_rates=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_event_performance(GetEventPerformanceInput())

    @pytest.mark.asyncio
    async def test_attendance_rate_is_none_when_zero_registered(self):
        repo = _make_repo(get_attendance_rates=AsyncMock(return_value=[
            _make_attendance_rate(registered_count=0, attended_count=0, attendance_rate_pct=None)
        ]))
        result = await _make_uc(repo).get_event_performance(GetEventPerformanceInput())
        assert result.performance.attendance_rates[0].attendance_rate_pct is None

    @pytest.mark.asyncio
    async def test_repeat_attendee_rate_is_none_when_no_attendees(self):
        repo = _make_repo(get_repeat_attendee_rate=AsyncMock(return_value=None))
        result = await _make_uc(repo).get_event_performance(GetEventPerformanceInput())
        assert result.performance.repeat_attendee_rate_pct is None


class TestGetOngoingPerformance:
    @pytest.mark.asyncio
    async def test_returns_live_attendance(self):
        result = await _make_uc().get_ongoing_performance(GetOngoingPerformanceInput())
        perf = result.performance
        assert isinstance(perf, OngoingPerformance)
        assert len(perf.live_attendance) == 1
        assert perf.live_attendance[0].checked_in_count == 50
        assert perf.live_attendance[0].remaining_slots == 50

    @pytest.mark.asyncio
    async def test_empty_when_no_active_sessions(self):
        repo = _make_repo(get_live_attendance=AsyncMock(return_value=[]))
        result = await _make_uc(repo).get_ongoing_performance(GetOngoingPerformanceInput())
        assert result.performance.live_attendance == []

    @pytest.mark.asyncio
    async def test_remaining_slots_none_when_max_slots_none(self):
        repo = _make_repo(get_live_attendance=AsyncMock(return_value=[
            LiveAttendance(
                session_id=SESSION_ID, 
                session_title="Test", 
                event_id=EVENT_ID, 
                event_title="Test Event", 
                checked_in_count=10, 
                max_slots=None, 
                remaining_slots=None)
        ]))
        result = await _make_uc(repo).get_ongoing_performance(GetOngoingPerformanceInput())
        assert result.performance.live_attendance[0].remaining_slots is None

    @pytest.mark.asyncio
    async def test_real_time_slot_availability_matches_live_attendance(self):
        result = await _make_uc().get_ongoing_performance(GetOngoingPerformanceInput())
        assert result.performance.real_time_slot_availability == result.performance.live_attendance

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_failure(self):
        repo = _make_repo(
            get_live_attendance=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_ongoing_performance(GetOngoingPerformanceInput())


class TestGetHistoricalPerformance:
    @pytest.mark.asyncio
    async def test_returns_yoy_and_status_transitions(self):
        result = await _make_uc().get_historical_performance(GetHistoricalPerformanceInput())
        perf = result.performance
        assert isinstance(perf, HistoricalPerformance)
        assert len(perf.year_over_year_attendance) == 2
        assert perf.year_over_year_attendance[0].year == 2025
        assert perf.year_over_year_attendance[0].growth_pct is None
        assert perf.year_over_year_attendance[1].year == 2026
        assert perf.year_over_year_attendance[1].growth_pct == 50.0
        assert len(perf.events_by_status_over_time) == 1

    @pytest.mark.asyncio
    async def test_empty_when_no_data(self):
        repo = _make_repo(
            get_year_over_year_attendance=AsyncMock(return_value=[]),
            get_events_by_status_over_time=AsyncMock(return_value=[]),
        )
        result = await _make_uc(repo).get_historical_performance(GetHistoricalPerformanceInput())
        assert result.performance.year_over_year_attendance == []
        assert result.performance.events_by_status_over_time == []

    @pytest.mark.asyncio
    async def test_first_year_has_no_growth(self):
        repo = _make_repo(get_year_over_year_attendance=AsyncMock(return_value=[
            YearOverYearAttendance(year=2025, attended_count=50, growth_pct=None),
        ]))
        result = await _make_uc(repo).get_historical_performance(GetHistoricalPerformanceInput())
        assert result.performance.year_over_year_attendance[0].growth_pct is None

    @pytest.mark.asyncio
    async def test_zero_attendance_previous_year(self):
        repo = _make_repo(get_year_over_year_attendance=AsyncMock(return_value=[
            YearOverYearAttendance(year=2024, attended_count=0, growth_pct=None),
            YearOverYearAttendance(year=2025, attended_count=50, growth_pct=None),
        ]))
        result = await _make_uc(repo).get_historical_performance(GetHistoricalPerformanceInput())
        assert len(result.performance.year_over_year_attendance) == 2

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_failure(self):
        repo = _make_repo(
            get_year_over_year_attendance=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_historical_performance(GetHistoricalPerformanceInput())

    @pytest.mark.asyncio
    async def test_calls_both_repo_methods(self):
        repo = _make_repo()
        await _make_uc(repo).get_historical_performance(GetHistoricalPerformanceInput())
        repo.get_year_over_year_attendance.assert_awaited_once()
        repo.get_events_by_status_over_time.assert_awaited_once()
