from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.auth_dto import LogoutInput
from app.domain.exceptions import InvalidTokenError

from .conftest import MODULE, make_token_payload, make_use_case


class TestLogout:
    async def test_success(self):
        import uuid

        token_record = MagicMock()
        payload = make_token_payload(uuid.uuid4())

        uc = make_use_case()

        with (
            patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, return_value=(payload, token_record)),
            patch(f"{MODULE}.RefreshTokenRepository") as mock_repo_cls,
        ):
            mock_rt_repo = AsyncMock()
            mock_repo_cls.return_value = mock_rt_repo
            await uc.logout(LogoutInput(refresh_token="valid_refresh"))

        mock_rt_repo.revoke.assert_awaited_once_with(token_record)

    async def test_silent_on_expired_token(self):
        uc = make_use_case()

        with patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, side_effect=ValueError("token expired")):
            await uc.logout(LogoutInput(refresh_token="expired"))

    async def test_raises_invalid_token_on_malformed(self):
        uc = make_use_case()

        with (
            patch(f"{MODULE}.verify_refresh_token", new_callable=AsyncMock, side_effect=ValueError("invalid token")),
            pytest.raises(InvalidTokenError),
        ):
            await uc.logout(LogoutInput(refresh_token="garbage"))
