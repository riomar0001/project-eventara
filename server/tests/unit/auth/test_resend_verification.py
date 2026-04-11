from unittest.mock import AsyncMock, MagicMock, patch

from app.application.dto.auth_dto import ResendVerificationInput
from app.domain.entities.user_entity import UserStatus

from .conftest import MODULE, make_security, make_use_case, make_user


class TestResendVerification:
    async def test_sends_email_for_unverified_user(self):
        user = make_user()
        security = make_security(email_verified=False)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        uc = make_use_case(repo=repo)

        with (
            patch(f"{MODULE}.verification_token", return_value="tok"),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send,
        ):
            await uc.resend_verification(ResendVerificationInput(email=user.email))

        mock_send.assert_awaited_once()

    async def test_silent_when_user_not_found(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=None)

        uc = make_use_case(repo=repo)

        with patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email="ghost@example.com"))

        mock_send.assert_not_awaited()

    async def test_silent_when_user_inactive(self):
        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=make_user(status=UserStatus.INACTIVE))

        uc = make_use_case(repo=repo)

        with patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email="user@example.com"))

        mock_send.assert_not_awaited()

    async def test_silent_when_email_already_verified(self):
        user = make_user()
        security = make_security(email_verified=True)

        repo = MagicMock()
        repo.get_by_email = AsyncMock(return_value=user)
        repo.get_security_by_user_id = AsyncMock(return_value=security)

        uc = make_use_case(repo=repo)

        with patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email=user.email))

        mock_send.assert_not_awaited()
