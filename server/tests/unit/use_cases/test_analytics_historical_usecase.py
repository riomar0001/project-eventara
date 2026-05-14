"""Unit tests for HistoricalEventDataUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.analytics_dto import GetHistoricalEventDataInput
from app.application.use_cases.analytics_historical_usecase import HistoricalEventDataUseCase
from app.domain.entities.analytics_entities import (
    CancelledEventReport,
    EndedEventSummary,
    FeedbackCompleteness,
    HistoricalEventData,
)
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, InvalidDateRangeError

EVENT_ID = uuid.uuid4()
ORGANIZER_ID = uuid.uuid4()
VENUE_ID = uuid.uuid4()
NOW = datetime.now(UTC)


def _make_ended_event(**overrides):
    defaults = {
        "event_id": EVENT_ID, "event_title": "Ended Event",
        "start_date": NOW - timedelta(days=30),
        "end_date": NOW - timedelta(days=1),
        "total_registered": 100, "total_attended": 80,
        "total_no_show": 5, "total_cancelled": 15,
        "average_feedback": 4.2,
    }
    return EndedEventSummary(**(defaults | overrides))


def _make_cancelled_event(**overrides):
    defaults = {
        "event_id": EVENT_ID, "event_title": "Cancelled Event",
        "cancelled_at": NOW - timedelta(days=7),
        "created_by": ORGANIZER_ID,
        "creator_first_name": "Jane", "creator_last_name": "Doe",
        "creator_alias": "janed", "session_count": 2,
    }
    return CancelledEventReport(**(defaults | overrides))


def _make_feedback_completeness(**overrides):
    defaults = {
        "event_id": EVENT_ID, "event_title": "Ended Event",
        "attended_count": 80, "feedback_count": 60,
        "completeness_rate_pct": 75.0,
    }
    return FeedbackCompleteness(**(defaults | overrides))


def _make_repo(**overrides):
    repo = MagicMock()
    repo.get_ended_events = AsyncMock(return_value=[_make_ended_event()])
    repo.get_cancelled_events_report = AsyncMock(return_value=[_make_cancelled_event()])
    repo.get_feedback_completeness = AsyncMock(return_value=[_make_feedback_completeness()])
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    return HistoricalEventDataUseCase(repo or _make_repo())


class TestGetHistoricalData:
    @pytest.mark.asyncio
    async def test_returns_full_historical_data(self):
        result = await _make_uc().get_historical_data(GetHistoricalEventDataInput())
        data = result.data
        assert isinstance(data, HistoricalEventData)
        assert len(data.ended_events) == 1
        assert len(data.cancelled_events) == 1
        assert len(data.feedback_completeness) == 1
        assert data.total_count == 1

    @pytest.mark.asyncio
    async def test_ended_event_has_all_summary_stats(self):
        result = await _make_uc().get_historical_data(GetHistoricalEventDataInput())
        event = result.data.ended_events[0]
        assert event.total_registered == 100
        assert event.total_attended == 80
        assert event.total_no_show == 5
        assert event.total_cancelled == 15
        assert event.average_feedback == 4.2

    @pytest.mark.asyncio
    async def test_empty_when_no_ended_events(self):
        repo = _make_repo(
            get_ended_events=AsyncMock(return_value=[]),
            get_cancelled_events_report=AsyncMock(return_value=[]),
            get_feedback_completeness=AsyncMock(return_value=[]),
        )
        result = await _make_uc(repo).get_historical_data(GetHistoricalEventDataInput())
        assert result.data.ended_events == []
        assert result.data.total_count == 0

    @pytest.mark.asyncio
    async def test_filters_by_date_range(self):
        repo = _make_repo()
        from_dt = NOW - timedelta(days=90)
        to_dt = NOW
        await _make_uc(repo).get_historical_data(
            GetHistoricalEventDataInput(from_date=from_dt, to_date=to_dt)
        )
        repo.get_ended_events.assert_awaited_once_with(
            from_date=from_dt, to_date=to_dt, organizer_id=None, venue_id=None
        )

    @pytest.mark.asyncio
    async def test_filters_by_organizer(self):
        repo = _make_repo()
        org_id = uuid.uuid4()
        await _make_uc(repo).get_historical_data(
            GetHistoricalEventDataInput(organizer_id=org_id)
        )
        repo.get_ended_events.assert_awaited_once_with(
            from_date=None, to_date=None, organizer_id=org_id, venue_id=None
        )

    @pytest.mark.asyncio
    async def test_filters_by_venue(self):
        repo = _make_repo()
        venue_id = uuid.uuid4()
        await _make_uc(repo).get_historical_data(
            GetHistoricalEventDataInput(venue_id=venue_id)
        )
        repo.get_ended_events.assert_awaited_once_with(
            from_date=None, to_date=None, organizer_id=None, venue_id=venue_id
        )

    @pytest.mark.asyncio
    async def test_combined_filters(self):
        repo = _make_repo()
        from_dt = NOW - timedelta(days=180)
        to_dt = NOW
        org_id = uuid.uuid4()
        venue_id = uuid.uuid4()
        await _make_uc(repo).get_historical_data(
            GetHistoricalEventDataInput(
                from_date=from_dt, to_date=to_dt,
                organizer_id=org_id, venue_id=venue_id,
            )
        )
        repo.get_ended_events.assert_awaited_once_with(
            from_date=from_dt, to_date=to_dt, organizer_id=org_id, venue_id=venue_id
        )

    @pytest.mark.asyncio
    async def test_raises_invalid_date_range_when_from_after_to(self):
        with pytest.raises(InvalidDateRangeError):
            await _make_uc().get_historical_data(
                GetHistoricalEventDataInput(
                    from_date=NOW, to_date=NOW - timedelta(days=1)
                )
            )

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_failure(self):
        repo = _make_repo(
            get_ended_events=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_historical_data(GetHistoricalEventDataInput())

    @pytest.mark.asyncio
    async def test_period_comparisons_when_comparison_dates_provided(self):
        repo = _make_repo()
        from_dt = NOW - timedelta(days=60)
        to_dt = NOW
        compare_from = NOW - timedelta(days=180)
        compare_to = NOW - timedelta(days=120)
        result = await _make_uc(repo).get_historical_data(
            GetHistoricalEventDataInput(
                from_date=from_dt, to_date=to_dt,
                compare_from_date=compare_from, compare_to_date=compare_to,
            )
        )
        assert result.data.period_comparisons is not None
        assert len(result.data.period_comparisons) == 2
        assert result.data.period_comparisons[0].period_label == "Current"
        assert result.data.period_comparisons[1].period_label == "Comparison"

    @pytest.mark.asyncio
    async def test_cancelled_event_has_creator_info(self):
        result = await _make_uc().get_historical_data(GetHistoricalEventDataInput())
        cancelled = result.data.cancelled_events[0]
        assert cancelled.creator_first_name == "Jane"
        assert cancelled.creator_last_name == "Doe"
        assert cancelled.session_count == 2

    @pytest.mark.asyncio
    async def test_feedback_completeness_has_rate(self):
        result = await _make_uc().get_historical_data(GetHistoricalEventDataInput())
        fc = result.data.feedback_completeness[0]
        assert fc.attended_count == 80
        assert fc.feedback_count == 60
        assert fc.completeness_rate_pct == 75.0

    @pytest.mark.asyncio
    async def test_feedback_completeness_none_when_zero_attended(self):
        repo = _make_repo(get_feedback_completeness=AsyncMock(return_value=[
            _make_feedback_completeness(attended_count=0, feedback_count=0, completeness_rate_pct=None)
        ]))
        result = await _make_uc(repo).get_historical_data(GetHistoricalEventDataInput())
        assert result.data.feedback_completeness[0].completeness_rate_pct is None

    @pytest.mark.asyncio
    async def test_average_feedback_none_when_no_feedback(self):
        repo = _make_repo(get_ended_events=AsyncMock(return_value=[
            _make_ended_event(average_feedback=None)
        ]))
        result = await _make_uc(repo).get_historical_data(GetHistoricalEventDataInput())
        assert result.data.ended_events[0].average_feedback is None

    @pytest.mark.asyncio
    async def test_calls_all_repo_methods(self):
        repo = _make_repo()
        await _make_uc(repo).get_historical_data(GetHistoricalEventDataInput())
        repo.get_ended_events.assert_awaited_once()
        repo.get_cancelled_events_report.assert_awaited_once()
        repo.get_feedback_completeness.assert_awaited_once()
