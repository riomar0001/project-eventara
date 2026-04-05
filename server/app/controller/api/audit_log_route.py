import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.audit_log_dto import GetAuditLogsInput
from app.application.use_cases.audit_log_usecase import GetAuditLogsUseCase
from app.controller.dependencies import (
    get_audit_logs_use_case,
    require_admin_or_auditor_role,
)
from app.controller.docs.audit_log_docs import (
    AUDIT_LOG_FORBIDDEN,
    AUDIT_LOG_UNAUTHORIZED,
    AUDIT_LOG_VALIDATION_ERROR,
)
from app.controller.schemas.audit_log_schema import (
    AuditLogResponse,
    GetAuditLogsRequest,
    GetAuditLogsResponse,
)
from app.domain.exceptions.audit_exceptions import UnauthorizedAuditAccessError

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get(
    "",
    response_model=GetAuditLogsResponse,
    status_code=status.HTTP_200_OK,
    responses={**AUDIT_LOG_UNAUTHORIZED, **AUDIT_LOG_FORBIDDEN, **AUDIT_LOG_VALIDATION_ERROR},
    summary="Retrieve audit logs with pagination",
    description=(
        "Fetch ISO 27001 compliant audit trail records with cursor-based pagination. "
        "Supports filtering by user, action type, resource, and date range. "
        "**Restricted to Admin and Auditor roles only.**"
    ),
)
async def get_audit_logs(
    request: GetAuditLogsRequest = Depends(),
    _: uuid.UUID = Depends(require_admin_or_auditor_role),
    use_case: GetAuditLogsUseCase = Depends(get_audit_logs_use_case),
) -> GetAuditLogsResponse:
    """Retrieve paginated audit logs.
    
    Security: Enforces RBAC via JWT token validation. Only users with 'admin' or
    'auditor' role_id can access this endpoint. Returns 403 for other roles.
    
    Pagination: Uses cursor-based pagination for consistent results under concurrent
    writes. Pass the next_cursor from the previous response to fetch the next page.
    
    Filters:
    - user_id: Filter logs by specific user UUID
    - action_type: Filter by action (create, update, delete, login, etc.)
    - resource_type: Filter by resource type (user, event, etc.)
    - start_date/end_date: Filter by timestamp range (UTC)
    
    Error mapping:
    - **401 Unauthorized** - Invalid or expired token
    - **403 Forbidden** - User lacks Admin or Auditor role
    - **422 Unprocessable Entity** - Invalid query parameters
    """
    try:
        input_dto = GetAuditLogsInput(
            limit=request.limit,
            cursor=request.cursor,
            user_id=request.user_id,
            action_type=request.action_type,
            resource_type=request.resource_type,
            start_date=request.start_date,
            end_date=request.end_date,
        )

        output = await use_case.execute(input_dto)

        return GetAuditLogsResponse(
            success=True,
            data=[AuditLogResponse(**log.model_dump()) for log in output.logs],
            next_cursor=output.next_cursor,
            has_more=output.has_more,
        )
    except UnauthorizedAuditAccessError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve audit logs: {str(e)}",
        )
