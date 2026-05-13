"""Dashboard HTTP route — returns aggregated platform metrics for the admin UI."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.application.dto.dashboard_dto import GetDashboardInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.dashboard_usecase import DashboardUseCase
from app.controller.api.audit_helpers import safe_audit_log
from app.controller.dependencies import get_audit_log_use_case, require_permission
from app.controller.dependencies.use_cases_depends import get_dashboard_use_case
from app.controller.docs.dashboard_docs import (
    DASHBOARD_FORBIDDEN,
    DASHBOARD_SERVER_ERROR,
    DASHBOARD_UNAUTHORIZED,
)
from app.controller.schemas.dashboard_schema import (
    DashboardDataResponse,
    DashboardMetricsResponse,
    EventSummaryResponse,
    ParticipantLeaderboardResponse,
    UserRegistrationWeekResponse,
    VenueUsageResponse,
    VolunteerLeaderboardResponse,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.dashboard_exceptions import DashboardDataFetchError

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@dashboard_router.get(
    "",
    response_model=DashboardDataResponse,
    status_code=status.HTTP_200_OK,
    responses={**DASHBOARD_UNAUTHORIZED, **DASHBOARD_FORBIDDEN, **DASHBOARD_SERVER_ERROR},
    summary="Retrieve aggregated platform metrics for the admin dashboard",
    description=(
        "Returns a comprehensive snapshot of platform activity including:\n\n"
        "- **Recent Events** — 10 most recently created events\n"
        "- **Ongoing Events** — all events currently in *started* status\n"
        "- **Upcoming Events** — next 5 posted events by start date\n"
        "- **Weekly Participant Leaderboard** — top 10 users by new registrations this ISO week\n"
        "- **Weekly Volunteer Application Leaderboard** — top 10 applicants this ISO week\n"
        "- **All-Time Active Volunteers** — top 10 by total events joined\n"
        "- **All-Time Active Participants** — top 10 by total event participation\n"
        "- **Top 3 Venues** — most frequently used venues by event session count\n"
        "- **Weekly User Registrations** — registration counts for the last 12 ISO weeks\n\n"
        "**Access:** Requires the *dashboard* feature with READ permission.\n\n"
        "**Week boundaries** follow ISO week semantics (Monday–Sunday, UTC)."
    ),
)
async def get_dashboard_data(
    request: Request,
    current_user_id: uuid.UUID = Depends(require_permission("dashboard", RoleAction.READ)),
    use_case: DashboardUseCase = Depends(get_dashboard_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> DashboardDataResponse:
    """Aggregate and return all platform dashboard metrics in a single response.

    Delegates to DashboardUseCase which executes nine sequential read-only queries
    within the same database session.  On success the retrieval is recorded in the
    audit log as a READ action.  On failure the audit log captures the error context
    and a 500 response is returned — the raw exception is never surfaced to the client
    unless DEBUG mode is enabled.

    Args:
        request:         FastAPI Request object used for client IP, user-agent, and
                         audit-log context extraction.
        current_user_id: UUID of the authenticated user resolved by RBAC dependency.
        use_case:        DashboardUseCase instance injected per request.
        audit_use_case:  AuditLogUseCase for non-blocking audit trail writes.

    Returns:
        DashboardDataResponse with a nested metrics object covering all nine metric sets.

    Error mapping:
    - **401 Unauthorized** — Invalid or expired JWT token.
    - **403 Forbidden** — Authenticated user lacks Dashboard READ permission.
    - **500 Internal Server Error** — Underlying database or aggregation failure.
    """
    try:
        output = await use_case.get_dashboard(GetDashboardInput())
        metrics = output.metrics

        await safe_audit_log(
            audit_use_case,
            request,
            user_id=current_user_id,
            action_type=ActionType.READ,
            resource_type="dashboard",
            resource_id=None,
            status=AuditLogStatus.SUCCESS,
        )

        return DashboardDataResponse(
            success=True,
            message="Dashboard data retrieved successfully",
            data=DashboardMetricsResponse(
                recent_events=[EventSummaryResponse(**e.model_dump()) for e in metrics.recent_events],
                ongoing_events=[EventSummaryResponse(**e.model_dump()) for e in metrics.ongoing_events],
                upcoming_events=[EventSummaryResponse(**e.model_dump()) for e in metrics.upcoming_events],
                top_weekly_participants=[ParticipantLeaderboardResponse(**p.model_dump()) for p in metrics.top_weekly_participants],
                top_weekly_volunteer_applications=[VolunteerLeaderboardResponse(**v.model_dump()) for v in metrics.top_weekly_volunteer_applications],
                top_active_volunteers=[VolunteerLeaderboardResponse(**v.model_dump()) for v in metrics.top_active_volunteers],
                top_active_participants=[ParticipantLeaderboardResponse(**p.model_dump()) for p in metrics.top_active_participants],
                top_venues=[VenueUsageResponse(**v.model_dump()) for v in metrics.top_venues],
                users_per_week=[UserRegistrationWeekResponse(**w.model_dump()) for w in metrics.users_per_week],
            ),
        )

    except DashboardDataFetchError as e:
        await safe_audit_log(
            audit_use_case,
            request,
            user_id=current_user_id,
            action_type=ActionType.READ,
            resource_type="dashboard",
            resource_id=None,
            status=AuditLogStatus.FAILURE,
            additional_context={"error": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )

    except Exception as e:
        from app.core.config import settings

        detail = "Failed to fetch dashboard data"
        if settings.DEBUG:
            detail = f"Failed to fetch dashboard data: {e}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )
