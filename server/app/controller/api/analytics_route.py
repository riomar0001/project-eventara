"""Analytics HTTP routes for all five analytics domains."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.analytics_dto import (
    GetDemographicAnalyticsInput,
    GetEventLogisticsInput,
    GetEventPerformanceInput,
    GetHistoricalEventDataInput,
    GetHistoricalPerformanceInput,
    GetOngoingEventDataInput,
    GetOngoingPerformanceInput,
    GetRegistrationLogisticsInput,
    GetSessionTimelineInput,
    GetVolunteerLogisticsInput,
)
from app.application.use_cases.analytics_demographic_usecase import DemographicAnalyticsUseCase
from app.application.use_cases.analytics_historical_usecase import HistoricalEventDataUseCase
from app.application.use_cases.analytics_logistics_usecase import LogisticsAnalyticsUseCase
from app.application.use_cases.analytics_ongoing_usecase import OngoingEventDataUseCase
from app.application.use_cases.analytics_performance_usecase import PerformanceAnalyticsUseCase
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.controller.api.audit_helpers import safe_audit_log
from app.controller.dependencies import require_permission
from app.controller.dependencies.use_cases_depends import (
    get_audit_log_use_case,
    get_demographic_analytics_use_case,
    get_historical_event_data_use_case,
    get_logistics_analytics_use_case,
    get_ongoing_event_data_use_case,
    get_performance_analytics_use_case,
)
from app.controller.schemas.analytics_schema import (
    DemographicAnalyticsData,
    DemographicAnalyticsResponse,
    EventLogisticsOverviewData,
    EventLogisticsOverviewResponse,
    EventPerformanceData,
    EventPerformanceResponse,
    HistoricalEventDataData,
    HistoricalEventDataResponse,
    HistoricalPerformanceData,
    HistoricalPerformanceResponse,
    OngoingEventDataData,
    OngoingEventDataResponse,
    OngoingPerformanceData,
    OngoingPerformanceResponse,
    RegistrationLogisticsData,
    RegistrationLogisticsEntryResponse,
    RegistrationLogisticsResponse,
    SessionTimelineData,
    SessionTimelineResponse,
    VolunteerLogisticsData,
    VolunteerLogisticsResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.analytics_exceptions import (
    AnalyticsDataFetchError,
    EventNotFoundError,
    InvalidDateRangeError,
)

analytics_router = APIRouter(prefix="/analytics", tags=["Analytics"])


# ── Logistics routes ────────────────────────────────────────────────────

@analytics_router.get(
    "/logistics/overview/{event_id}",
    response_model=EventLogisticsOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Event logistics overview",
    description=(
        "Returns total sessions, scheduled dates, venue assignments, "
        "session utilisation, over-capacity alerts, and venue capacity "
        "vs. registrations for a specific event."
    ),
)
async def get_event_logistics_overview(
    event_id: uuid.UUID,
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: LogisticsAnalyticsUseCase = Depends(get_logistics_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventLogisticsOverviewResponse:
    try:
        output = await use_case.get_event_logistics_overview(
            GetEventLogisticsInput(event_id=event_id)
        )
        overview = output.overview

        await safe_audit_log(
            audit_use_case, request, user_id=current_user_id,
            action_type=ActionType.READ, resource_type="analytics_logistics",
            resource_id=event_id, status=AuditLogStatus.SUCCESS,
        )

        return EventLogisticsOverviewResponse(
            data=EventLogisticsOverviewData(**overview.model_dump()),
        )
    except EventNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch event logistics overview"
        if settings.DEBUG:
            detail = f"Failed to fetch event logistics overview: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@analytics_router.get(
    "/logistics/timeline",
    response_model=SessionTimelineResponse,
    status_code=status.HTTP_200_OK,
    summary="Session timeline view",
    description=(
        "Returns sessions grouped into ongoing, upcoming (sorted ascending), "
        "and completed (sorted descending)."
    ),
)
async def get_session_timeline(
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: LogisticsAnalyticsUseCase = Depends(get_logistics_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> SessionTimelineResponse:
    try:
        output = await use_case.get_session_timeline(GetSessionTimelineInput())
        return SessionTimelineResponse(
            data=SessionTimelineData(**output.timeline.model_dump()),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch session timeline"
        if settings.DEBUG:
            detail = f"Failed to fetch session timeline: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@analytics_router.get(
    "/logistics/volunteers/{event_id}",
    response_model=VolunteerLogisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Volunteer logistics per event",
    description=(
        "Returns count and roster of JOINED volunteers, volunteer-to-participant "
        "ratio, and pending volunteer count for an event."
    ),
)
async def get_volunteer_logistics(
    event_id: uuid.UUID,
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: LogisticsAnalyticsUseCase = Depends(get_logistics_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VolunteerLogisticsResponse:
    try:
        output = await use_case.get_volunteer_logistics(
            GetVolunteerLogisticsInput(event_id=event_id)
        )
        return VolunteerLogisticsResponse(
            data=VolunteerLogisticsData(**output.logistics.model_dump()),
        )
    except EventNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch volunteer logistics"
        if settings.DEBUG:
            detail = f"Failed to fetch volunteer logistics: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@analytics_router.get(
    "/logistics/registrations/{event_id}",
    response_model=RegistrationLogisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Registration logistics per event",
    description=(
        "Returns cancellation rate, no-show rate, and QR vs. manual "
        "check-in breakdown per session."
    ),
)
async def get_registration_logistics(
    event_id: uuid.UUID,
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: LogisticsAnalyticsUseCase = Depends(get_logistics_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> RegistrationLogisticsResponse:
    try:
        output = await use_case.get_registration_logistics(
            GetRegistrationLogisticsInput(event_id=event_id)
        )
        return RegistrationLogisticsResponse(
            data=RegistrationLogisticsData(
                sessions=[
                    RegistrationLogisticsEntryResponse(**r.model_dump())
                    for r in output.registrations
                ]
            ),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch registration logistics"
        if settings.DEBUG:
            detail = f"Failed to fetch registration logistics: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


# ── Performance routes ──────────────────────────────────────────────────

@analytics_router.get(
    "/performance/event",
    response_model=EventPerformanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Event performance analytics",
    description=(
        "Returns attendance rates, feedback summaries and trends, top-rated "
        "events, volunteer performance, organizer output, session status "
        "distribution, repeat attendee rate, and average lead time."
    ),
)
async def get_event_performance(
    request: Request,
    event_id: uuid.UUID | None = Query(None, description="Filter attendance rates to a specific event"),
    min_feedback_count: int = Query(3, description="Minimum feedback count for top-rated events"),
    feedback_trend_limit: int = Query(12, description="Number of past events for feedback trend"),
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: PerformanceAnalyticsUseCase = Depends(get_performance_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> EventPerformanceResponse:
    try:
        output = await use_case.get_event_performance(
            GetEventPerformanceInput(
                event_id=event_id,
                min_feedback_count=min_feedback_count,
                feedback_trend_limit=feedback_trend_limit,
            )
        )
        return EventPerformanceResponse(
            data=EventPerformanceData(**output.performance.model_dump()),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch event performance data"
        if settings.DEBUG:
            detail = f"Failed to fetch event performance data: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@analytics_router.get(
    "/performance/ongoing",
    response_model=OngoingPerformanceResponse,
    status_code=status.HTTP_200_OK,
    summary="On-going event performance",
    description=(
        "Returns live attendance tracking and real-time slot availability "
        "for all STARTED sessions."
    ),
)
async def get_ongoing_performance(
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: PerformanceAnalyticsUseCase = Depends(get_performance_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> OngoingPerformanceResponse:
    try:
        output = await use_case.get_ongoing_performance(GetOngoingPerformanceInput())
        return OngoingPerformanceResponse(
            data=OngoingPerformanceData(**output.performance.model_dump()),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch ongoing performance data"
        if settings.DEBUG:
            detail = f"Failed to fetch ongoing performance data: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@analytics_router.get(
    "/performance/historical",
    response_model=HistoricalPerformanceResponse,
    status_code=status.HTTP_200_OK,
    summary="Historical event performance",
    description=(
        "Returns year-over-year attendance growth and events by terminal "
        "status over time."
    ),
)
async def get_historical_performance(
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: PerformanceAnalyticsUseCase = Depends(get_performance_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> HistoricalPerformanceResponse:
    try:
        output = await use_case.get_historical_performance(GetHistoricalPerformanceInput())
        return HistoricalPerformanceResponse(
            data=HistoricalPerformanceData(**output.performance.model_dump()),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch historical performance data"
        if settings.DEBUG:
            detail = f"Failed to fetch historical performance data: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


# ── Demographic routes ──────────────────────────────────────────────────

@analytics_router.get(
    "/demographics",
    response_model=DemographicAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Demographic analytics",
    description=(
        "Returns device, OS, browser breakdowns, top participating cities, "
        "account age distribution, volunteer role breakdown, event interest, "
        "first-time vs returning attendees, gender distribution, and geographic spread."
    ),
)
async def get_demographic_analytics(
    request: Request,
    top_cities_limit: int = Query(10, description="Number of top cities to return"),
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: DemographicAnalyticsUseCase = Depends(get_demographic_analytics_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> DemographicAnalyticsResponse:
    try:
        output = await use_case.get_demographics(
            GetDemographicAnalyticsInput(top_cities_limit=top_cities_limit)
        )
        return DemographicAnalyticsResponse(
            data=DemographicAnalyticsData(**output.demographics.model_dump()),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch demographic analytics"
        if settings.DEBUG:
            detail = f"Failed to fetch demographic analytics: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


# ── On-going routes ─────────────────────────────────────────────────────

@analytics_router.get(
    "/ongoing",
    response_model=OngoingEventDataResponse,
    status_code=status.HTTP_200_OK,
    summary="On-going event data",
    description=(
        "Returns all STARTED events with stats, live check-in feed, "
        "volunteer on-duty roster, session progress, pending withdrawal "
        "alerts, and late registrations."
    ),
)
async def get_ongoing_event_data(
    request: Request,
    checkin_feed_limit: int = Query(50, description="Number of recent check-ins to return"),
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: OngoingEventDataUseCase = Depends(get_ongoing_event_data_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> OngoingEventDataResponse:
    try:
        output = await use_case.get_ongoing_data(
            GetOngoingEventDataInput(checkin_feed_limit=checkin_feed_limit)
        )
        return OngoingEventDataResponse(
            data=OngoingEventDataData(**output.data.model_dump()),
        )
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch ongoing event data"
        if settings.DEBUG:
            detail = f"Failed to fetch ongoing event data: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


# ── Historical routes ───────────────────────────────────────────────────

@analytics_router.get(
    "/historical",
    response_model=HistoricalEventDataResponse,
    status_code=status.HTTP_200_OK,
    summary="Historical event data",
    description=(
        "Returns all ENDED events with summary stats (registered, attended, "
        "no-show, cancelled, average feedback), cancelled events report, "
        "feedback completeness, and optional multi-period comparison. "
        "Supports filtering by date range, organizer, and venue."
    ),
)
async def get_historical_event_data(
    request: Request,
    from_date: datetime | None = Query(None, description="Filter events starting on or after this date"),
    to_date: datetime | None = Query(None, description="Filter events ending on or before this date"),
    organizer_id: uuid.UUID | None = Query(None, description="Filter events by creator"),
    venue_id: uuid.UUID | None = Query(None, description="Filter events with sessions at this venue"),
    compare_from_date: datetime | None = Query(None, description="Comparison period start date"),
    compare_to_date: datetime | None = Query(None, description="Comparison period end date"),
    current_user_id: uuid.UUID = Depends(require_permission("analytics", RoleAction.READ)),
    use_case: HistoricalEventDataUseCase = Depends(get_historical_event_data_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> HistoricalEventDataResponse:
    try:
        output = await use_case.get_historical_data(
            GetHistoricalEventDataInput(
                from_date=from_date,
                to_date=to_date,
                organizer_id=organizer_id,
                venue_id=venue_id,
                compare_from_date=compare_from_date,
                compare_to_date=compare_to_date,
            )
        )
        return HistoricalEventDataResponse(
            data=HistoricalEventDataData(**output.data.model_dump()),
        )
    except InvalidDateRangeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except AnalyticsDataFetchError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch historical event data"
        if settings.DEBUG:
            detail = f"Failed to fetch historical event data: {e}"
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
