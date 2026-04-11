"""Shared fixtures and factories for AuthUseCase unit tests."""

import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

from app.application.use_cases.auth_usecase import AuthUseCase
from app.domain.entities.user_entity import User, UserSecurity, UserStatus

MODULE = "app.application.use_cases.auth_usecase"


def make_user(
    *,
    status: UserStatus = UserStatus.ACTIVE,
    onboarding_completed: bool = False,
) -> User:
    return User(
        id=uuid.uuid4(),
        email="user@example.com",
        password="hashed_password",
        status=status,
        onboarding_completed=onboarding_completed,
    )


def make_security(
    *,
    email_verified: bool = True,
    locked_until: datetime | None = None,
) -> UserSecurity:
    return UserSecurity(
        user_id=uuid.uuid4(),
        email_verified=email_verified,
        locked_until=locked_until,
    )


def make_token_payload(user_id: uuid.UUID) -> MagicMock:
    payload = MagicMock()
    payload.sub = str(user_id)
    return payload


def make_use_case(
    repo: MagicMock | None = None,
    otp_repo: AsyncMock | None = None,
    password_reset_repo: AsyncMock | None = None,
) -> AuthUseCase:
    return AuthUseCase(
        repo=repo or MagicMock(),
        db=AsyncMock(),
        arq=AsyncMock(),
        otp_repo=otp_repo,
        password_reset_repo=password_reset_repo,
    )
