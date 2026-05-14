"""Unit tests for DemographicAnalyticsUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.analytics_dto import GetDemographicAnalyticsInput
from app.application.use_cases.analytics_demographic_usecase import DemographicAnalyticsUseCase
from app.domain.entities.analytics_entities import (
    AccountAgeDistribution,
    BrowserBreakdown,
    CityParticipation,
    DemographicAnalytics,
    DeviceBreakdown,
    EventInterestCategory,
    FirstTimeVsReturning,
    GenderDistribution,
    GeographicSpread,
    OsBreakdown,
    VolunteerRoleBreakdown,
)
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError

EVENT_ID = uuid.uuid4()


def _make_repo(**overrides):
    repo = MagicMock()
    repo.get_device_breakdown = AsyncMock(return_value=[
        DeviceBreakdown(device_type="mobile", count=60, percentage=60.0),
        DeviceBreakdown(device_type="desktop", count=40, percentage=40.0),
    ])
    repo.get_os_breakdown = AsyncMock(return_value=[
        OsBreakdown(os="Android", count=50, percentage=50.0),
        OsBreakdown(os="iOS", count=30, percentage=30.0),
        OsBreakdown(os="Windows", count=20, percentage=20.0),
    ])
    repo.get_browser_breakdown = AsyncMock(return_value=[
        BrowserBreakdown(browser="Chrome", count=70, percentage=70.0),
        BrowserBreakdown(browser="Firefox", count=30, percentage=30.0),
    ])
    repo.get_top_participating_cities = AsyncMock(return_value=[
        CityParticipation(city="Davao", country="PH", participant_count=100),
        CityParticipation(city="Manila", country="PH", participant_count=50),
    ])
    repo.get_account_age_distribution = AsyncMock(return_value=[
        AccountAgeDistribution(bucket="<30 days", count=10, percentage=10.0),
        AccountAgeDistribution(bucket="1-6 months", count=30, percentage=30.0),
        AccountAgeDistribution(bucket="6-12 months", count=25, percentage=25.0),
        AccountAgeDistribution(bucket="1-2 years", count=20, percentage=20.0),
        AccountAgeDistribution(bucket="2+ years", count=15, percentage=15.0),
    ])
    repo.get_volunteer_role_breakdown = AsyncMock(return_value=[
        VolunteerRoleBreakdown(role_name="Usher", count=15),
        VolunteerRoleBreakdown(role_name="Registration", count=10),
    ])
    repo.get_event_interest_categories = AsyncMock(return_value=[
        EventInterestCategory(category="DeFi Summit", event_count=1, registration_count=200),
    ])
    repo.get_first_time_vs_returning = AsyncMock(return_value=[
        FirstTimeVsReturning(event_id=EVENT_ID, event_title="Test Event", first_time_count=30, returning_count=70),
    ])
    repo.get_gender_distribution = AsyncMock(return_value=[
        GenderDistribution(gender="male", count=55, percentage=55.0),
        GenderDistribution(gender="female", count=45, percentage=45.0),
    ])
    repo.get_geographic_spread = AsyncMock(return_value=[
        GeographicSpread(city="Davao", latitude=None, longitude=None, participant_count=100),
    ])
    for key, value in overrides.items():
        setattr(repo, key, value)
    return repo


def _make_uc(repo=None):
    return DemographicAnalyticsUseCase(repo or _make_repo())


class TestGetDemographics:
    @pytest.mark.asyncio
    async def test_returns_full_demographic_data(self):
        result = await _make_uc().get_demographics(GetDemographicAnalyticsInput())
        dem = result.demographics
        assert isinstance(dem, DemographicAnalytics)
        assert len(dem.device_breakdown) == 2
        assert len(dem.os_breakdown) == 3
        assert len(dem.browser_breakdown) == 2
        assert len(dem.top_cities) == 2
        assert len(dem.account_age_distribution) == 5
        assert len(dem.volunteer_role_breakdown) == 2
        assert len(dem.event_interest_categories) == 1
        assert len(dem.first_time_vs_returning) == 1
        assert len(dem.gender_distribution) == 2
        assert len(dem.geographic_spread) == 1

    @pytest.mark.asyncio
    async def test_empty_data_returns_empty_lists(self):
        repo = _make_repo(
            get_device_breakdown=AsyncMock(return_value=[]),
            get_os_breakdown=AsyncMock(return_value=[]),
            get_browser_breakdown=AsyncMock(return_value=[]),
            get_top_participating_cities=AsyncMock(return_value=[]),
            get_account_age_distribution=AsyncMock(return_value=[]),
            get_volunteer_role_breakdown=AsyncMock(return_value=[]),
            get_event_interest_categories=AsyncMock(return_value=[]),
            get_first_time_vs_returning=AsyncMock(return_value=[]),
            get_gender_distribution=AsyncMock(return_value=[]),
            get_geographic_spread=AsyncMock(return_value=[]),
        )
        result = await _make_uc(repo).get_demographics(GetDemographicAnalyticsInput())
        dem = result.demographics
        assert dem.device_breakdown == []
        assert dem.geographic_spread == []

    @pytest.mark.asyncio
    async def test_passes_top_cities_limit(self):
        repo = _make_repo()
        await _make_uc(repo).get_demographics(
            GetDemographicAnalyticsInput(top_cities_limit=5)
        )
        repo.get_top_participating_cities.assert_awaited_once_with(5)

    @pytest.mark.asyncio
    async def test_default_top_cities_limit(self):
        repo = _make_repo()
        await _make_uc(repo).get_demographics(GetDemographicAnalyticsInput())
        repo.get_top_participating_cities.assert_awaited_once_with(10)

    @pytest.mark.asyncio
    async def test_device_percentages_sum_to_100(self):
        result = await _make_uc().get_demographics(GetDemographicAnalyticsInput())
        total_pct = sum(d.percentage or 0 for d in result.demographics.device_breakdown)
        assert total_pct == 100.0

    @pytest.mark.asyncio
    async def test_gender_distribution_has_percentages(self):
        result = await _make_uc().get_demographics(GetDemographicAnalyticsInput())
        for g in result.demographics.gender_distribution:
            assert g.percentage is not None

    @pytest.mark.asyncio
    async def test_first_time_vs_returning_has_both_counts(self):
        result = await _make_uc().get_demographics(GetDemographicAnalyticsInput())
        ftvr = result.demographics.first_time_vs_returning[0]
        assert ftvr.first_time_count == 30
        assert ftvr.returning_count == 70

    @pytest.mark.asyncio
    async def test_raises_analytics_data_fetch_error_on_failure(self):
        repo = _make_repo(
            get_device_breakdown=AsyncMock(side_effect=RuntimeError("db down"))
        )
        with patch("app.core.config.settings") as s:
            s.DEBUG = False
            with pytest.raises(AnalyticsDataFetchError):
                await _make_uc(repo).get_demographics(GetDemographicAnalyticsInput())

    @pytest.mark.asyncio
    async def test_all_repo_methods_called(self):
        repo = _make_repo()
        await _make_uc(repo).get_demographics(GetDemographicAnalyticsInput())
        repo.get_device_breakdown.assert_awaited_once()
        repo.get_os_breakdown.assert_awaited_once()
        repo.get_browser_breakdown.assert_awaited_once()
        repo.get_top_participating_cities.assert_awaited_once()
        repo.get_account_age_distribution.assert_awaited_once()
        repo.get_volunteer_role_breakdown.assert_awaited_once()
        repo.get_event_interest_categories.assert_awaited_once()
        repo.get_first_time_vs_returning.assert_awaited_once()
        repo.get_gender_distribution.assert_awaited_once()
        repo.get_geographic_spread.assert_awaited_once()
