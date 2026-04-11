import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import LoginVerifyInput
from app.domain.exceptions import (
    InvalidOTPError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

from .conftest import MODULE, make_token_payload, make_use_case, make_user


class TestLoginVerify:
    async def test_success(self):
        user = make_user()
        payload = make_token_payload(user.id)

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.reset_failed_login = AsyncMock()
        repo.record_login = AsyncMock()

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            patch(f"{MODULE}.create_access_token", return_value="access"),
            patch(f"{MODULE}.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.login_verify(LoginVerifyInput(token="jwt", code="123456"))

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"
        repo.reset_failed_login.assert_awaited_once()
        repo.record_login.assert_awaited_once()

    async def test_raises_token_expired(self):
        uc = make_use_case(otp_repo=AsyncMock())

        with (
            patch(f"{MODULE}.verify_otp_token", side_effect=ValueError("token expired")),
            pytest.raises(TokenExpiredError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="000000"))

    async def test_raises_invalid_token(self):
        uc = make_use_case(otp_repo=AsyncMock())

        with (
            patch(f"{MODULE}.verify_otp_token", side_effect=ValueError("bad signature")),
            pytest.raises(InvalidTokenError),
        ):
            await uc.login_verify(LoginVerifyInput(token="bad", code="000000"))

    async def test_raises_invalid_otp(self):
        payload = make_token_payload(uuid.uuid4())

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=False)

        uc = make_use_case(otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            pytest.raises(InvalidOTPError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="999999"))

    async def test_raises_user_not_found(self):
        payload = make_token_payload(uuid.uuid4())

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=None)

        otp_repo = AsyncMock()
        otp_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, otp_repo=otp_repo)

        with (
            patch(f"{MODULE}.verify_otp_token", return_value=payload),
            pytest.raises(UserNotFoundError),
        ):
            await uc.login_verify(LoginVerifyInput(token="jwt", code="123456"))
