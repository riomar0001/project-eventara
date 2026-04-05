from app.controller.dependencies.auth_depends import get_current_user_id, require_completed_onboarding
from app.controller.dependencies.rate_limit_depends import login_rate_limit
from app.controller.dependencies.use_cases_depends import (
    get_auth_use_case,
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
]
