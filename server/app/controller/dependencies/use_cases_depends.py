from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.audit_log_usecase import (
    CreateAuditLogUseCase,
    GetAuditLogsUseCase,
)
from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.use_cases.queue_usecase import (
    DeleteDeadJobUseCase,
    GetQueueStatsUseCase,
    ListDeadJobsUseCase,
    PurgeDeadJobsUseCase,
    RetryDeadJobUseCase,
)
from app.application.use_cases.role_usecase import UserRoleUseCase
from app.application.use_cases.user_usecase import OnboardingUseCase
from app.infrastructure.cache.repositories.otp_repository import OTPRepository
from app.infrastructure.database.repositories.audit_log_repository import (
    AuditLogRepository,
)
from app.infrastructure.database.repositories.role_repository import RoleRepository
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db

from app.application.use_cases.venue_usecase import VenueUseCase
from app.infrastructure.database.repositories.venue_repository import VenueRepository


def get_venue_use_case(db: AsyncSession = Depends(get_db)) -> VenueUseCase:
    """Construct a ``VenueUseCase`` for CRUD operations on venues."""
    return VenueUseCase(VenueRepository(db))


def get_auth_use_case(request: Request, db: AsyncSession = Depends(get_db)) -> AuthUseCase:
    """Construct a fully-wired ``AuthUseCase`` for the current request.

    Injects the user repository, database session, ARQ job queue, and the
    Redis-backed OTP repository so all auth flows are available from a
    single dependency.
    """
    return AuthUseCase(
        UserRepository(db),
        db,
        request.app.state.arq,
        OTPRepository(request.app.state.redis),
    )


def get_onboarding_use_case(db: AsyncSession = Depends(get_db)) -> OnboardingUseCase:
    """Construct an ``OnboardingUseCase`` for the current request."""
    return OnboardingUseCase(UserRepository(db), db)


def get_otp_repository(request: Request) -> OTPRepository:
    """FastAPI dependency that provides a request-scoped Redis OTP repository."""
    return OTPRepository(request.app.state.redis)


def get_create_audit_log_use_case(request: Request, db: AsyncSession = Depends(get_db)) -> CreateAuditLogUseCase:
    """Construct a ``CreateAuditLogUseCase`` with async queue support."""
    return CreateAuditLogUseCase(AuditLogRepository(db), request.app.state.arq)


def get_audit_logs_use_case(db: AsyncSession = Depends(get_db)) -> GetAuditLogsUseCase:
    """Construct a ``GetAuditLogsUseCase`` for querying audit trail."""
    return GetAuditLogsUseCase(AuditLogRepository(db))


def get_role_use_case(db: AsyncSession = Depends(get_db)) -> UserRoleUseCase:
    """Construct a ``UserRoleUseCase`` for role assignment and grant management."""
    return UserRoleUseCase(RoleRepository(db), db)


def get_queue_stats_use_case(request: Request) -> GetQueueStatsUseCase:
    """Construct a ``GetQueueStatsUseCase`` backed by the application ARQ pool."""
    return GetQueueStatsUseCase(request.app.state.arq)


def get_list_dead_jobs_use_case(request: Request) -> ListDeadJobsUseCase:
    """Construct a ``ListDeadJobsUseCase`` backed by the application ARQ pool."""
    return ListDeadJobsUseCase(request.app.state.arq)


def get_retry_dead_job_use_case(request: Request) -> RetryDeadJobUseCase:
    """Construct a ``RetryDeadJobUseCase`` backed by the application ARQ pool."""
    return RetryDeadJobUseCase(request.app.state.arq)


def get_delete_dead_job_use_case(request: Request) -> DeleteDeadJobUseCase:
    """Construct a ``DeleteDeadJobUseCase`` backed by the application ARQ pool."""
    return DeleteDeadJobUseCase(request.app.state.arq)


def get_purge_dead_jobs_use_case(request: Request) -> PurgeDeadJobsUseCase:
    """Construct a ``PurgeDeadJobsUseCase`` backed by the application ARQ pool."""
    return PurgeDeadJobsUseCase(request.app.state.arq)
