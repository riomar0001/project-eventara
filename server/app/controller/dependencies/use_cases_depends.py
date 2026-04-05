from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.use_cases.user_usecase import OnboardingUseCase
from app.infrastructure.cache.repositories.otp_repository import OTPRepository
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db


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
