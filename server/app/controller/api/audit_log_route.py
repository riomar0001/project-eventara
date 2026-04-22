import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import AwareDatetime

from app.application.dto.audit_log_dto import GetAuditLogsInput
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.controller.dependencies import (
    get_audit_log_use_case,
    require_permission,
)
from app.controller.docs.audit_log_docs import (
    AUDIT_LOG_FORBIDDEN,
    AUDIT_LOG_UNAUTHORIZED,
    AUDIT_LOG_VALIDATION_ERROR,
)
from app.controller.schemas.audit_log_schema import (
    AuditLogResponse,
    GetAuditLogsResponse,
    PaginationMeta,
)
from app.domain.entities.audit_log import ActionType
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.audit_exceptions import UnauthorizedAuditAccessError

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get(
    "",
    response_model=GetAuditLogsResponse,
    status_code=status.HTTP_200_OK,
    responses={**AUDIT_LOG_UNAUTHORIZED, **AUDIT_LOG_FORBIDDEN, **AUDIT_LOG_VALIDATION_ERROR},
    summary="Retrieve audit logs with cursor-based pagination",
    description=(
        "Fetch ISO 27001 compliant audit trail records with cursor-based pagination. "
        "Supports filtering by user, action type, resource, and date range. "
        "**Restricted to Admin and Auditor roles only.**\n\n"
        "**Pagination**: Uses base64-encoded cursors for stable pagination. "
        "Response includes total counts and navigation cursors."
    ),
)
async def get_audit_logs(
    limit: int = Query(default=10, ge=10, le=100, description="Number of records per page"),
    cursor: str | None = Query(default=None, description="Base64-encoded cursor for pagination"),
    user_id: uuid.UUID | None = Query(default=None, description="Filter by user ID"),
    action_type: ActionType | None = Query(default=None, description="Filter by action type"),
    resource_type: str | None = Query(default=None, description="Filter by resource type"),
    start_date: AwareDatetime | None = Query(default=None, description="Filter by start date (UTC)"),
    end_date: AwareDatetime | None = Query(default=None, description="Filter by end date (UTC)"),
    _: uuid.UUID = Depends(require_permission("audit-logs", RoleAction.READ)),
    use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> GetAuditLogsResponse:
    """Retrieve paginated audit logs with comprehensive pagination metadata.

    Security: Enforces RBAC via JWT token validation. Only users with 'admin' or
    'auditor' role_id can access this endpoint. Returns 403 for other roles.

    Args:
        limit: Number of records per page (10–100, default 10).
        cursor: Base64-encoded cursor for pagination. Omit for the first page;
            use `next_cursor` / `prev_cursor` from a previous response to navigate.
        user_id: Filter logs to a specific user UUID.
        action_type: Filter by action type (e.g. login, create, update, delete).
        resource_type: Filter by resource type (e.g. user, event, role).
        start_date: Inclusive lower bound on log timestamp (UTC, ISO 8601).
        end_date: Inclusive upper bound on log timestamp (UTC, ISO 8601).

    Pagination: Uses base64-encoded cursor-based pagination for consistent results
    under concurrent writes. The response includes:
    - total_pages: Total number of pages based on filtered results and limit
    - next_cursor: Base64-encoded cursor for next page (null if last page)
    - prev_cursor: Base64-encoded cursor for previous page (null if first page)
    - has_next: Boolean indicating if more pages exist

    Example:
        GET /audit-logs?limit=50
        GET /audit-logs?cursor=eyJpZ...=&limit=50

    Filters can be combined:
        GET /audit-logs?user_id=<uuid>&action_type=login&limit=25

    Error mapping:
    - **401 Unauthorized** - Invalid or expired token
    - **403 Forbidden** - User lacks Admin or Auditor role
    - **422 Unprocessable Entity** - Invalid query parameters
    """
    try:
        input_dto = GetAuditLogsInput(
            limit=limit,
            cursor=cursor,
            user_id=user_id,
            action_type=action_type,
            resource_type=resource_type,
            start_date=start_date,
            end_date=end_date,
        )

        output = await use_case.get_logs(input_dto)

        total_pages = math.ceil(output.total_count / limit) if output.total_count > 0 else 0

        pagination = PaginationMeta(
            limit=limit,
            total_pages=total_pages,
            next_cursor=output.next_cursor,
            prev_cursor=output.prev_cursor,
            has_next=output.has_next,
        )

        return GetAuditLogsResponse(
            success=True,
            data=[AuditLogResponse(**log.model_dump()) for log in output.logs],
            pagination=pagination,
        )
    except UnauthorizedAuditAccessError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except Exception as e:
        from app.core.config import settings

        detail = "Failed to retrieve audit logs"
        if settings.DEBUG:
            detail = f"Failed to retrieve audit logs: {e}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )
