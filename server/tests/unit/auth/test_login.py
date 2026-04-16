from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import LoginInput
from app.domain.entities.user_entity import UserStatus
from app.domain.exceptions import (
    EmailNotVerifiedError,
    InvalidCredentialsError,
    UserInactiveError,
    UserLockedError,
)

from .conftest import MODULE, make_security, make_use_case, make_user


class TestLogin:
    async def test_success(self):
        user = make_user()
        security = make_security(email_verified=True)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        otp_repo = AsyncMock()
        otp_repo.create_for_user = AsyncMock(return_value="123456")

        uc = make_use_case(repo=repo, otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_hash", return_value=True),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock),
            patch(f"{MODULE}.create_otp_token", return_value="otp_jwt"),
        ):
            result = await uc.login(LoginInput(email=user.email, password="correct"))

        assert result.verification_token == "otp_jwt"
        otp_repo.create_for_user.assert_awaited_once_with(user.id)

    async def test_raises_invalid_credentials_when_user_not_found(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=None)

        uc = make_use_case(repo=repo)

        with pytest.raises(InvalidCredentialsError):
            await uc.login(LoginInput(email="ghost@example.com", password="x"))

    async def test_raises_user_inactive(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=make_user(status=UserStatus.INACTIVE))

        uc = make_use_case(repo=repo)

        with pytest.raises(UserInactiveError):
            await uc.login(LoginInput(email="user@example.com", password="x"))

    async def test_raises_user_deleted(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=make_user(status=UserStatus.DELETED))

        uc = make_use_case(repo=repo)

        with pytest.raises(UserInactiveError):
            await uc.login(LoginInput(email="user@example.com", password="x"))

    async def test_raises_user_locked(self):
        user = make_user()
        future = datetime.now(UTC) + timedelta(hours=1)
        security = make_security(locked_until=future)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        uc = make_use_case(repo=repo)

        with pytest.raises(UserLockedError):
            await uc.login(LoginInput(email=user.email, password="wrong"))

    async def test_raises_invalid_credentials_on_bad_password(self):
        user = make_user()
        security = make_security(locked_until=None)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)
        repo.record_failed_login = AsyncMock()

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_hash", return_value=False),
            pytest.raises(InvalidCredentialsError),
        ):
            await uc.login(LoginInput(email=user.email, password="wrong"))

        repo.record_failed_login.assert_awaited_once()

    async def test_raises_email_not_verified(self):
        user = make_user()
        security = make_security(email_verified=False, locked_until=None)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_hash", return_value=True),
            pytest.raises(EmailNotVerifiedError),
        ):
            await uc.login(LoginInput(email=user.email, password="correct"))
