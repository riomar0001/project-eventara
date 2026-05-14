"""Demographic analytics use case."""

from app.application.dto.analytics_dto import (
    GetDemographicAnalyticsInput,
    GetDemographicAnalyticsOutput,
)
from app.application.interfaces.analytics_interface import IAnalyticsRepository
from app.domain.entities.analytics_entities import DemographicAnalytics
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, AnalyticsError


class DemographicAnalyticsUseCase:
    def __init__(self, repository: IAnalyticsRepository) -> None:
        self.repository = repository

    async def get_demographics(
        self, input_dto: GetDemographicAnalyticsInput
    ) -> GetDemographicAnalyticsOutput:
        try:
            device_breakdown = await self.repository.get_device_breakdown()
            os_breakdown = await self.repository.get_os_breakdown()
            browser_breakdown = await self.repository.get_browser_breakdown()
            top_cities = await self.repository.get_top_participating_cities(input_dto.top_cities_limit)
            account_age = await self.repository.get_account_age_distribution()
            volunteer_roles = await self.repository.get_volunteer_role_breakdown()
            event_interest = await self.repository.get_event_interest_categories()
            first_time_vs_returning = await self.repository.get_first_time_vs_returning()
            gender_dist = await self.repository.get_gender_distribution()
            geo_spread = await self.repository.get_geographic_spread()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch demographic analytics"
            if settings.DEBUG:
                msg = f"Failed to fetch demographic analytics: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetDemographicAnalyticsOutput(
            demographics=DemographicAnalytics(
                device_breakdown=device_breakdown,
                os_breakdown=os_breakdown,
                browser_breakdown=browser_breakdown,
                top_cities=top_cities,
                account_age_distribution=account_age,
                volunteer_role_breakdown=volunteer_roles,
                event_interest_categories=event_interest,
                first_time_vs_returning=first_time_vs_returning,
                gender_distribution=gender_dist,
                geographic_spread=geo_spread,
            )
        )
