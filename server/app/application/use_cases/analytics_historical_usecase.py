"""Historical event data analytics use case."""

from app.application.dto.analytics_dto import (
    GetHistoricalEventDataInput,
    GetHistoricalEventDataOutput,
)
from app.application.interfaces.analytics_interface import IAnalyticsRepository
from app.domain.entities.analytics_entities import HistoricalEventData, PeriodComparison
from app.domain.exceptions.analytics_exceptions import AnalyticsDataFetchError, AnalyticsError, InvalidDateRangeError


class HistoricalEventDataUseCase:
    def __init__(self, repository: IAnalyticsRepository) -> None:
        self.repository = repository

    async def get_historical_data(self, input_dto: GetHistoricalEventDataInput) -> GetHistoricalEventDataOutput:
        if input_dto.from_date and input_dto.to_date and input_dto.from_date > input_dto.to_date:
            raise InvalidDateRangeError("from_date must be before or equal to to_date")

        try:
            ended_events = await self.repository.get_ended_events(
                from_date=input_dto.from_date,
                to_date=input_dto.to_date,
                organizer_id=input_dto.organizer_id,
                venue_id=input_dto.venue_id,
            )
            cancelled_events = await self.repository.get_cancelled_events_report()
            feedback_completeness = await self.repository.get_feedback_completeness()
        except AnalyticsError:
            raise
        except Exception as e:
            from app.core.config import settings

            msg = "Failed to fetch historical event data"
            if settings.DEBUG:
                msg = f"Failed to fetch historical event data: {e}"
            raise AnalyticsDataFetchError(msg) from e

        period_comparisons = None
        if input_dto.compare_from_date and input_dto.compare_to_date:
            # Build period comparisons for current and comparison ranges
            current_events = ended_events
            compare_events = await self.repository.get_ended_events(
                from_date=input_dto.compare_from_date,
                to_date=input_dto.compare_to_date,
            )

            period_comparisons = [
                _build_period_comparison(
                    label="Current",
                    from_date=input_dto.from_date,
                    to_date=input_dto.to_date,
                    events=current_events,
                ),
                _build_period_comparison(
                    label="Comparison",
                    from_date=input_dto.compare_from_date,
                    to_date=input_dto.compare_to_date,
                    events=compare_events,
                ),
            ]

        return GetHistoricalEventDataOutput(
            data=HistoricalEventData(
                ended_events=ended_events,
                cancelled_events=cancelled_events,
                feedback_completeness=feedback_completeness,
                period_comparisons=period_comparisons,
                total_count=len(ended_events),
            )
        )


def _build_period_comparison(
    label: str,
    from_date: str | None,
    to_date: str | None,
    events: list,
) -> PeriodComparison:
    from datetime import datetime

    total_registered = sum(e.total_registered for e in events)
    total_attended = sum(e.total_attended for e in events)
    avg_attendance = None
    if total_registered > 0:
        avg_attendance = round(total_attended / total_registered * 100, 2)

    feedbacks = [e.average_feedback for e in events if e.average_feedback is not None]
    avg_feedback = round(sum(feedbacks) / len(feedbacks), 2) if feedbacks else None

    return PeriodComparison(
        period_label=label,
        from_date=from_date if isinstance(from_date, datetime) else datetime.min,
        to_date=to_date if isinstance(to_date, datetime) else datetime.max,
        total_events=len(events),
        total_registered=total_registered,
        total_attended=total_attended,
        average_attendance_rate_pct=avg_attendance,
        average_feedback=avg_feedback,
    )
