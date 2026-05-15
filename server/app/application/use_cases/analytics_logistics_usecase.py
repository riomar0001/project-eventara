"""Logistics analytics use case."""

from app.application.dto.analytics_dto import (
    GetEventLogisticsInput,
    GetEventLogisticsOutput,
    GetRegistrationLogisticsInput,
    GetRegistrationLogisticsOutput,
    GetSessionTimelineInput,
    GetSessionTimelineOutput,
    GetVolunteerLogisticsInput,
    GetVolunteerLogisticsOutput,
)
from app.application.interfaces.analytics_interface import IAnalyticsRepository
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, AnalyticsError


class LogisticsAnalyticsUseCase:
    def __init__(self, repository: IAnalyticsRepository) -> None:
        self.repository = repository

    async def get_event_logistics_overview(self, input_dto: GetEventLogisticsInput) -> GetEventLogisticsOutput:
        try:
            overview = await self.repository.get_event_logistics_overview(input_dto.event_id)
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch event logistics overview"
            if settings.DEBUG:
                msg = f"Failed to fetch event logistics overview: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetEventLogisticsOutput(overview=overview)

    async def get_session_timeline(self, input_dto: GetSessionTimelineInput) -> GetSessionTimelineOutput:
        try:
            timeline = await self.repository.get_session_timeline()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch session timeline"
            if settings.DEBUG:
                msg = f"Failed to fetch session timeline: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetSessionTimelineOutput(timeline=timeline)

    async def get_volunteer_logistics(self, input_dto: GetVolunteerLogisticsInput) -> GetVolunteerLogisticsOutput:
        try:
            logistics = await self.repository.get_volunteer_logistics(input_dto.event_id)
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch volunteer logistics"
            if settings.DEBUG:
                msg = f"Failed to fetch volunteer logistics: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetVolunteerLogisticsOutput(logistics=logistics)

    async def get_registration_logistics(self, input_dto: GetRegistrationLogisticsInput) -> GetRegistrationLogisticsOutput:
        try:
            registrations = await self.repository.get_registration_logistics(input_dto.event_id)
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch registration logistics"
            if settings.DEBUG:
                msg = f"Failed to fetch registration logistics: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetRegistrationLogisticsOutput(registrations=registrations)
