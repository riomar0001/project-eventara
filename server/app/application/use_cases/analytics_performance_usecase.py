"""Performance analytics use case."""

from app.application.dto.analytics_dto import (
    GetEventPerformanceInput,
    GetEventPerformanceOutput,
    GetHistoricalPerformanceInput,
    GetHistoricalPerformanceOutput,
    GetOngoingPerformanceInput,
    GetOngoingPerformanceOutput,
)
from app.application.interfaces.analytics_interface import IAnalyticsRepository
from app.domain.entities.analytics_entities import (
    EventPerformance,
    HistoricalPerformance,
    OngoingPerformance,
)
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, AnalyticsError


class PerformanceAnalyticsUseCase:
    def __init__(self, repository: IAnalyticsRepository) -> None:
        self.repository = repository

    async def get_event_performance(
        self, input_dto: GetEventPerformanceInput
    ) -> GetEventPerformanceOutput:
        try:
            attendance_rates = await self.repository.get_attendance_rates(input_dto.event_id)
            event_attendance_rates = await self.repository.get_event_attendance_rates()
            feedback_summaries = await self.repository.get_feedback_summaries()
            feedback_trend = await self.repository.get_feedback_trend(input_dto.feedback_trend_limit)
            top_rated = await self.repository.get_top_rated_events(10, input_dto.min_feedback_count)
            volunteer_perf = await self.repository.get_volunteer_performance()
            organizer_output = await self.repository.get_organizer_output()
            status_dist = await self.repository.get_session_status_distribution()
            repeat_rate = await self.repository.get_repeat_attendee_rate()
            lead_time = await self.repository.get_average_registration_to_checkin_lead_time()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch event performance data"
            if settings.DEBUG:
                msg = f"Failed to fetch event performance data: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetEventPerformanceOutput(
            performance=EventPerformance(
                attendance_rates=attendance_rates,
                event_attendance_rates=event_attendance_rates,
                feedback_summaries=feedback_summaries,
                feedback_trend=feedback_trend,
                top_rated_events=top_rated,
                volunteer_performance=volunteer_perf,
                organizer_output=organizer_output,
                session_status_distribution=status_dist,
                repeat_attendee_rate_pct=repeat_rate,
                average_registration_to_checkin_lead_time_hours=lead_time,
            )
        )

    async def get_ongoing_performance(
        self, input_dto: GetOngoingPerformanceInput
    ) -> GetOngoingPerformanceOutput:
        try:
            live_attendance = await self.repository.get_live_attendance()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch ongoing performance data"
            if settings.DEBUG:
                msg = f"Failed to fetch ongoing performance data: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetOngoingPerformanceOutput(
            performance=OngoingPerformance(
                live_attendance=live_attendance,
                real_time_slot_availability=live_attendance,
            )
        )

    async def get_historical_performance(
        self, input_dto: GetHistoricalPerformanceInput
    ) -> GetHistoricalPerformanceOutput:
        try:
            yoy = await self.repository.get_year_over_year_attendance()
            status_over_time = await self.repository.get_events_by_status_over_time()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch historical performance data"
            if settings.DEBUG:
                msg = f"Failed to fetch historical performance data: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetHistoricalPerformanceOutput(
            performance=HistoricalPerformance(
                year_over_year_attendance=yoy,
                events_by_status_over_time=status_over_time,
            )
        )
