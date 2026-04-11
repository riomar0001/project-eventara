from unittest.mock import AsyncMock, MagicMock, patch

from app.application.dto.auth_dto import ForgotPasswordInput
from app.domain.entities.user_entity import UserStatus

from .conftest import MODULE, make_security, make_use_case, make_user


class TestForgotPassword:
    async def test_sends_reset_email(self):
        user = make_user()
        security = make_security(email_verified=True)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        password_reset_repo = AsyncMock()
        password_reset_repo.store = AsyncMock()

        uc = make_use_case(repo=repo, password_reset_repo=password_reset_repo)

        with (
            patch(f"{MODULE}.create_password_reset_token", return_value="reset_tok"),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send,
        ):
            await uc.forgot_password(ForgotPasswordInput(email=user.email))

        password_reset_repo.store.assert_awaited_once_with(user.id, "reset_tok")
        mock_send.assert_awaited_once()

    async def test_silent_when_user_not_found(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=None)

        uc = make_use_case(repo=repo, password_reset_repo=AsyncMock())

        with patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email="ghost@example.com"))

        mock_send.assert_not_awaited()

    async def test_silent_when_user_inactive(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=make_user(status=UserStatus.DELETED))

        uc = make_use_case(repo=repo, password_reset_repo=AsyncMock())

        with patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email="user@example.com"))

        mock_send.assert_not_awaited()

    async def test_silent_when_email_not_verified(self):
        user = make_user()
        security = make_security(email_verified=False)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        uc = make_use_case(repo=repo, password_reset_repo=AsyncMock())

        with patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email=user.email))

        mock_send.assert_not_awaited()
