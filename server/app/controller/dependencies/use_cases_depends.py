from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.account_settings_usecase import AccountSettingsUseCase
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.use_cases.feature_usecase import FeatureManagementUseCase
from app.application.use_cases.profile_usecase import CheckAliasUseCase, GetLoginHistoryUseCase, OnboardingUseCase, UpdateProfileUseCase
from app.application.use_cases.queue_usecase import QueueUseCase
from app.application.use_cases.role_usecase import RoleManagementUseCase, UserRoleUseCase
from app.application.use_cases.users_usecase import AdminUserAccountUseCase
from app.application.use_cases.event_usecase import EventUseCase
from app.application.use_cases.venue_rating_usecase import VenueRatingUseCase
from app.application.use_cases.venue_usecase import VenueManagementUseCase
from app.infrastructure.cache.repositories.otp_repository import OTPRepository
from app.infrastructure.database.repositories.event_repository import EventRepository
from app.infrastructure.cache.repositories.password_reset_repository import PasswordResetRepository
from app.infrastructure.database.repositories.audit_log_repository import (
    AuditLogRepository,
)
from app.infrastructure.database.repositories.role_repository import RoleRepository
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.repositories.venue_rating_repository import VenueRatingRepository
from app.infrastructure.database.repositories.venue_repository import VenueRepository as VenueRepo
from app.infrastructure.database.session import get_db


def get_auth_use_case(request: Request, db: AsyncSession = Depends(get_db)) -> AuthUseCase:
    """Construct a fully-wired ``AuthUseCase`` for the current request.

    Injects the user repository, database session, ARQ job queue, the
    Redis-backed OTP repository, and the Redis-backed password reset repository
    so all auth flows — including forgot-password and reset-password — are
    available from a single dependency.
    """
    return AuthUseCase(
        UserRepository(db),
        db,
        request.app.state.arq,
        OTPRepository(request.app.state.redis),
        PasswordResetRepository(request.app.state.redis),
    )


def get_check_alias_use_case(db: AsyncSession = Depends(get_db)) -> CheckAliasUseCase:
    """Construct a ``CheckAliasUseCase`` for the current request."""
    return CheckAliasUseCase(UserRepository(db))


def get_onboarding_use_case(db: AsyncSession = Depends(get_db)) -> OnboardingUseCase:
    """Construct an ``OnboardingUseCase`` for the current request."""
    return OnboardingUseCase(UserRepository(db), db)


def get_update_profile_use_case(db: AsyncSession = Depends(get_db)) -> UpdateProfileUseCase:
    """Construct an ``UpdateProfileUseCase`` for the current request."""
    return UpdateProfileUseCase(UserRepository(db), db)


def get_change_password_use_case(db: AsyncSession = Depends(get_db)) -> AccountSettingsUseCase:
    """Construct an ``AccountSettingsUseCase`` wired for password changes."""
    return AccountSettingsUseCase(UserRepository(db), db=db)


def get_delete_account_use_case(request: Request, db: AsyncSession = Depends(get_db)) -> AccountSettingsUseCase:
    """Construct an ``AccountSettingsUseCase`` wired for account deletion scheduling."""
    return AccountSettingsUseCase(UserRepository(db), arq=request.app.state.arq)


def get_login_history_use_case(db: AsyncSession = Depends(get_db)) -> GetLoginHistoryUseCase:
    """Construct a ``GetLoginHistoryUseCase`` for the current request."""
    return GetLoginHistoryUseCase(UserRepository(db))


def get_admin_user_account_use_case(request: Request, db: AsyncSession = Depends(get_db)) -> AdminUserAccountUseCase:
    """Construct an ``AdminUserAccountUseCase`` for administrative user management."""
    return AdminUserAccountUseCase(
        user_repo=UserRepository(db),
        role_repo=RoleRepository(db),
        db=db,
        arq=request.app.state.arq,
        password_reset_repo=PasswordResetRepository(request.app.state.redis),
    )


def get_otp_repository(request: Request) -> OTPRepository:
    """FastAPI dependency that provides a request-scoped Redis OTP repository."""
    return OTPRepository(request.app.state.redis)


def get_audit_log_use_case(request: Request, db: AsyncSession = Depends(get_db)) -> AuditLogUseCase:
    """Construct an ``AuditLogUseCase`` with async queue support."""
    return AuditLogUseCase(AuditLogRepository(db), request.app.state.arq)


def get_role_use_case(db: AsyncSession = Depends(get_db)) -> UserRoleUseCase:
    """Construct a ``UserRoleUseCase`` for role assignment and grant management."""
    return UserRoleUseCase(RoleRepository(db), db)


def get_feature_management_use_case(db: AsyncSession = Depends(get_db)) -> FeatureManagementUseCase:
    """Construct a ``FeatureManagementUseCase`` for RBAC feature CRUD."""
    return FeatureManagementUseCase(RoleRepository(db), db)


def get_role_management_use_case(db: AsyncSession = Depends(get_db)) -> RoleManagementUseCase:
    """Construct a ``RoleManagementUseCase`` for RBAC role CRUD."""
    return RoleManagementUseCase(RoleRepository(db), db)


def get_queue_use_case(request: Request) -> QueueUseCase:
    """Construct a ``QueueUseCase`` backed by the application ARQ pool."""
    return QueueUseCase(request.app.state.arq)


def get_venue_management_use_case(db: AsyncSession = Depends(get_db)) -> VenueManagementUseCase:
    """Construct a ``VenueManagementUseCase`` for admin venue CRUD."""
    return VenueManagementUseCase(VenueRepo(db), db)


def get_venue_rating_use_case(db: AsyncSession = Depends(get_db)) -> VenueRatingUseCase:
    """Construct a ``VenueRatingUseCase`` for the current request."""
    return VenueRatingUseCase(VenueRatingRepository(db), db)


def get_event_use_case(db: AsyncSession = Depends(get_db)) -> EventUseCase:
    """Construct an ``EventUseCase`` for the current request."""
    return EventUseCase(EventRepository(db), db)
