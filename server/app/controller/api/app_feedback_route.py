"""HTTP routes for anonymous app feedback submission and admin analytics."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.app_feedback_dto import (
    GetAppFeedbackInput,
    GetUsersPerWeekInput,
    SubmitAppFeedbackInput,
)
from app.application.use_cases.app_feedback_usecase import AppFeedbackUseCase
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.controller.api.audit_helpers import get_client_ip, safe_audit_log
from app.controller.dependencies import get_audit_log_use_case, require_permission
from app.controller.dependencies.rate_limit_depends import app_feedback_rate_limit
from app.controller.dependencies.use_cases_depends import get_app_feedback_use_case
from app.controller.docs.app_feedback_docs import (
    APP_FEEDBACK_FORBIDDEN,
    APP_FEEDBACK_RATE_LIMITED,
    APP_FEEDBACK_SERVER_ERROR,
    APP_FEEDBACK_UNAUTHORIZED,
    APP_FEEDBACK_VALIDATION_ERROR,
)
from app.controller.schemas.app_feedback_schema import (
    AppFeedbackListData,
    AppFeedbackListResponse,
    AppFeedbackRecordResponse,
    SubmitAppFeedbackRequest,
    SubmitAppFeedbackResponse,
    UsersPerWeekData,
    UsersPerWeekResponse,
    WeeklyRegistrationEntry,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction

app_feedback_router = APIRouter(prefix="/app-feedback", tags=["App Feedback"])


@app_feedback_router.post(
    "",
    response_model=SubmitAppFeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **APP_FEEDBACK_RATE_LIMITED,
        **APP_FEEDBACK_VALIDATION_ERROR,
        **APP_FEEDBACK_SERVER_ERROR,
    },
    summary="Submit anonymous app feedback",
    description=(
        "Submit anonymous feedback about the Eventara application.\n\n"
        "- **Rating:** Integer from 1 (worst) to 5 (best) — required\n"
        "- **Comment:** Optional free-text message up to 2 000 characters\n\n"
        "**Rate limit:** 10 submissions per IP address per hour.  "
        "Exceeding the limit returns **429 Too Many Requests** with a "
        "`Retry-After` header indicating the remaining window in seconds.\n\n"
        "No authentication is required — this endpoint is fully public and anonymous."
    ),
    dependencies=[Depends(app_feedback_rate_limit)],
)
async def submit_app_feedback(
    request: Request,
    body: SubmitAppFeedbackRequest,
    use_case: AppFeedbackUseCase = Depends(get_app_feedback_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> SubmitAppFeedbackResponse:
    """Accept and persist an anonymous feedback record.

    The IP address is extracted from the request headers for rate-limit tracking
    and stored with the record for admin moderation visibility.  No user identity
    check is performed — the endpoint is intentionally unauthenticated.

    Args:
        request:        FastAPI Request used for IP extraction and audit context.
        body:           Validated ``SubmitAppFeedbackRequest`` payload.
        use_case:       ``AppFeedbackUseCase`` instance injected per request.
        audit_use_case: AuditLogUseCase for non-blocking audit trail writes.

    Returns:
        ``SubmitAppFeedbackResponse`` (201 Created) with the persisted record.

    Error mapping:
    - **422 Unprocessable Entity** — Rating outside 1–5 or comment exceeds 2 000 chars.
    - **429 Too Many Requests** — IP-based rate limit exceeded (10 per hour).
    - **500 Internal Server Error** — Unexpected database failure.
    """
    ip = get_client_ip(request)

    try:
        output = await use_case.submit_feedback(
            SubmitAppFeedbackInput(
                rating=body.rating,
                comment=body.comment,
                ip_address=ip,
            )
        )

        await safe_audit_log(
            audit_use_case,
            request,
            user_id=None,
            action_type=ActionType.CREATE,
            resource_type="app_feedback",
            resource_id=str(output.feedback.id),
            status=AuditLogStatus.SUCCESS,
            new_values={"rating": output.feedback.rating, "comment": output.feedback.comment},
            additional_context={"anonymous": True},
        )

        return SubmitAppFeedbackResponse(
            data=AppFeedbackRecordResponse(
                id=output.feedback.id,
                rating=output.feedback.rating,
                comment=output.feedback.comment,
                created_at=output.feedback.created_at,
            )
        )

    except Exception as e:
        from app.core.config import settings

        await safe_audit_log(
            audit_use_case,
            request,
            user_id=None,
            action_type=ActionType.CREATE,
            resource_type="app_feedback",
            resource_id=None,
            status=AuditLogStatus.FAILURE,
            additional_context={"anonymous": True, "error": str(e) if settings.DEBUG else "submission_failed"},
        )
        detail = "Failed to submit feedback"
        if settings.DEBUG:
            detail = f"Failed to submit feedback: {e}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


@app_feedback_router.get(
    "",
    response_model=AppFeedbackListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **APP_FEEDBACK_UNAUTHORIZED,
        **APP_FEEDBACK_FORBIDDEN,
        **APP_FEEDBACK_SERVER_ERROR,
    },
    summary="List all app feedback (paginated)",
    description=(
        "Returns all submitted anonymous feedback records, sorted newest first.\n\n"
        "Supports offset-based pagination via `page` and `page_size` query parameters.  "
        "Maximum page size is 100.\n\n"
        "**Access:** Requires the *app_feedback* feature with READ permission."
    ),
)
async def list_app_feedback(
    request: Request,
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Records per page (max 100)"),
    current_user_id: uuid.UUID = Depends(require_permission("app_feedback", RoleAction.READ)),
    use_case: AppFeedbackUseCase = Depends(get_app_feedback_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> AppFeedbackListResponse:
    """Return a paginated list of all anonymous app feedback records.

    Args:
        request:         FastAPI Request for audit context.
        page:            1-indexed page number.
        page_size:       Number of records per page; capped at 100 by the use case.
        current_user_id: UUID of the authenticated admin resolved by RBAC dependency.
        use_case:        ``AppFeedbackUseCase`` instance injected per request.
        audit_use_case:  AuditLogUseCase for non-blocking audit trail writes.

    Returns:
        ``AppFeedbackListResponse`` with the record page and full pagination metadata.

    Error mapping:
    - **401 Unauthorized** — Invalid or expired JWT token.
    - **403 Forbidden** — Authenticated user lacks App Feedback READ permission.
    - **500 Internal Server Error** — Unexpected database failure.
    """
    try:
        output = await use_case.get_all_feedback(GetAppFeedbackInput(page=page, page_size=page_size))

        await safe_audit_log(
            audit_use_case,
            request,
            user_id=current_user_id,
            action_type=ActionType.READ,
            resource_type="app_feedback",
            resource_id=None,
            status=AuditLogStatus.SUCCESS,
            additional_context={"page": page, "page_size": page_size},
        )

        return AppFeedbackListResponse(
            data=AppFeedbackListData.build(
                feedback=[
                    AppFeedbackRecordResponse(
                        id=f.id,
                        rating=f.rating,
                        comment=f.comment,
                        created_at=f.created_at,
                    )
                    for f in output.feedback
                ],
                total=output.total,
                page=output.page,
                page_size=output.page_size,
            )
        )

    except Exception as e:
        from app.core.config import settings

        detail = "Failed to retrieve feedback"
        if settings.DEBUG:
            detail = f"Failed to retrieve feedback: {e}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


@app_feedback_router.get(
    "/users-per-week",
    response_model=UsersPerWeekResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **APP_FEEDBACK_UNAUTHORIZED,
        **APP_FEEDBACK_FORBIDDEN,
        **APP_FEEDBACK_SERVER_ERROR,
    },
    summary="Weekly user registration counts",
    description=(
        "Returns the number of new user registrations grouped by ISO week "
        "for the last N weeks (default 12, max 52).\n\n"
        "Week boundaries follow PostgreSQL `date_trunc('week', ...)` semantics — "
        "each week starts on Monday at 00:00 UTC.\n\n"
        "**Access:** Requires the *app_feedback* feature with READ permission."
    ),
)
async def get_users_per_week(
    request: Request,
    weeks: int = Query(default=12, ge=1, le=52, description="Number of past ISO weeks to return"),
    current_user_id: uuid.UUID = Depends(require_permission("app_feedback", RoleAction.READ)),
    use_case: AppFeedbackUseCase = Depends(get_app_feedback_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> UsersPerWeekResponse:
    """Return weekly user registration counts for the last N ISO weeks.

    Args:
        request:         FastAPI Request for audit context.
        weeks:           Number of past ISO weeks to include (1–52, default 12).
        current_user_id: UUID of the authenticated admin.
        use_case:        ``AppFeedbackUseCase`` instance injected per request.
        audit_use_case:  AuditLogUseCase for non-blocking audit trail writes.

    Returns:
        ``UsersPerWeekResponse`` with one entry per ISO week, oldest-first.

    Error mapping:
    - **401 Unauthorized** — Invalid or expired JWT token.
    - **403 Forbidden** — Authenticated user lacks App Feedback READ permission.
    - **500 Internal Server Error** — Unexpected database failure.
    """
    try:
        output = await use_case.get_users_per_week(GetUsersPerWeekInput(weeks=weeks))

        await safe_audit_log(
            audit_use_case,
            request,
            user_id=current_user_id,
            action_type=ActionType.READ,
            resource_type="app_feedback",
            resource_id=None,
            status=AuditLogStatus.SUCCESS,
            additional_context={"weeks": weeks},
        )

        return UsersPerWeekResponse(
            data=UsersPerWeekData(
                entries=[
                    WeeklyRegistrationEntry(
                        week_start=e.week_start,
                        week_end=e.week_end,
                        count=e.count,
                    )
                    for e in output.entries
                ],
                weeks=weeks,
            )
        )

    except Exception as e:
        from app.core.config import settings

        detail = "Failed to retrieve weekly user registrations"
        if settings.DEBUG:
            detail = f"Failed to retrieve weekly user registrations: {e}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )
