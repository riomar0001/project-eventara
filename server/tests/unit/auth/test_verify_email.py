import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domain.exceptions import (
    EmailAlreadyVerifiedError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

from .conftest import MODULE, make_token_payload, make_use_case, make_user


class TestVerifyEmail:
    async def test_success(self):
        user = make_user()
        payload = make_token_payload(user.id)

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.update_verification_status = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_verification_token", return_value=payload),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock),
            patch(f"{MODULE}.create_access_token", return_value="access"),
            patch(f"{MODULE}.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.verify_email("valid_token")

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"

    async def test_raises_token_expired(self):
        uc = make_use_case()

        with (
            patch(f"{MODULE}.verify_verification_token", side_effect=ValueError("token has expired")),
            pytest.raises(TokenExpiredError),
        ):
            await uc.verify_email("expired_token")

    async def test_raises_invalid_token(self):
        uc = make_use_case()

        with (
            patch(f"{MODULE}.verify_verification_token", side_effect=ValueError("bad signature")),
            pytest.raises(InvalidTokenError),
        ):
            await uc.verify_email("bad_token")

    async def test_raises_user_not_found(self):
        payload = make_token_payload(uuid.uuid4())

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=None)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_verification_token", return_value=payload),
            pytest.raises(UserNotFoundError),
        ):
            await uc.verify_email("token")

    async def test_raises_email_already_verified(self):
        user = make_user()
        payload = make_token_payload(user.id)

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.update_verification_status = AsyncMock(return_value=False)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_verification_token", return_value=payload),
            pytest.raises(EmailAlreadyVerifiedError),
        ):
            await uc.verify_email("token")
