import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import ResetPasswordInput
from app.domain.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

from .conftest import MODULE, make_token_payload, make_use_case, make_user


class TestResetPassword:
    async def test_success(self):
        user = make_user()
        payload = make_token_payload(user.id)

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.update_password = AsyncMock(return_value=True)

        password_reset_repo = AsyncMock()
        password_reset_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, password_reset_repo=password_reset_repo)

        with (
            patch(f"{MODULE}.verify_password_reset_token", return_value=payload),
            patch(f"{MODULE}.hash_string", return_value="new_hashed"),
        ):
            await uc.reset_password(ResetPasswordInput(token="reset_tok", new_password="NewPass123!"))

        repo.update_password.assert_awaited_once_with(user.id, "new_hashed")

    async def test_raises_token_expired(self):
        uc = make_use_case(password_reset_repo=AsyncMock())

        with (
            patch(f"{MODULE}.verify_password_reset_token", side_effect=ValueError("token has expired")),
            pytest.raises(TokenExpiredError),
        ):
            await uc.reset_password(ResetPasswordInput(token="expired", new_password="x"))

    async def test_raises_invalid_token_on_bad_signature(self):
        uc = make_use_case(password_reset_repo=AsyncMock())

        with (
            patch(f"{MODULE}.verify_password_reset_token", side_effect=ValueError("invalid signature")),
            pytest.raises(InvalidTokenError),
        ):
            await uc.reset_password(ResetPasswordInput(token="bad", new_password="x"))

    async def test_raises_invalid_token_when_already_consumed(self):
        payload = make_token_payload(uuid.uuid4())

        password_reset_repo = AsyncMock()
        password_reset_repo.verify_and_consume = AsyncMock(return_value=False)

        uc = make_use_case(password_reset_repo=password_reset_repo)

        with (
            patch(f"{MODULE}.verify_password_reset_token", return_value=payload),
            pytest.raises(InvalidTokenError),
        ):
            await uc.reset_password(ResetPasswordInput(token="used_token", new_password="x"))

    async def test_raises_user_not_found(self):
        payload = make_token_payload(uuid.uuid4())

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=None)

        password_reset_repo = AsyncMock()
        password_reset_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, password_reset_repo=password_reset_repo)

        with (
            patch(f"{MODULE}.verify_password_reset_token", return_value=payload),
            pytest.raises(UserNotFoundError),
        ):
            await uc.reset_password(ResetPasswordInput(token="tok", new_password="x"))

    async def test_raises_user_not_found_when_update_fails(self):
        user = make_user()
        payload = make_token_payload(user.id)

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)
        repo.update_password = AsyncMock(return_value=False)

        password_reset_repo = AsyncMock()
        password_reset_repo.verify_and_consume = AsyncMock(return_value=True)

        uc = make_use_case(repo=repo, password_reset_repo=password_reset_repo)

        with (
            patch(f"{MODULE}.verify_password_reset_token", return_value=payload),
            patch(f"{MODULE}.hash_string", return_value="hashed"),
            pytest.raises(UserNotFoundError),
        ):
            await uc.reset_password(ResetPasswordInput(token="tok", new_password="NewPass!"))
