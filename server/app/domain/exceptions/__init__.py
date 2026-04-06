from app.domain.exceptions.audit_exceptions import (
    AuditLogWriteError,
    UnauthorizedAuditAccessError,
)
from app.domain.exceptions.auth_exceptions import (
    InvalidCredentialsError,
    InvalidOTPError,
    InvalidTokenError,
    TokenExpiredError,
)
from app.domain.exceptions.role_exceptions import (
    DuplicateUserGrantError,
    FeatureNotFoundError,
    RoleAlreadyAssignedError,
    RoleAssignmentNotFoundError,
    RoleNotFoundError,
    UserGrantNotFoundError,
)
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    UserInactiveError,
    UserLockedError,
    UserNotFoundError,
)

__all__ = [
    "EmailAlreadyTakenError",
    "EmailAlreadyVerifiedError",
    "UserNotFoundError",
    "UserLockedError",
    "UserInactiveError",
    "EmailNotVerifiedError",
    "OnboardingAlreadyCompletedError",
    "AliasAlreadyTakenError",
    "InvalidTokenError",
    "TokenExpiredError",
    "InvalidCredentialsError",
    "InvalidOTPError",
    "AuditLogWriteError",
    "UnauthorizedAuditAccessError",
    "RoleNotFoundError",
    "RoleAssignmentNotFoundError",
    "RoleAlreadyAssignedError",
    "FeatureNotFoundError",
    "UserGrantNotFoundError",
    "DuplicateUserGrantError",
]
