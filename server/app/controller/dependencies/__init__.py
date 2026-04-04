import uuid
from typing import Any, cast

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases import auth_usecase
from app.application.use_cases.auth_usecase import AuthUseCase
from app.application.use_cases.user_usecase import OnboardingUseCase
from app.core.security.constants import LOGIN_RATE_LIMIT_MAX_ATTEMPTS, LOGIN_RATE_LIMIT_WINDOW_SECONDS
from app.core.security.token_service import verify_access_token
from app.infrastructure.cache.repositories.rate_limit_repository import RateLimitRepository
from app.infrastructure.repositories.user_repository import UserRepository
from app.infrastructure.database.session import get_db

_bearer = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> uuid.UUID:
    """FastAPI dependency that extracts and validates the caller's user ID.

    Decodes the Bearer token from the ``Authorization`` header and returns the
    ``sub`` claim as a ``UUID``.  Any ``ValueError`` raised by
    ``verify_access_token`` (expired, invalid signature, wrong type) is mapped
    to a 401 response with a ``WWW-Authenticate: Bearer`` header as required
    by RFC 6750.
    """
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


async def login_rate_limit(request: Request) -> None:
    """FastAPI dependency that enforces a per-IP fixed-window rate limit on login.

    Reads the client IP from the request, increments its Redis counter, and
    raises 429 if the limit is exceeded.  A ``Retry-After`` header is included
    so clients know how long to wait before retrying.

    The counter resets automatically when the window expires — no manual
    cleanup is required.
    """
    ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:login:ip:{ip}"

    repo = RateLimitRepository(request.app.state.redis)
    count = await repo.hit(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS)

    if count > LOGIN_RATE_LIMIT_MAX_ATTEMPTS:
        ttl = await repo.get_ttl(key)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Try again in {ttl} second(s).",
            headers={"Retry-After": str(ttl)},
        )
