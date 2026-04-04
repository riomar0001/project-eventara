import uuid
from typing import Any, cast

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases import auth_usecase
from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.use_cases.onboarding_usecase import OnboardingUseCase
from app.core.security.token_service import verify_access_token
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db

_bearer = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> uuid.UUID:
    try:
        payload = verify_access_token(credentials.credentials)
    except ValueError as exc:
        message = str(exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=message,
            headers={"WWW-Authenticate": "Bearer"},
        )
    return uuid.UUID(payload.sub)


def get_auth_use_case(db: AsyncSession = Depends(get_db)) -> AuthUseCase:
    return AuthUseCase(UserRepository(db), db)


def get_onboarding_use_case(db: AsyncSession = Depends(get_db)) -> OnboardingUseCase:
    return OnboardingUseCase(UserRepository(db), db)
