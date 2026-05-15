"""On-going event data analytics use case."""

from app.application.dto.analytics_dto import (
    GetOngoingEventDataInput,
    GetOngoingEventDataOutput,
)
from app.application.interfaces.analytics_interface import IAnalyticsRepository
from app.domain.entities.analytics_entities import OngoingEventData
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, AnalyticsError


class OngoingEventDataUseCase:
    def __init__(self, repository: IAnalyticsRepository) -> None:
        self.repository = repository

    async def get_ongoing_data(self, input_dto: GetOngoingEventDataInput) -> GetOngoingEventDataOutput:
        try:
            started_events = await self.repository.get_started_events()
            checkin_feed = await self.repository.get_live_checkin_feed(input_dto.checkin_feed_limit)
            on_duty = await self.repository.get_volunteer_on_duty()
            progress = await self.repository.get_session_progress()
            withdrawals = await self.repository.get_pending_withdrawals()
            late_regs = await self.repository.get_late_registrations()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch ongoing event data"
            if settings.DEBUG:
                msg = f"Failed to fetch ongoing event data: {e}"
            raise AnalyticsDataFetchError(msg) from e

        return GetOngoingEventDataOutput(
            data=OngoingEventData(
                started_events=started_events,
                live_checkin_feed=checkin_feed,
                volunteer_on_duty=on_duty,
                session_progress=progress,
                pending_withdrawals=withdrawals,
                late_registrations=late_regs,
            )
        )
