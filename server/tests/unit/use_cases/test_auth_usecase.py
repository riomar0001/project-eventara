"""Unit tests for AuthUseCase.

All external I/O (repository calls, token functions, email dispatch, Redis)
is replaced with fakes so these tests run without a database or Redis instance.
"""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.auth_dto import (
    ForgotPasswordInput,
    LoginInput,
    LoginVerifyInput,
    LogoutInput,
    RefreshTokenInput,
    RegisterUserInput,
    ResendOtpInput,
    ResendVerificationInput,
    ResetPasswordInput,
)
from app.application.use_cases.auth_usecase import AuthUseCase
from app.domain.entities.user_entity import User, UserSecurity, UserStatus
from app.domain.exceptions import (
    AccountDeletionGracePeriodExpiredError,
    EmailAlreadyTakenError,
    EmailAlreadyVerifiedError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    InvalidOTPError,
    InvalidTokenError,
    TokenExpiredError,
    UserInactiveError,
    UserLockedError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError

# ─── Helpers ──────────────────────────────────────────────────────────────────

USER_ID = uuid.uuid4()
USER_EMAIL = "user@example.com"
RAW_PASSWORD = "password123"
HASHED_PASSWORD = "hashed_password123"


def _make_user(
    *,
    status: UserStatus = UserStatus.ACTIVE,
    onboarding_completed: bool = False,
    deletion_scheduled_for: datetime | None = None,
) -> User:
    return User(
        id=USER_ID,
        email=USER_EMAIL,
        password=HASHED_PASSWORD,
        status=status,
        onboarding_completed=onboarding_completed,
        deletion_scheduled_for=deletion_scheduled_for,
    )


def _make_security(*, email_verified: bool = True, locked_until: datetime | None = None) -> UserSecurity:
    return UserSecurity(
        user_id=USER_ID,
        email_verified=email_verified,
        locked_until=locked_until,
    )


def _make_usecase(
    *,
    repo: MagicMock | None = None,
    otp_repo: AsyncMock | None = None,
    password_reset_repo: AsyncMock | None = None,
) -> AuthUseCase:
    repo = repo or _make_repo()
    db = AsyncMock()
    arq = AsyncMock()
    return AuthUseCase(
        repo=repo,
        db=db,
        arq=arq,
        otp_repo=otp_repo,
        password_reset_repo=password_reset_repo,
    )


def _make_repo(
    *,
    user: User | None = None,
    security: UserSecurity | None = None,
) -> MagicMock:
    repo = MagicMock()
    repo.get_by_email = AsyncMock(return_value=user)
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=security)
    repo.get_active_role_name_by_user_id = AsyncMock(return_value=None)
    repo.get_profile_by_user_id = AsyncMock(return_value=None)
    repo.create = AsyncMock()
    repo.update_verification_status = AsyncMock(return_value=True)
    repo.record_failed_login = AsyncMock()
    repo.reset_failed_login = AsyncMock()
    repo.record_login = AsyncMock()
    repo.cancel_pending_account_deletion = AsyncMock()
    repo.update_password = AsyncMock(return_value=True)
    return repo


# ─── _parse_user_agent ────────────────────────────────────────────────────────


class TestParseUserAgent:
    def test_none_returns_all_none(self):
        assert AuthUseCase._parse_user_agent(None) == (None, None, None)

    def test_chrome_windows_desktop(self):
        ua = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
        browser, os, device = AuthUseCase._parse_user_agent(ua)
        assert browser == "Google Chrome"
        assert os == "Windows"
        assert device == "desktop"

    def test_firefox_macos_desktop(self):
        ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15) Gecko/20100101 Firefox/120.0"
        browser, os, device = AuthUseCase._parse_user_agent(ua)
        assert browser == "Mozilla Firefox"
        assert os == "macOS"
        assert device == "desktop"

    def test_safari_ios_mobile(self):
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
        browser, os, device = AuthUseCase._parse_user_agent(ua)
        assert browser == "Safari"
        assert os == "iOS"
        assert device == "mobile"

    def test_edge_windows_desktop(self):
        ua = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0"
        browser, os, device = AuthUseCase._parse_user_agent(ua)
        assert browser == "Microsoft Edge"
        assert os == "Windows"
        assert device == "desktop"

    def test_android_mobile(self):
        ua = "Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile"
        browser, os, device = AuthUseCase._parse_user_agent(ua)
        assert os == "Android"
        assert device == "mobile"

    def test_ipad_tablet(self):
        ua = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
        _, _, device = AuthUseCase._parse_user_agent(ua)
        assert device == "tablet"

    def test_unknown_agent(self):
        browser, os, device = AuthUseCase._parse_user_agent("CustomBot/1.0")
        assert browser is None
        assert os is None
        assert device == "desktop"


# ─── _is_deletion_grace_expired ───────────────────────────────────────────────


class TestIsDeletionGraceExpired:
    def test_no_scheduled_deletion(self):
        user = _make_user(deletion_scheduled_for=None)
        assert AuthUseCase._is_deletion_grace_expired(user) is False

    def test_future_deletion_not_expired(self):
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) + timedelta(days=10))
        assert AuthUseCase._is_deletion_grace_expired(user) is False

    def test_past_deletion_is_expired(self):
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        assert AuthUseCase._is_deletion_grace_expired(user) is True


# ─── register_user ────────────────────────────────────────────────────────────


class TestRegisterUser:
    @pytest.fixture
    def data(self):
        return RegisterUserInput(
            email=USER_EMAIL,
            password=RAW_PASSWORD,
            accepted_terms=True,
            accepted_privacy_policy=True,
        )

    @pytest.mark.asyncio
    async def test_success(self, data):
        new_user = _make_user()
        repo = _make_repo()
        repo.get_by_email = AsyncMock(return_value=None)
        repo.create = AsyncMock(return_value=new_user)
        uc = _make_usecase(repo=repo)

        with (
            patch("app.application.use_cases.auth_usecase.hash_string", return_value=HASHED_PASSWORD),
            patch("app.application.use_cases.auth_usecase.verification_token", return_value="tok"),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
        ):
            result = await uc.register_user(data)

        assert result.user.id == USER_ID
        assert result.verification_token == "tok"

    @pytest.mark.asyncio
    async def test_email_already_taken(self, data):
        repo = _make_repo(user=_make_user())
        uc = _make_usecase(repo=repo)

        with pytest.raises(EmailAlreadyTakenError):
            await uc.register_user(data)

    @pytest.mark.asyncio
    async def test_integrity_error_race_raises_email_taken(self, data):
        repo = _make_repo()
        repo.get_by_email = AsyncMock(return_value=None)
        repo.create = AsyncMock(side_effect=IntegrityError(None, None, Exception("duplicate key")))
        uc = _make_usecase(repo=repo)

        with (
            patch("app.application.use_cases.auth_usecase.hash_string", return_value=HASHED_PASSWORD),
            patch("app.application.use_cases.auth_usecase.verification_token", return_value="tok"),pytest.raises(EmailAlreadyTakenError)
        ):
            await uc.register_user(data)


# ─── verify_email ─────────────────────────────────────────────────────────────


class TestVerifyEmail:
    TOKEN = "valid.verification.token"

    def _mock_payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo)

        with (
            patch("app.application.use_cases.auth_usecase.verify_verification_token", return_value=self._mock_payload()),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
            patch("app.application.use_cases.auth_usecase.create_access_token", return_value="access"),
            patch("app.application.use_cases.auth_usecase.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.verify_email(self.TOKEN)

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"

    @pytest.mark.asyncio
    async def test_expired_token(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_verification_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.verify_email(self.TOKEN)

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_verification_token", side_effect=ValueError("invalid signature")):
            with pytest.raises(InvalidTokenError):
                await uc.verify_email(self.TOKEN)

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo)

        with patch("app.application.use_cases.auth_usecase.verify_verification_token", return_value=self._mock_payload()):
            with pytest.raises(UserNotFoundError):
                await uc.verify_email(self.TOKEN)

    @pytest.mark.asyncio
    async def test_already_verified(self):
        repo = _make_repo(user=_make_user())
        repo.update_verification_status = AsyncMock(return_value=False)
        uc = _make_usecase(repo=repo)

        with patch("app.application.use_cases.auth_usecase.verify_verification_token", return_value=self._mock_payload()):
            with pytest.raises(EmailAlreadyVerifiedError):
                await uc.verify_email(self.TOKEN)


# ─── login ────────────────────────────────────────────────────────────────────


class TestLogin:
    def _make_otp_repo(self) -> AsyncMock:
        otp = AsyncMock()
        otp.create_for_user = AsyncMock(return_value="123456")
        return otp

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        otp_repo = self._make_otp_repo()
        uc = _make_usecase(repo=repo, otp_repo=otp_repo)

        with (
            patch("app.application.use_cases.auth_usecase.verify_hash", return_value=True),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
            patch("app.application.use_cases.auth_usecase.create_otp_token", return_value="otp_tok"),
        ):
            result = await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

        assert result.verification_token == "otp_tok"
        assert result.otp == "123456"

    @pytest.mark.asyncio
    async def test_user_not_found_raises_invalid_credentials(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with pytest.raises(InvalidCredentialsError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with pytest.raises(UserInactiveError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        repo = _make_repo(user=_make_user(status=UserStatus.DELETED))
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with pytest.raises(UserInactiveError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_deletion_grace_expired(self):
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        repo = _make_repo(user=user)
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with pytest.raises(AccountDeletionGracePeriodExpiredError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_account_locked(self):
        security = _make_security(locked_until=datetime.now(UTC) + timedelta(minutes=10))
        repo = _make_repo(user=_make_user(), security=security)
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with pytest.raises(UserLockedError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_wrong_password(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_hash", return_value=False), pytest.raises(InvalidCredentialsError):
            await uc.login(LoginInput(email=USER_EMAIL, password="wrong"))

    @pytest.mark.asyncio
    async def test_email_not_verified(self):
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_hash", return_value=True), pytest.raises(EmailNotVerifiedError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_no_otp_repo_raises_runtime_error(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=None)
        with (
            patch("app.application.use_cases.auth_usecase.verify_hash", return_value=True),
        ):
            with pytest.raises(RuntimeError, match="OTP repository is not configured"):
                await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))


# ─── login_verify ─────────────────────────────────────────────────────────────


class TestLoginVerify:
    def _mock_payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    def _make_otp_repo(self, *, valid: bool = True) -> AsyncMock:
        otp = AsyncMock()
        otp.verify_and_consume = AsyncMock(return_value=valid)
        return otp

    def _data(self):
        return LoginVerifyInput(token="otp.session.tok", code="123456", ip_address="127.0.0.1", user_agent="Chrome")

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())

        with (
            patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()),
            patch("app.application.use_cases.auth_usecase.create_access_token", return_value="access"),
            patch("app.application.use_cases.auth_usecase.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.login_verify(self._data())

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"
        repo.reset_failed_login.assert_awaited_once()
        repo.cancel_pending_account_deletion.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_expired_otp_token(self):
        uc = _make_usecase(otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_invalid_otp_token(self):
        uc = _make_usecase(otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("bad signature")):
            with pytest.raises(InvalidTokenError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_wrong_otp_code(self):
        uc = _make_usecase(otp_repo=self._make_otp_repo(valid=False))
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()):
            with pytest.raises(InvalidOTPError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()):
            with pytest.raises(UserNotFoundError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()):
            with pytest.raises(UserInactiveError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_deletion_grace_expired(self):
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        repo = _make_repo(user=user)
        uc = _make_usecase(repo=repo, otp_repo=self._make_otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()):
            with pytest.raises(AccountDeletionGracePeriodExpiredError):
                await uc.login_verify(self._data())


# ─── resend_otp ───────────────────────────────────────────────────────────────


class TestResendOtp:
    def _mock_payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        p.email = USER_EMAIL
        return p

    @pytest.mark.asyncio
    async def test_success(self):
        otp_repo = AsyncMock()
        otp_repo.create_for_user = AsyncMock(return_value="654321")
        repo = _make_repo(user=_make_user())
        uc = _make_usecase(repo=repo, otp_repo=otp_repo)

        with (
            patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
            patch("app.application.use_cases.auth_usecase.create_otp_token", return_value="new_tok"),
        ):
            result = await uc.resend_otp(ResendOtpInput(token="old.tok"))

        assert result.verification_token == "new_tok"
        assert result.otp == "654321"

    @pytest.mark.asyncio
    async def test_expired_token(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.resend_otp(ResendOtpInput(token="tok"))

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("bad token")):
            with pytest.raises(InvalidTokenError):
                await uc.resend_otp(ResendOtpInput(token="tok"))

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo)
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._mock_payload()):
            with pytest.raises(UserNotFoundError):
                await uc.resend_otp(ResendOtpInput(token="tok"))


# ─── logout ───────────────────────────────────────────────────────────────────


class TestLogout:
    @pytest.mark.asyncio
    async def test_success(self):
        token_record = MagicMock()
        uc = _make_usecase()

        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(MagicMock(), token_record)),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
        ):
            mock_token_repo = AsyncMock()
            MockRepo.return_value = mock_token_repo
            await uc.logout(LogoutInput(refresh_token="valid.refresh.token"))

        mock_token_repo.revoke.assert_awaited_once_with(token_record)

    @pytest.mark.asyncio
    async def test_expired_token_is_silent(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("token expired")):
            await uc.logout(LogoutInput(refresh_token="expired.tok"))  # no exception

    @pytest.mark.asyncio
    async def test_invalid_token_raises(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("invalid token")):
            with pytest.raises(InvalidTokenError):
                await uc.logout(LogoutInput(refresh_token="bad.tok"))


# ─── refresh ──────────────────────────────────────────────────────────────────


class TestRefresh:
    def _mock_payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    @pytest.mark.asyncio
    async def test_success(self):
        token_record = MagicMock()
        repo = _make_repo(user=_make_user())
        uc = _make_usecase(repo=repo)

        with (
            patch(
                "app.application.use_cases.auth_usecase.verify_refresh_token",
                new_callable=AsyncMock,
                return_value=(self._mock_payload(), token_record),
            ),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
            patch("app.application.use_cases.auth_usecase.create_access_token", return_value="new_access"),
            patch("app.application.use_cases.auth_usecase.create_refresh_token", new_callable=AsyncMock, return_value="new_refresh"),
        ):
            mock_token_repo = AsyncMock()
            mock_token_repo.revoke = AsyncMock(return_value=True)
            MockRepo.return_value = mock_token_repo

            result = await uc.refresh(RefreshTokenInput(refresh_token="valid.refresh"))

        assert result.access_token == "new_access"
        assert result.refresh_token == "new_refresh"

    @pytest.mark.asyncio
    async def test_expired_token(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("bad token")):
            with pytest.raises(InvalidTokenError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_already_revoked_token(self):
        token_record = MagicMock()
        uc = _make_usecase()

        with (
            patch(
                "app.application.use_cases.auth_usecase.verify_refresh_token",
                new_callable=AsyncMock,
                return_value=(self._mock_payload(), token_record),
            ),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
        ):
            mock_token_repo = AsyncMock()
            mock_token_repo.revoke = AsyncMock(return_value=False)
            MockRepo.return_value = mock_token_repo

            with pytest.raises(InvalidTokenError):
                await uc.refresh(RefreshTokenInput(refresh_token="revoked.tok"))

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        token_record = MagicMock()
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo)

        with (
            patch(
                "app.application.use_cases.auth_usecase.verify_refresh_token",
                new_callable=AsyncMock,
                return_value=(self._mock_payload(), token_record),
            ),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
        ):
            mock_token_repo = AsyncMock()
            mock_token_repo.revoke = AsyncMock(return_value=True)
            MockRepo.return_value = mock_token_repo

            with pytest.raises(UserNotFoundError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        token_record = MagicMock()
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        uc = _make_usecase(repo=repo)

        with (
            patch(
                "app.application.use_cases.auth_usecase.verify_refresh_token",
                new_callable=AsyncMock,
                return_value=(self._mock_payload(), token_record),
            ),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
        ):
            mock_token_repo = AsyncMock()
            mock_token_repo.revoke = AsyncMock(return_value=True)
            MockRepo.return_value = mock_token_repo

            with pytest.raises(UserInactiveError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_deletion_grace_expired(self):
        token_record = MagicMock()
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        repo = _make_repo(user=user)
        uc = _make_usecase(repo=repo)

        with (
            patch(
                "app.application.use_cases.auth_usecase.verify_refresh_token",
                new_callable=AsyncMock,
                return_value=(self._mock_payload(), token_record),
            ),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
        ):
            mock_token_repo = AsyncMock()
            mock_token_repo.revoke = AsyncMock(return_value=True)
            MockRepo.return_value = mock_token_repo

            with pytest.raises(AccountDeletionGracePeriodExpiredError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))


# ─── resend_verification ──────────────────────────────────────────────────────


class TestResendVerification:
    @pytest.mark.asyncio
    async def test_success_sends_email(self):
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        uc = _make_usecase(repo=repo)

        with (
            patch("app.application.use_cases.auth_usecase.verification_token", return_value="vtok"),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send,
        ):
            await uc.resend_verification(ResendVerificationInput(email=USER_EMAIL))

        mock_send.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_user_not_found_is_silent(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo)
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email="ghost@example.com"))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_inactive_user_is_silent(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        uc = _make_usecase(repo=repo)
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_already_verified_is_silent(self):
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=True))
        uc = _make_usecase(repo=repo)
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()


# ─── forgot_password ──────────────────────────────────────────────────────────


class TestForgotPassword:
    def _make_pr_repo(self) -> AsyncMock:
        pr = AsyncMock()
        pr.store = AsyncMock()
        return pr

    @pytest.mark.asyncio
    async def test_success_sends_reset_email(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        pr_repo = self._make_pr_repo()
        uc = _make_usecase(repo=repo, password_reset_repo=pr_repo)

        with (
            patch("app.application.use_cases.auth_usecase.create_password_reset_token", return_value="rst"),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send,
        ):
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))

        mock_send.assert_awaited_once()
        pr_repo.store.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_user_not_found_is_silent(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo, password_reset_repo=self._make_pr_repo())
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email="ghost@example.com"))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_inactive_user_is_silent(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        uc = _make_usecase(repo=repo, password_reset_repo=self._make_pr_repo())
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_unverified_email_is_silent(self):
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        uc = _make_usecase(repo=repo, password_reset_repo=self._make_pr_repo())
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_no_reset_repo_raises(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, password_reset_repo=None)
        with pytest.raises(RuntimeError, match="Password reset repository is not configured"):
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))


# ─── reset_password ───────────────────────────────────────────────────────────


class TestResetPassword:
    def _mock_payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    def _make_pr_repo(self, *, consumed: bool = True) -> AsyncMock:
        pr = AsyncMock()
        pr.verify_and_consume = AsyncMock(return_value=consumed)
        return pr

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(user=_make_user())
        uc = _make_usecase(repo=repo, password_reset_repo=self._make_pr_repo())

        with (
            patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._mock_payload()),
            patch("app.application.use_cases.auth_usecase.hash_string", return_value="new_hash"),
        ):
            await uc.reset_password(ResetPasswordInput(token="rst.tok", new_password="newpass123"))

        repo.update_password.assert_awaited_once_with(USER_ID, "new_hash")

    @pytest.mark.asyncio
    async def test_expired_token(self):
        uc = _make_usecase(password_reset_repo=self._make_pr_repo())
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        uc = _make_usecase(password_reset_repo=self._make_pr_repo())
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", side_effect=ValueError("bad sig")):
            with pytest.raises(InvalidTokenError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_token_already_consumed(self):
        uc = _make_usecase(password_reset_repo=self._make_pr_repo(consumed=False))
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._mock_payload()):
            with pytest.raises(InvalidTokenError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        repo = _make_repo(user=None)
        uc = _make_usecase(repo=repo, password_reset_repo=self._make_pr_repo())
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._mock_payload()):
            with pytest.raises(UserNotFoundError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_update_password_fails(self):
        repo = _make_repo(user=_make_user())
        repo.update_password = AsyncMock(return_value=False)
        uc = _make_usecase(repo=repo, password_reset_repo=self._make_pr_repo())

        with (
            patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._mock_payload()),
            patch("app.application.use_cases.auth_usecase.hash_string", return_value="new_hash"),pytest.raises(UserNotFoundError)
        ):
            await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))
