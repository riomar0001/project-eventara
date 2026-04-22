"""Functional test cases for AccountSettingsUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.account_settings_dto import ChangePasswordInput, RequestAccountDeletionInput
from app.application.use_cases.account_settings_usecase import AccountSettingsUseCase
from app.domain.entities.user_entity import User, UserSecurity, UserStatus
from app.domain.exceptions.auth_exceptions import InvalidCredentialsError
from app.domain.exceptions.user_exceptions import (
    AccountDeletionAlreadyScheduledError,
    AccountDeletionGracePeriodExpiredError,
    EmailNotVerifiedError,
    SamePasswordError,
    UserInactiveError,
    UserNotFoundError,
)

USER_ID = uuid.uuid4()
ADMIN_ID = uuid.uuid4()
USER_EMAIL = "user@example.com"


def _make_user(*, status=UserStatus.ACTIVE, deletion_scheduled_for=None) -> User:
    return User(id=USER_ID, email=USER_EMAIL, password="hashed", status=status, deletion_scheduled_for=deletion_scheduled_for)


def _make_security(*, email_verified=True) -> UserSecurity:
    return UserSecurity(user_id=USER_ID, email_verified=email_verified)


def _make_repo(*, user=None, security=None, updated=True, scheduled_user=None):
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=security)
    repo.update_password = AsyncMock(return_value=updated)
    repo.schedule_account_deletion = AsyncMock(return_value=scheduled_user)
    repo.finalize_account_deletion = AsyncMock(return_value=True)
    return repo


def _scheduled_user():
    u = MagicMock()
    u.id = USER_ID
    u.deletion_requested_by = ADMIN_ID
    u.deletion_requested_at = datetime.now(UTC).replace(tzinfo=None)
    u.deletion_scheduled_for = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=30)
    return u


# ─── change_password ──────────────────────────────────────────────────────────


class TestChangePasswordUseCase:
    def _data(self, current="current", new="newpass") -> ChangePasswordInput:
        return ChangePasswordInput(user_id=USER_ID, current_password=current, new_password=new)

    def _make_uc(self, repo):
        return AccountSettingsUseCase(repo=repo, db=AsyncMock())

    @pytest.mark.asyncio
    async def test_success(self):
        """Hashes the new password, updates the database, and revokes all active refresh tokens"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        with (
            patch("app.application.use_cases.account_settings_usecase.verify_hash", side_effect=[True, False]),
            patch("app.application.use_cases.account_settings_usecase.hash_string", return_value="new_hash"),
            patch("app.application.use_cases.account_settings_usecase.RefreshTokenRepository", return_value=AsyncMock()),
        ):
            await self._make_uc(repo).change_password(self._data())
        repo.update_password.assert_awaited_once_with(USER_ID, "new_hash")

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the authenticated user ID"""
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user=None)).change_password(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when the account is deactivated"""
        with pytest.raises(UserInactiveError):
            await self._make_uc(_make_repo(user=_make_user(status=UserStatus.INACTIVE))).change_password(self._data())

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        """Raises UserInactiveError when the account is soft-deleted"""
        with pytest.raises(UserInactiveError):
            await self._make_uc(_make_repo(user=_make_user(status=UserStatus.DELETED))).change_password(self._data())

    @pytest.mark.asyncio
    async def test_email_not_verified(self):
        """Raises EmailNotVerifiedError when the account email has not been confirmed"""
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        with pytest.raises(EmailNotVerifiedError):
            await self._make_uc(repo).change_password(self._data())

    @pytest.mark.asyncio
    async def test_no_security_record(self):
        """Raises EmailNotVerifiedError when the security record is missing entirely"""
        with pytest.raises(EmailNotVerifiedError):
            await self._make_uc(_make_repo(user=_make_user(), security=None)).change_password(self._data())

    @pytest.mark.asyncio
    async def test_wrong_current_password(self):
        """Raises InvalidCredentialsError when the supplied current password is incorrect"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=False):
            with pytest.raises(InvalidCredentialsError):
                await self._make_uc(repo).change_password(self._data())

    @pytest.mark.asyncio
    async def test_same_password(self):
        """Raises SamePasswordError when the new password is identical to the current one"""
        repo = _make_repo(user=_make_user(), security=_make_security())
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=True):
            with pytest.raises(SamePasswordError):
                await self._make_uc(repo).change_password(self._data())

    @pytest.mark.asyncio
    async def test_update_returns_false_raises_not_found(self):
        """Raises UserNotFoundError when the password UPDATE matches no row"""
        repo = _make_repo(user=_make_user(), security=_make_security(), updated=False)
        with (
            patch("app.application.use_cases.account_settings_usecase.verify_hash", side_effect=[True, False]),
            patch("app.application.use_cases.account_settings_usecase.hash_string", return_value="h"),
        ):
            with pytest.raises(UserNotFoundError):
                await self._make_uc(repo).change_password(self._data())


# ─── request_*_deletion ───────────────────────────────────────────────────────


class TestDeleteAccountUseCase:
    def _self_data(self, password="correct") -> RequestAccountDeletionInput:
        return RequestAccountDeletionInput(target_user_id=USER_ID, requested_by=USER_ID, current_password=password)

    def _admin_data(self) -> RequestAccountDeletionInput:
        return RequestAccountDeletionInput(target_user_id=USER_ID, requested_by=ADMIN_ID)

    def _make_uc(self, repo):
        return AccountSettingsUseCase(repo=repo, arq=AsyncMock())

    @pytest.mark.asyncio
    async def test_self_service_success(self):
        """Validates password, persists the deletion window, and enqueues the deferred finalization job"""
        repo = _make_repo(user=_make_user(), scheduled_user=_scheduled_user())
        arq = AsyncMock()
        uc = AccountSettingsUseCase(repo=repo, arq=arq)
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=True):
            result = await uc.request_self_service_deletion(self._self_data())
        assert result.user_id == USER_ID
        arq.enqueue_job.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_self_service_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the authenticated user ID"""
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user=None)).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_inactive_user(self):
        """Raises UserInactiveError when the account is deactivated or deleted"""
        with pytest.raises(UserInactiveError):
            await self._make_uc(_make_repo(user=_make_user(status=UserStatus.INACTIVE))).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_already_scheduled(self):
        """Raises AccountDeletionAlreadyScheduledError when a deletion is already pending"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=10))
        with pytest.raises(AccountDeletionAlreadyScheduledError):
            await self._make_uc(_make_repo(user=user)).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_grace_expired(self):
        """Raises AccountDeletionGracePeriodExpiredError when the deletion window has already elapsed"""
        user = _make_user(deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1))
        with pytest.raises(AccountDeletionGracePeriodExpiredError):
            await self._make_uc(_make_repo(user=user)).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_wrong_password(self):
        """Raises InvalidCredentialsError when the supplied current password is incorrect"""
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=False):
            with pytest.raises(InvalidCredentialsError):
                await self._make_uc(_make_repo(user=_make_user())).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_admin_deletion_success(self):
        """Persists the deletion window without a password check and enqueues the finalization job"""
        repo = _make_repo(user=_make_user(), scheduled_user=_scheduled_user())
        arq = AsyncMock()
        uc = AccountSettingsUseCase(repo=repo, arq=arq)
        result = await uc.request_admin_deletion(self._admin_data())
        assert result.user_id == USER_ID
        arq.enqueue_job.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_admin_deletion_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the target user ID"""
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user=None)).request_admin_deletion(self._admin_data())

    @pytest.mark.asyncio
    async def test_admin_deletion_inactive_user(self):
        """Raises UserInactiveError when the target account is deactivated"""
        with pytest.raises(UserInactiveError):
            await self._make_uc(_make_repo(user=_make_user(status=UserStatus.INACTIVE))).request_admin_deletion(self._admin_data())

    @pytest.mark.asyncio
    async def test_schedule_fails_concurrent_request_raises_already_scheduled(self):
        """Raises AccountDeletionAlreadyScheduledError when a concurrent request wins the scheduling race"""
        future_user = _make_user(deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=5))
        repo = _make_repo(user=_make_user(), scheduled_user=None)
        repo.get_by_id = AsyncMock(side_effect=[_make_user(), future_user])
        with pytest.raises(AccountDeletionAlreadyScheduledError):
            await self._make_uc(repo).request_admin_deletion(self._admin_data())


# ─── finalize_account_deletion ────────────────────────────────────────────────


class TestFinalizeAccountDeletionUseCase:
    @pytest.mark.asyncio
    async def test_returns_true_when_account_finalized(self):
        """Returns True when the deletion window matches and the account is transitioned to DELETED"""
        repo = _make_repo()
        result = await AccountSettingsUseCase(repo=repo).finalize_account_deletion(
            user_id=str(USER_ID),
            requested_at=datetime.now(UTC).isoformat(),
            scheduled_for=datetime.now(UTC).isoformat(),
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_request_was_canceled(self):
        """Returns False when the deletion was canceled (login during grace period) or already finalized"""
        repo = _make_repo()
        repo.finalize_account_deletion = AsyncMock(return_value=False)
        result = await AccountSettingsUseCase(repo=repo).finalize_account_deletion(
            user_id=str(USER_ID),
            requested_at=datetime.now(UTC).isoformat(),
            scheduled_for=datetime.now(UTC).isoformat(),
        )
        assert result is False
