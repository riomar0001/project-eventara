"""Unit tests for ChangePasswordUseCase, DeleteAccountUseCase, FinalizeAccountDeletionUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.application.dto.account_settings_dto import ChangePasswordInput, RequestAccountDeletionInput
from app.application.use_cases.account_settings_usecase import (
    ChangePasswordUseCase,
    DeleteAccountUseCase,
    FinalizeAccountDeletionUseCase,
)
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


def _make_repo(*, user=None, security=None, updated=True, scheduled_user=None) -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=security)
    repo.update_password = AsyncMock(return_value=updated)
    repo.schedule_account_deletion = AsyncMock(return_value=scheduled_user)
    repo.finalize_account_deletion = AsyncMock(return_value=True)
    return repo


# ─── ChangePasswordUseCase ────────────────────────────────────────────────────


class TestChangePasswordUseCase:
    def _data(self, current="current", new="newpass") -> ChangePasswordInput:
        return ChangePasswordInput(user_id=USER_ID, current_password=current, new_password=new)

    def _make_uc(self, repo):
        return ChangePasswordUseCase(repo=repo, db=AsyncMock())

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = self._make_uc(repo)
        with (
            patch("app.application.use_cases.account_settings_usecase.verify_hash", side_effect=[True, False]),
            patch("app.application.use_cases.account_settings_usecase.hash_string", return_value="new_hash"),
            patch("app.application.use_cases.account_settings_usecase.RefreshTokenRepository") as MockRepo,
        ):
            MockRepo.return_value = AsyncMock()
            await uc.change_password(self._data())
        repo.update_password.assert_awaited_once_with(USER_ID, "new_hash")

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        uc = self._make_uc(_make_repo(user=None))
        with pytest.raises(UserNotFoundError):
            await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        uc = self._make_uc(_make_repo(user=_make_user(status=UserStatus.INACTIVE)))
        with pytest.raises(UserInactiveError):
            await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        uc = self._make_uc(_make_repo(user=_make_user(status=UserStatus.DELETED)))
        with pytest.raises(UserInactiveError):
            await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_email_not_verified(self):
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        uc = self._make_uc(repo)
        with pytest.raises(EmailNotVerifiedError):
            await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_no_security_record(self):
        repo = _make_repo(user=_make_user(), security=None)
        uc = self._make_uc(repo)
        with pytest.raises(EmailNotVerifiedError):
            await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_wrong_current_password(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = self._make_uc(repo)
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=False):
            with pytest.raises(InvalidCredentialsError):
                await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_same_password(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        uc = self._make_uc(repo)
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=True):
            with pytest.raises(SamePasswordError):
                await uc.change_password(self._data())

    @pytest.mark.asyncio
    async def test_update_returns_false_raises_not_found(self):
        repo = _make_repo(user=_make_user(), security=_make_security(), updated=False)
        uc = self._make_uc(repo)
        with (
            patch("app.application.use_cases.account_settings_usecase.verify_hash", side_effect=[True, False]),
            patch("app.application.use_cases.account_settings_usecase.hash_string", return_value="new_hash"),
        ):
            with pytest.raises(UserNotFoundError):
                await uc.change_password(self._data())


# ─── DeleteAccountUseCase ─────────────────────────────────────────────────────


class TestDeleteAccountUseCase:
    def _self_data(self, password="correct") -> RequestAccountDeletionInput:
        return RequestAccountDeletionInput(target_user_id=USER_ID, requested_by=USER_ID, current_password=password)

    def _admin_data(self) -> RequestAccountDeletionInput:
        return RequestAccountDeletionInput(target_user_id=USER_ID, requested_by=ADMIN_ID)

    def _make_uc(self, repo):
        return DeleteAccountUseCase(repo=repo, arq=AsyncMock())

    def _make_scheduled_user(self):
        u = MagicMock()
        u.id = USER_ID
        u.deletion_requested_by = ADMIN_ID
        u.deletion_requested_at = datetime.now(UTC).replace(tzinfo=None)
        u.deletion_scheduled_for = datetime.now(UTC).replace(tzinfo=None) + timedelta(days=30)
        return u

    @pytest.mark.asyncio
    async def test_self_service_success(self):
        scheduled = self._make_scheduled_user()
        repo = _make_repo(user=_make_user(), scheduled_user=scheduled)
        arq = AsyncMock()
        uc = DeleteAccountUseCase(repo=repo, arq=arq)
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=True):
            result = await uc.request_self_service_deletion(self._self_data())
        assert result.user_id == USER_ID
        arq.enqueue_job.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_self_service_user_not_found(self):
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user=None)).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_inactive_user(self):
        with pytest.raises(UserInactiveError):
            await self._make_uc(_make_repo(user=_make_user(status=UserStatus.INACTIVE))).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_already_scheduled(self):
        user = _make_user(deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=10))
        with pytest.raises(AccountDeletionAlreadyScheduledError):
            await self._make_uc(_make_repo(user=user)).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_grace_expired(self):
        user = _make_user(deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) - timedelta(seconds=1))
        with pytest.raises(AccountDeletionGracePeriodExpiredError):
            await self._make_uc(_make_repo(user=user)).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_self_service_wrong_password(self):
        repo = _make_repo(user=_make_user())
        with patch("app.application.use_cases.account_settings_usecase.verify_hash", return_value=False):
            with pytest.raises(InvalidCredentialsError):
                await self._make_uc(repo).request_self_service_deletion(self._self_data())

    @pytest.mark.asyncio
    async def test_admin_deletion_success(self):
        scheduled = self._make_scheduled_user()
        repo = _make_repo(user=_make_user(), scheduled_user=scheduled)
        arq = AsyncMock()
        uc = DeleteAccountUseCase(repo=repo, arq=arq)
        result = await uc.request_admin_deletion(self._admin_data())
        assert result.user_id == USER_ID
        arq.enqueue_job.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_admin_deletion_user_not_found(self):
        with pytest.raises(UserNotFoundError):
            await self._make_uc(_make_repo(user=None)).request_admin_deletion(self._admin_data())

    @pytest.mark.asyncio
    async def test_admin_deletion_inactive_user(self):
        with pytest.raises(UserInactiveError):
            await self._make_uc(_make_repo(user=_make_user(status=UserStatus.INACTIVE))).request_admin_deletion(self._admin_data())

    @pytest.mark.asyncio
    async def test_schedule_fails_fallback_already_scheduled(self):
        future_user = _make_user(deletion_scheduled_for=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=5))
        repo = _make_repo(user=_make_user(), scheduled_user=None)
        repo.get_by_id = AsyncMock(side_effect=[_make_user(), future_user])
        with pytest.raises(AccountDeletionAlreadyScheduledError):
            await self._make_uc(repo).request_admin_deletion(self._admin_data())


# ─── FinalizeAccountDeletionUseCase ───────────────────────────────────────────


class TestFinalizeAccountDeletionUseCase:
    @pytest.mark.asyncio
    async def test_returns_true_when_finalized(self):
        repo = _make_repo()
        result = await FinalizeAccountDeletionUseCase(repo=repo).execute(
            user_id=str(USER_ID),
            requested_at=datetime.now(UTC).isoformat(),
            scheduled_for=datetime.now(UTC).isoformat(),
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_already_canceled(self):
        repo = _make_repo()
        repo.finalize_account_deletion = AsyncMock(return_value=False)
        result = await FinalizeAccountDeletionUseCase(repo=repo).execute(
            user_id=str(USER_ID),
            requested_at=datetime.now(UTC).isoformat(),
            scheduled_for=datetime.now(UTC).isoformat(),
        )
        assert result is False
