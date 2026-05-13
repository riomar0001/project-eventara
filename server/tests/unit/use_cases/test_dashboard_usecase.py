"""Unit tests for DashboardUseCase."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.dashboard_dto import GetDashboardInput
from app.application.use_cases.dashboard_usecase import DashboardUseCase
from app.domain.entities.dashboard_entity import DashboardMetrics
from app.domain.exceptions.dashboard_exceptions import DashboardDataFetchError


def _make_repo(**overrides):
    repo = MagicMock()
    repo.get_recent_events = AsyncMock(return_value=[])
    repo.get_ongoing_events = AsyncMock(return_value=[])
    repo.get_upcoming_events = AsyncMock(return_value=[])
    repo.get_top_weekly_participants = AsyncMock(return_value=[])
    repo.get_top_weekly_volunteer_applications = AsyncMock(return_value=[])
    repo.get_top_active_volunteers = AsyncMock(return_value=[])
    repo.get_top_active_participants = AsyncMock(return_value=[])
    repo.get_top_venues = AsyncMock(return_value=[])
    repo.get_users_per_week = AsyncMock(return_value=[])
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


class TestDashboardUseCase:
    @pytest.mark.asyncio
    async def test_returns_dashboard_metrics_when_all_queries_succeed(self):
        result = await DashboardUseCase(_make_repo()).get_dashboard(GetDashboardInput())
        assert isinstance(result.metrics, DashboardMetrics)

    @pytest.mark.asyncio
    async def test_all_metric_lists_are_empty_when_repo_returns_empty_results(self):
        result = await DashboardUseCase(_make_repo()).get_dashboard(GetDashboardInput())
        assert result.metrics.recent_events == []
        assert result.metrics.ongoing_events == []
        assert result.metrics.upcoming_events == []
        assert result.metrics.top_weekly_participants == []
        assert result.metrics.top_weekly_volunteer_applications == []
        assert result.metrics.top_active_volunteers == []
        assert result.metrics.top_active_participants == []
        assert result.metrics.top_venues == []
        assert result.metrics.users_per_week == []

    @pytest.mark.asyncio
    async def test_raises_dashboard_fetch_error_when_get_recent_events_fails(self):
        repo = _make_repo(get_recent_events=AsyncMock(side_effect=RuntimeError("db error")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(DashboardDataFetchError):
                await DashboardUseCase(repo).get_dashboard(GetDashboardInput())

    @pytest.mark.asyncio
    async def test_raises_dashboard_fetch_error_when_get_ongoing_events_fails(self):
        repo = _make_repo(get_ongoing_events=AsyncMock(side_effect=RuntimeError("db error")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(DashboardDataFetchError):
                await DashboardUseCase(repo).get_dashboard(GetDashboardInput())

    @pytest.mark.asyncio
    async def test_raises_dashboard_fetch_error_when_get_top_venues_fails(self):
        repo = _make_repo(get_top_venues=AsyncMock(side_effect=RuntimeError("db error")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(DashboardDataFetchError):
                await DashboardUseCase(repo).get_dashboard(GetDashboardInput())

    @pytest.mark.asyncio
    async def test_raises_dashboard_fetch_error_when_get_users_per_week_fails(self):
        repo = _make_repo(get_users_per_week=AsyncMock(side_effect=RuntimeError("db error")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(DashboardDataFetchError):
                await DashboardUseCase(repo).get_dashboard(GetDashboardInput())

    @pytest.mark.asyncio
    async def test_reraises_dashboard_fetch_error_without_wrapping(self):
        original = DashboardDataFetchError("already typed")
        repo = _make_repo(get_recent_events=AsyncMock(side_effect=original))
        with pytest.raises(DashboardDataFetchError) as exc_info:
            await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        assert exc_info.value is original

    @pytest.mark.asyncio
    async def test_calls_get_recent_events_with_recent_events_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_recent_events.assert_awaited_once_with(DashboardUseCase.RECENT_EVENTS_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_upcoming_events_with_upcoming_events_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_upcoming_events.assert_awaited_once_with(DashboardUseCase.UPCOMING_EVENTS_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_top_weekly_participants_with_leaderboard_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_top_weekly_participants.assert_awaited_once_with(DashboardUseCase.LEADERBOARD_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_top_weekly_volunteer_applications_with_leaderboard_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_top_weekly_volunteer_applications.assert_awaited_once_with(DashboardUseCase.LEADERBOARD_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_top_active_volunteers_with_leaderboard_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_top_active_volunteers.assert_awaited_once_with(DashboardUseCase.LEADERBOARD_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_top_active_participants_with_leaderboard_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_top_active_participants.assert_awaited_once_with(DashboardUseCase.LEADERBOARD_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_top_venues_with_top_venues_limit(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_top_venues.assert_awaited_once_with(DashboardUseCase.TOP_VENUES_LIMIT)

    @pytest.mark.asyncio
    async def test_calls_get_users_per_week_with_users_per_week_count(self):
        repo = _make_repo()
        await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        repo.get_users_per_week.assert_awaited_once_with(DashboardUseCase.USERS_PER_WEEK_COUNT)

    @pytest.mark.asyncio
    async def test_error_message_includes_cause_when_debug_is_true(self):
        repo = _make_repo(get_recent_events=AsyncMock(side_effect=RuntimeError("connection refused")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = True
            with pytest.raises(DashboardDataFetchError) as exc_info:
                await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        assert "connection refused" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_error_message_is_generic_when_debug_is_false(self):
        repo = _make_repo(get_recent_events=AsyncMock(side_effect=RuntimeError("connection refused")))
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(DashboardDataFetchError) as exc_info:
                await DashboardUseCase(repo).get_dashboard(GetDashboardInput())
        assert "connection refused" not in str(exc_info.value)
