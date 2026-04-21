"""Functional test cases for AuthUseCase — outputs a formatted report table via conftest."""

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

# ─── Fixtures ─────────────────────────────────────────────────────────────────

USER_ID = uuid.uuid4()
USER_EMAIL = "user@example.com"
RAW_PASSWORD = "password123"
HASHED_PASSWORD = "hashed_password123"


def _make_user(*, status=UserStatus.ACTIVE, onboarding_completed=False, deletion_scheduled_for=None) -> User:
    return User(
        id=USER_ID,
        email=USER_EMAIL,
        password=HASHED_PASSWORD,
        status=status,
        onboarding_completed=onboarding_completed,
        deletion_scheduled_for=deletion_scheduled_for,
    )


def _make_security(*, email_verified=True, locked_until=None) -> UserSecurity:
    return UserSecurity(user_id=USER_ID, email_verified=email_verified, locked_until=locked_until)


def _make_repo(*, user=None, security=None):
    repo = MagicMock()
    repo.get_by_email = AsyncMock(return_value=user)
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=security)
    repo.get_active_role_name_by_user_id = AsyncMock(return_value=None)
    repo.get_profile_by_user_id = AsyncMock(return_value=None)
    repo.create = AsyncMock(return_value=user)
    repo.update_verification_status = AsyncMock(return_value=True)
    repo.record_failed_login = AsyncMock()
    repo.reset_failed_login = AsyncMock()
    repo.record_login = AsyncMock()
    repo.cancel_pending_account_deletion = AsyncMock()
    repo.update_password = AsyncMock(return_value=True)
    return repo


def _make_usecase(*, repo=None, otp_repo=None, password_reset_repo=None):
    return AuthUseCase(
        repo=repo or _make_repo(),
        db=AsyncMock(),
        arq=AsyncMock(),
        otp_repo=otp_repo,
        password_reset_repo=password_reset_repo,
    )


# ─── Parse User Agent ─────────────────────────────────────────────────────────


class TestParseUserAgent:
    def test_none_returns_all_none(self):
        """Returns (None, None, None) for missing user agent"""
        assert AuthUseCase._parse_user_agent(None) == (None, None, None)

    def test_chrome_windows_desktop(self):
        """Returns browser=Chrome, os=Windows, device=desktop"""
        browser, os, device = AuthUseCase._parse_user_agent("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36")
        assert browser == "Google Chrome" and os == "Windows" and device == "desktop"

    def test_firefox_macos_desktop(self):
        """Returns browser=Firefox, os=macOS, device=desktop"""
        browser, os, device = AuthUseCase._parse_user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15) Gecko/20100101 Firefox/120.0")
        assert browser == "Mozilla Firefox" and os == "macOS" and device == "desktop"

    def test_safari_ios_mobile(self):
        """Returns browser=Safari, os=iOS, device=mobile"""
        browser, os, device = AuthUseCase._parse_user_agent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1")
        assert browser == "Safari" and os == "iOS" and device == "mobile"

    def test_edge_windows_desktop(self):
        """Returns browser=Microsoft Edge, os=Windows, device=desktop"""
        browser, os, device = AuthUseCase._parse_user_agent("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0 Safari/537.36 Edg/120.0")
        assert browser == "Microsoft Edge" and os == "Windows" and device == "desktop"

    def test_android_mobile(self):
        """Returns os=Android, device=mobile"""
        _, os, device = AuthUseCase._parse_user_agent("Mozilla/5.0 (Linux; Android 13) Mobile")
        assert os == "Android" and device == "mobile"

    def test_ipad_tablet(self):
        """Returns device=tablet for iPad user agent"""
        _, _, device = AuthUseCase._parse_user_agent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15")
        assert device == "tablet"

    def test_unknown_agent(self):
        """Returns (None, None, desktop) for unrecognised user agent string"""
        browser, os, device = AuthUseCase._parse_user_agent("CustomBot/1.0")
        assert browser is None and os is None and device == "desktop"


# ─── Deletion Grace Period ────────────────────────────────────────────────────


class TestIsDeletionGraceExpired:
    def test_no_scheduled_deletion(self):
        """Returns False when no deletion is scheduled"""
        assert AuthUseCase._is_deletion_grace_expired(_make_user()) is False

    def test_future_deletion_not_expired(self):
        """Returns False when deletion deadline is still in the future"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) + timedelta(days=10))
        assert AuthUseCase._is_deletion_grace_expired(user) is False

    def test_past_deletion_is_expired(self):
        """Returns True when deletion deadline has already passed"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        assert AuthUseCase._is_deletion_grace_expired(user) is True


# ─── Register User ────────────────────────────────────────────────────────────


class TestRegisterUser:
    _data = RegisterUserInput(email=USER_EMAIL, password=RAW_PASSWORD, accepted_terms=True, accepted_privacy_policy=True)

    @pytest.mark.asyncio
    async def test_success(self):
        """Creates user and returns RegisteredUserOutput with verification token"""
        repo = _make_repo(user=_make_user())
        repo.get_by_email = AsyncMock(return_value=None)
        uc = _make_usecase(repo=repo)
        with (
            patch("app.application.use_cases.auth_usecase.hash_string", return_value=HASHED_PASSWORD),
            patch("app.application.use_cases.auth_usecase.verification_token", return_value="vtok"),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
        ):
            result = await uc.register_user(self._data)
        assert result.verification_token == "vtok"

    @pytest.mark.asyncio
    async def test_email_already_taken(self):
        """Raises EmailAlreadyTakenError when email is already registered"""
        uc = _make_usecase(repo=_make_repo(user=_make_user()))
        with pytest.raises(EmailAlreadyTakenError):
            await uc.register_user(self._data)

    @pytest.mark.asyncio
    async def test_integrity_error_race(self):
        """Raises EmailAlreadyTakenError on concurrent duplicate registration (IntegrityError)"""
        repo = _make_repo()
        repo.get_by_email = AsyncMock(return_value=None)
        repo.create = AsyncMock(side_effect=IntegrityError(None, None, Exception("duplicate key")))
        uc = _make_usecase(repo=repo)
        with (
            patch("app.application.use_cases.auth_usecase.hash_string", return_value=HASHED_PASSWORD),
            patch("app.application.use_cases.auth_usecase.verification_token", return_value="vtok"),
        ):
            with pytest.raises(EmailAlreadyTakenError):
                await uc.register_user(self._data)


# ─── Verify Email ─────────────────────────────────────────────────────────────


class TestVerifyEmail:
    def _payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    @pytest.mark.asyncio
    async def test_success(self):
        """Verifies email and returns access_token and refresh_token"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo)
        with (
            patch("app.application.use_cases.auth_usecase.verify_verification_token", return_value=self._payload()),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
            patch("app.application.use_cases.auth_usecase.create_access_token", return_value="access"),
            patch("app.application.use_cases.auth_usecase.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.verify_email("tok")
        assert result.access_token == "access" and result.refresh_token == "refresh"

    @pytest.mark.asyncio
    async def test_expired_token(self):
        """Raises TokenExpiredError when verification token is expired"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_verification_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.verify_email("tok")

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        """Raises InvalidTokenError when token has bad signature or is malformed"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_verification_token", side_effect=ValueError("invalid signature")):
            with pytest.raises(InvalidTokenError):
                await uc.verify_email("tok")

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when token subject has no matching account"""
        uc = _make_usecase(repo=_make_repo(user=None))
        with patch("app.application.use_cases.auth_usecase.verify_verification_token", return_value=self._payload()):
            with pytest.raises(UserNotFoundError):
                await uc.verify_email("tok")

    @pytest.mark.asyncio
    async def test_already_verified(self):
        """Raises EmailAlreadyVerifiedError when email was already confirmed"""
        repo = _make_repo(user=_make_user())
        repo.update_verification_status = AsyncMock(return_value=False)
        uc = _make_usecase(repo=repo)
        with patch("app.application.use_cases.auth_usecase.verify_verification_token", return_value=self._payload()):
            with pytest.raises(EmailAlreadyVerifiedError):
                await uc.verify_email("tok")


# ─── Login ────────────────────────────────────────────────────────────────────


class TestLogin:
    def _otp_repo(self):
        otp = AsyncMock()
        otp.create_for_user = AsyncMock(return_value="123456")
        return otp

    @pytest.mark.asyncio
    async def test_success(self):
        """Sends OTP email and returns verification_token for the second step"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=self._otp_repo())
        with (
            patch("app.application.use_cases.auth_usecase.verify_hash", return_value=True),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
            patch("app.application.use_cases.auth_usecase.create_otp_token", return_value="otp_tok"),
        ):
            result = await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))
        assert result.verification_token == "otp_tok"

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises InvalidCredentialsError to prevent email enumeration"""
        uc = _make_usecase(repo=_make_repo(user=None), otp_repo=self._otp_repo())
        with pytest.raises(InvalidCredentialsError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when account is deactivated"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(status=UserStatus.INACTIVE)), otp_repo=self._otp_repo())
        with pytest.raises(UserInactiveError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        """Raises UserInactiveError when account is soft-deleted"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(status=UserStatus.DELETED)), otp_repo=self._otp_repo())
        with pytest.raises(UserInactiveError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_deletion_grace_expired(self):
        """Raises AccountDeletionGracePeriodExpiredError when grace window has passed"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        uc = _make_usecase(repo=_make_repo(user=user), otp_repo=self._otp_repo())
        with pytest.raises(AccountDeletionGracePeriodExpiredError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_account_locked(self):
        """Raises UserLockedError when account is temporarily locked"""
        security = _make_security(locked_until=datetime.now(UTC) + timedelta(minutes=10))
        uc = _make_usecase(repo=_make_repo(user=_make_user(), security=security), otp_repo=self._otp_repo())
        with pytest.raises(UserLockedError):
            await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_wrong_password(self):
        """Raises InvalidCredentialsError and records the failed attempt"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_hash", return_value=False):
            with pytest.raises(InvalidCredentialsError):
                await uc.login(LoginInput(email=USER_EMAIL, password="wrong"))

    @pytest.mark.asyncio
    async def test_email_not_verified(self):
        """Raises EmailNotVerifiedError when account email is unconfirmed"""
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        uc = _make_usecase(repo=repo, otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_hash", return_value=True):
            with pytest.raises(EmailNotVerifiedError):
                await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))

    @pytest.mark.asyncio
    async def test_no_otp_repo(self):
        """Raises RuntimeError when OTP repository is not configured"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=None)
        with patch("app.application.use_cases.auth_usecase.verify_hash", return_value=True):
            with pytest.raises(RuntimeError, match="OTP repository is not configured"):
                await uc.login(LoginInput(email=USER_EMAIL, password=RAW_PASSWORD))


# ─── Login Verify ─────────────────────────────────────────────────────────────


class TestLoginVerify:
    def _payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    def _otp_repo(self, *, valid=True):
        otp = AsyncMock()
        otp.verify_and_consume = AsyncMock(return_value=valid)
        return otp

    def _data(self):
        return LoginVerifyInput(token="otp.tok", code="123456", ip_address="127.0.0.1", user_agent="Chrome")

    @pytest.mark.asyncio
    async def test_success(self):
        """Returns access_token and refresh_token on valid OTP and resets failed-login counter"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = _make_usecase(repo=repo, otp_repo=self._otp_repo())
        with (
            patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()),
            patch("app.application.use_cases.auth_usecase.create_access_token", return_value="access"),
            patch("app.application.use_cases.auth_usecase.create_refresh_token", new_callable=AsyncMock, return_value="refresh"),
        ):
            result = await uc.login_verify(self._data())
        assert result.access_token == "access" and result.refresh_token == "refresh"
        repo.reset_failed_login.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_expired_otp_token(self):
        """Raises TokenExpiredError when the OTP session token is expired"""
        uc = _make_usecase(otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_invalid_otp_token(self):
        """Raises InvalidTokenError when OTP session token has bad signature"""
        uc = _make_usecase(otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("bad signature")):
            with pytest.raises(InvalidTokenError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_wrong_otp_code(self):
        """Raises InvalidOTPError when submitted code is wrong or already consumed"""
        uc = _make_usecase(otp_repo=self._otp_repo(valid=False))
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()):
            with pytest.raises(InvalidOTPError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when token subject has no matching account"""
        uc = _make_usecase(repo=_make_repo(user=None), otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()):
            with pytest.raises(UserNotFoundError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when account is deactivated after OTP issued"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(status=UserStatus.INACTIVE)), otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()):
            with pytest.raises(UserInactiveError):
                await uc.login_verify(self._data())

    @pytest.mark.asyncio
    async def test_deletion_grace_expired(self):
        """Raises AccountDeletionGracePeriodExpiredError when grace window passed after OTP issued"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        uc = _make_usecase(repo=_make_repo(user=user), otp_repo=self._otp_repo())
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()):
            with pytest.raises(AccountDeletionGracePeriodExpiredError):
                await uc.login_verify(self._data())


# ─── Resend OTP ───────────────────────────────────────────────────────────────


class TestResendOtp:
    def _payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        p.email = USER_EMAIL
        return p

    @pytest.mark.asyncio
    async def test_success(self):
        """Replaces existing OTP, sends new email, returns fresh verification_token"""
        otp_repo = AsyncMock()
        otp_repo.create_for_user = AsyncMock(return_value="654321")
        uc = _make_usecase(repo=_make_repo(user=_make_user()), otp_repo=otp_repo)
        with (
            patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()),
            patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock),
            patch("app.application.use_cases.auth_usecase.create_otp_token", return_value="new_tok"),
        ):
            result = await uc.resend_otp(ResendOtpInput(token="old.tok"))
        assert result.verification_token == "new_tok" and result.otp == "654321"

    @pytest.mark.asyncio
    async def test_expired_token(self):
        """Raises TokenExpiredError when the existing OTP session token is expired"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.resend_otp(ResendOtpInput(token="tok"))

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        """Raises InvalidTokenError when OTP session token is malformed"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", side_effect=ValueError("bad token")):
            with pytest.raises(InvalidTokenError):
                await uc.resend_otp(ResendOtpInput(token="tok"))

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when token subject has no matching account"""
        uc = _make_usecase(repo=_make_repo(user=None))
        with patch("app.application.use_cases.auth_usecase.verify_otp_token", return_value=self._payload()):
            with pytest.raises(UserNotFoundError):
                await uc.resend_otp(ResendOtpInput(token="tok"))


# ─── Logout ───────────────────────────────────────────────────────────────────


class TestLogout:
    @pytest.mark.asyncio
    async def test_success(self):
        """Revokes the submitted refresh token and terminates the session"""
        token_record = MagicMock()
        uc = _make_usecase()
        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(MagicMock(), token_record)),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository") as MockRepo,
        ):
            mock_repo = AsyncMock()
            MockRepo.return_value = mock_repo
            await uc.logout(LogoutInput(refresh_token="valid.tok"))
        mock_repo.revoke.assert_awaited_once_with(token_record)

    @pytest.mark.asyncio
    async def test_expired_token_is_silent(self):
        """Returns None silently when refresh token is expired (already logged out)"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("token expired")):
            await uc.logout(LogoutInput(refresh_token="expired.tok"))

    @pytest.mark.asyncio
    async def test_invalid_token_raises(self):
        """Raises InvalidTokenError when refresh token has bad signature or wrong type"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("invalid token")):
            with pytest.raises(InvalidTokenError):
                await uc.logout(LogoutInput(refresh_token="bad.tok"))


# ─── Refresh Token ────────────────────────────────────────────────────────────


class TestRefresh:
    def _payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    def _patched(self, *, revoked=True):
        mock_repo = AsyncMock()
        mock_repo.revoke = AsyncMock(return_value=revoked)
        return mock_repo

    @pytest.mark.asyncio
    async def test_success(self):
        """Rotates the refresh token and returns a new access_token and refresh_token"""
        uc = _make_usecase(repo=_make_repo(user=_make_user()))
        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(self._payload(), MagicMock())),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository", return_value=self._patched()),
            patch("app.application.use_cases.auth_usecase.create_access_token", return_value="new_access"),
            patch("app.application.use_cases.auth_usecase.create_refresh_token", new_callable=AsyncMock, return_value="new_refresh"),
        ):
            result = await uc.refresh(RefreshTokenInput(refresh_token="old.tok"))
        assert result.access_token == "new_access" and result.refresh_token == "new_refresh"

    @pytest.mark.asyncio
    async def test_expired_token(self):
        """Raises TokenExpiredError when the refresh token JWT is expired"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        """Raises InvalidTokenError when token is malformed or has bad signature"""
        uc = _make_usecase()
        with patch("app.application.use_cases.auth_usecase.verify_refresh_token", side_effect=ValueError("bad token")):
            with pytest.raises(InvalidTokenError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_already_revoked(self):
        """Raises InvalidTokenError when token was already rotated or revoked"""
        uc = _make_usecase()
        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(self._payload(), MagicMock())),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository", return_value=self._patched(revoked=False)),
        ):
            with pytest.raises(InvalidTokenError):
                await uc.refresh(RefreshTokenInput(refresh_token="revoked.tok"))

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when token subject has no matching account"""
        uc = _make_usecase(repo=_make_repo(user=None))
        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(self._payload(), MagicMock())),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository", return_value=self._patched()),
        ):
            with pytest.raises(UserNotFoundError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when account is deactivated"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(status=UserStatus.INACTIVE)))
        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(self._payload(), MagicMock())),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository", return_value=self._patched()),
        ):
            with pytest.raises(UserInactiveError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))

    @pytest.mark.asyncio
    async def test_deletion_grace_expired(self):
        """Raises AccountDeletionGracePeriodExpiredError when account grace window has passed"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC) - timedelta(seconds=1))
        uc = _make_usecase(repo=_make_repo(user=user))
        with (
            patch("app.application.use_cases.auth_usecase.verify_refresh_token", new_callable=AsyncMock, return_value=(self._payload(), MagicMock())),
            patch("app.application.use_cases.auth_usecase.RefreshTokenRepository", return_value=self._patched()),
        ):
            with pytest.raises(AccountDeletionGracePeriodExpiredError):
                await uc.refresh(RefreshTokenInput(refresh_token="tok"))


# ─── Resend Verification ──────────────────────────────────────────────────────


class TestResendVerification:
    @pytest.mark.asyncio
    async def test_success(self):
        """Sends a fresh verification email to an unverified account"""
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
        """Returns None silently — prevents email enumeration when address is unknown"""
        uc = _make_usecase(repo=_make_repo(user=None))
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email="ghost@example.com"))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_inactive_user_is_silent(self):
        """Returns None silently for inactive or deleted accounts"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(status=UserStatus.INACTIVE)))
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_already_verified_is_silent(self):
        """Returns None silently when email is already confirmed"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(), security=_make_security(email_verified=True)))
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.resend_verification(ResendVerificationInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()


# ─── Forgot Password ──────────────────────────────────────────────────────────


class TestForgotPassword:
    def _pr_repo(self):
        pr = AsyncMock()
        pr.store = AsyncMock()
        return pr

    @pytest.mark.asyncio
    async def test_success(self):
        """Stores reset token in Redis and sends password-reset email"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        pr_repo = self._pr_repo()
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
        """Returns None silently — prevents email enumeration when address is unknown"""
        uc = _make_usecase(repo=_make_repo(user=None), password_reset_repo=self._pr_repo())
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email="ghost@example.com"))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_inactive_user_is_silent(self):
        """Returns None silently for inactive or deleted accounts"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(status=UserStatus.INACTIVE)), password_reset_repo=self._pr_repo())
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_unverified_email_is_silent(self):
        """Returns None silently when account email is unconfirmed"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(), security=_make_security(email_verified=False)), password_reset_repo=self._pr_repo())
        with patch("app.application.use_cases.auth_usecase.send_email", new_callable=AsyncMock) as mock_send:
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))
        mock_send.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_no_reset_repo(self):
        """Raises RuntimeError when password reset repository is not configured"""
        uc = _make_usecase(repo=_make_repo(user=_make_user(), security=_make_security()), password_reset_repo=None)
        with pytest.raises(RuntimeError, match="Password reset repository is not configured"):
            await uc.forgot_password(ForgotPasswordInput(email=USER_EMAIL))


# ─── Reset Password ───────────────────────────────────────────────────────────


class TestResetPassword:
    def _payload(self):
        p = MagicMock()
        p.sub = str(USER_ID)
        return p

    def _pr_repo(self, *, consumed=True):
        pr = AsyncMock()
        pr.verify_and_consume = AsyncMock(return_value=consumed)
        return pr

    @pytest.mark.asyncio
    async def test_success(self):
        """Atomically consumes reset token and updates password hash"""
        uc = _make_usecase(repo=_make_repo(user=_make_user()), password_reset_repo=self._pr_repo())
        with (
            patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._payload()),
            patch("app.application.use_cases.auth_usecase.hash_string", return_value="new_hash"),
        ):
            await uc.reset_password(ResetPasswordInput(token="rst.tok", new_password="newpass123"))

    @pytest.mark.asyncio
    async def test_expired_token(self):
        """Raises TokenExpiredError when reset token JWT is expired"""
        uc = _make_usecase(password_reset_repo=self._pr_repo())
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", side_effect=ValueError("token expired")):
            with pytest.raises(TokenExpiredError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_invalid_token(self):
        """Raises InvalidTokenError when reset token is malformed or has bad signature"""
        uc = _make_usecase(password_reset_repo=self._pr_repo())
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", side_effect=ValueError("bad sig")):
            with pytest.raises(InvalidTokenError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_token_already_consumed(self):
        """Raises InvalidTokenError when reset token was already used (GETDEL returned None)"""
        uc = _make_usecase(password_reset_repo=self._pr_repo(consumed=False))
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._payload()):
            with pytest.raises(InvalidTokenError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when token subject has no matching account"""
        uc = _make_usecase(repo=_make_repo(user=None), password_reset_repo=self._pr_repo())
        with patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._payload()):
            with pytest.raises(UserNotFoundError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))

    @pytest.mark.asyncio
    async def test_update_password_fails(self):
        """Raises UserNotFoundError when password update finds no matching row"""
        repo = _make_repo(user=_make_user())
        repo.update_password = AsyncMock(return_value=False)
        uc = _make_usecase(repo=repo, password_reset_repo=self._pr_repo())
        with (
            patch("app.application.use_cases.auth_usecase.verify_password_reset_token", return_value=self._payload()),
            patch("app.application.use_cases.auth_usecase.hash_string", return_value="new_hash"),
        ):
            with pytest.raises(UserNotFoundError):
                await uc.reset_password(ResetPasswordInput(token="tok", new_password="pass"))
