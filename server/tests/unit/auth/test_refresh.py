import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import RefreshTokenInput
from app.domain.exceptions import (
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

from .conftest import MODULE, make_token_payload, make_use_case, make_user


class TestRefresh:
    async def test_success(self):
        user = make_user()
        payload = make_token_payload(user.id)
        token_record = MagicMock()

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=user)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, return_value=(payload, token_record)),
            patch(f"{MODULE}.RefreshTokenRepository") as mock_repo_cls,
            patch(f"{MODULE}.create_access_token", return_value="new_access"),
            patch(f"{MODULE}.create_refresh_token", new_callable=AsyncMock, return_value="new_refresh"),
        ):
            mock_rt_repo = AsyncMock()
            mock_rt_repo.revoke = AsyncMock(return_value=True)
            mock_repo_cls.return_value = mock_rt_repo

            result = await uc.refresh(RefreshTokenInput(refresh_token="old_refresh"))

        assert result.access_token == "new_access"
        assert result.refresh_token == "new_refresh"

    async def test_raises_token_expired(self):
        uc = make_use_case()

        with (
            patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, side_effect=ValueError("token expired")),
            pytest.raises(TokenExpiredError),
        ):
            await uc.refresh(RefreshTokenInput(refresh_token="expired"))

    async def test_raises_invalid_token_on_revoke_failure(self):
        payload = make_token_payload(uuid.uuid4())
        token_record = MagicMock()

        uc = make_use_case()

        with (
            patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, return_value=(payload, token_record)),
            patch(f"{MODULE}.RefreshTokenRepository") as mock_repo_cls,
            pytest.raises(InvalidTokenError),
        ):
            mock_rt_repo = AsyncMock()
            mock_rt_repo.revoke = AsyncMock(return_value=False)
            mock_repo_cls.return_value = mock_rt_repo

            await uc.refresh(RefreshTokenInput(refresh_token="already_rotated"))

    async def test_raises_user_not_found(self):
        payload = make_token_payload(uuid.uuid4())
        token_record = MagicMock()

        repo = MagicMock()
        repo.get_by_id = AsyncMock(return_value=None)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, return_value=(payload, token_record)),
            patch(f"{MODULE}.RefreshTokenRepository") as mock_repo_cls,
            pytest.raises(UserNotFoundError),
        ):
            mock_rt_repo = AsyncMock()
            mock_rt_repo.revoke = AsyncMock(return_value=True)
            mock_repo_cls.return_value = mock_rt_repo

            await uc.refresh(RefreshTokenInput(refresh_token="valid"))
