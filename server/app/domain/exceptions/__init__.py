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
    SamePasswordError,
    UserInactiveError,
    UserLockedError,
    UserNotFoundError,
)
from app.domain.exceptions.venue_exceptions import (
    UnauthorizedVenueOperationError,
    VenueAlreadyExistsError,
    VenueInvalidTypeError,
    VenueNotFoundError,
    VenueValidationError,
)

__all__ = [
    "EmailAlreadyTakenError",
    "EmailAlreadyVerifiedError",
    "UserNotFoundError",
    "UserLockedError",
    "UserInactiveError",
    "EmailNotVerifiedError",
    "OnboardingAlreadyCompletedError",
    "SamePasswordError",
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
    "VenueNotFoundError",
    "UnauthorizedVenueOperationError",
    "VenueValidationError",
    "VenueAlreadyExistsError",
    "VenueInvalidTypeError",
]
