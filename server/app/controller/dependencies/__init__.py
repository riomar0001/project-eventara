from app.controller.dependencies.auth_depends import (
    get_current_user_id,
    require_completed_onboarding,
)
from app.controller.dependencies.rate_limit_depends import login_rate_limit
from app.controller.dependencies.rbac_depends import require_admin_or_auditor_role
from app.controller.dependencies.use_cases_depends import (
    get_audit_logs_use_case,
    get_auth_use_case,
    get_create_audit_log_use_case,
    get_onboarding_use_case,
    get_otp_repository,
)

__all__ = [
    "get_current_user_id",
    "require_completed_onboarding",
    "get_auth_use_case",
    "get_onboarding_use_case",
    "get_otp_repository",
    "login_rate_limit",
    "require_admin_or_auditor_role",
    "get_create_audit_log_use_case",
    "get_audit_logs_use_case",
]
