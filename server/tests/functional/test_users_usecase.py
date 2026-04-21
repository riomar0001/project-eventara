"""Functional test cases for AdminUserAccountUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.users_dto import (
    ChangeUserEmailInput,
    ChangeUserRoleInput,
    ListUserAccountsInput,
    SendUserPasswordResetInput,
)
from app.application.use_cases.users_usecase import AdminUserAccountUseCase
from app.domain.entities.authorization_entities import Role
from app.domain.entities.user_entity import User, UserSecurity, UserStatus
from app.domain.exceptions.role_exceptions import RoleAlreadyCurrentError, RoleNotFoundError
from app.domain.exceptions.user_exceptions import (
    EmailAlreadyTakenError,
    PasswordResetEmailNotVerifiedError,
    SameEmailError,
    UserInactiveError,
    UserNotFoundError,
)

USER_ID = uuid.uuid4()
ROLE_ID = uuid.uuid4()
ADMIN_ID = uuid.uuid4()
USER_EMAIL = "user@example.com"
NEW_EMAIL = "new@example.com"


def _make_user(*, status=UserStatus.ACTIVE, email=USER_EMAIL) -> User:
    return User(id=USER_ID, email=email, password="hashed", status=status)


def _make_security(*, email_verified=True) -> UserSecurity:
    return UserSecurity(user_id=USER_ID, email_verified=email_verified)


def _make_role(*, role_id=None) -> Role:
    role = MagicMock(spec=Role)
    role.id = role_id or ROLE_ID
    role.name = "admin"
    role.description = "Admin role"
    role.is_default = False
    role.is_system = True
    return role


def _make_user_repo(*, user=None, updated_user=None, detail=None, users=None):
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_by_id_for_update = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=None)
    repo.list_admin_user_accounts = AsyncMock(return_value=(users or [], 0))
    repo.get_admin_user_account_detail = AsyncMock(return_value=detail)
    repo.update_email_and_clear_verification = AsyncMock(return_value=updated_user)
    return repo


def _make_role_repo(*, locked=True, role=None, permissions=None, assignments=None, roles=None):
    repo = MagicMock()
    repo.lock_user = AsyncMock(return_value=locked)
    repo.get_role_by_id = AsyncMock(return_value=role)
    repo.get_role_permissions = AsyncMock(return_value=permissions or [])
    repo.get_active_assignments_for_user = AsyncMock(return_value=assignments or [])
    repo.replace_active_assignments = AsyncMock()
    repo.list_roles = AsyncMock(return_value=roles or [])
    repo.list_role_permissions = AsyncMock(return_value={})
    return repo


def _make_uc(*, user_repo=None, role_repo=None, pr_repo=None) -> AdminUserAccountUseCase:
    pr = pr_repo or AsyncMock()
    pr.store = AsyncMock()
    return AdminUserAccountUseCase(
        user_repo=user_repo or _make_user_repo(),
        role_repo=role_repo or _make_role_repo(),
        db=AsyncMock(), arq=AsyncMock(), password_reset_repo=pr,
    )


# ─── list_user_accounts ───────────────────────────────────────────────────────

class TestListUserAccounts:
    @pytest.mark.asyncio
    async def test_returns_paginated_results(self):
        """Returns the current page of users with total count and page metadata"""
        users = [MagicMock(), MagicMock()]
        user_repo = _make_user_repo(users=users)
        user_repo.list_admin_user_accounts = AsyncMock(return_value=(users, 2))
        result = await _make_uc(user_repo=user_repo).list_user_accounts(ListUserAccountsInput(page=1, page_size=10))
        assert result.total_count == 2 and result.users == users and result.total_pages == 1

    @pytest.mark.asyncio
    async def test_total_pages_calculated_correctly(self):
        """Calculates total_pages using ceiling division of total_count / page_size"""
        user_repo = _make_user_repo()
        user_repo.list_admin_user_accounts = AsyncMock(return_value=([], 25))
        result = await _make_uc(user_repo=user_repo).list_user_accounts(ListUserAccountsInput(page=1, page_size=10))
        assert result.total_pages == 3

    @pytest.mark.asyncio
    async def test_zero_total_gives_zero_pages(self):
        """Returns total_pages=0 when no users exist"""
        user_repo = _make_user_repo()
        user_repo.list_admin_user_accounts = AsyncMock(return_value=([], 0))
        result = await _make_uc(user_repo=user_repo).list_user_accounts(ListUserAccountsInput(page=1, page_size=10))
        assert result.total_pages == 0

    @pytest.mark.asyncio
    async def test_passes_filters_to_repo(self):
        """Forwards all filter parameters (search, status, role_name) directly to the repository"""
        user_repo = _make_user_repo()
        user_repo.list_admin_user_accounts = AsyncMock(return_value=([], 0))
        await _make_uc(user_repo=user_repo).list_user_accounts(
            ListUserAccountsInput(page=2, page_size=5, search="mario", status=UserStatus.ACTIVE, role_name="admin")
        )
        user_repo.list_admin_user_accounts.assert_awaited_once_with(
            page=2, page_size=5, search="mario", status=UserStatus.ACTIVE, role_name="admin"
        )


# ─── get_user_account_detail ──────────────────────────────────────────────────

class TestGetUserAccountDetail:
    @pytest.mark.asyncio
    async def test_success_without_role(self):
        """Returns the admin detail view without fetching role permissions when role is unassigned"""
        detail = MagicMock()
        detail.role_id = None
        result = await _make_uc(user_repo=_make_user_repo(detail=detail)).get_user_account_detail(USER_ID)
        assert result is detail

    @pytest.mark.asyncio
    async def test_success_fetches_role_permissions(self):
        """Enriches the detail with role permissions when a role is assigned"""
        role_id = uuid.uuid4()
        detail = MagicMock()
        detail.role_id = role_id
        detail.role_permissions = []
        role_repo = _make_role_repo(permissions=["perm1"])
        result = await _make_uc(user_repo=_make_user_repo(detail=detail), role_repo=role_repo).get_user_account_detail(USER_ID)
        role_repo.get_role_permissions.assert_awaited_once_with(role_id)
        assert result.role_permissions == ["perm1"]

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the given ID"""
        with pytest.raises(UserNotFoundError):
            await _make_uc(user_repo=_make_user_repo(detail=None)).get_user_account_detail(USER_ID)


# ─── list_roles ───────────────────────────────────────────────────────────────

class TestListRoles:
    @pytest.mark.asyncio
    async def test_returns_roles_with_permissions(self):
        """Returns all assignable roles each enriched with their permission set"""
        role = _make_role()
        role_repo = _make_role_repo(roles=[role])
        role_repo.list_role_permissions = AsyncMock(return_value={role.id: ["perm"]})
        result = await _make_uc(role_repo=role_repo).list_roles()
        assert len(result.roles) == 1 and result.roles[0].permissions == ["perm"]

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_roles(self):
        """Returns an empty list when no roles are defined"""
        result = await _make_uc(role_repo=_make_role_repo(roles=[])).list_roles()
        assert result.roles == []


# ─── change_role ──────────────────────────────────────────────────────────────

class TestChangeRole:
    def _data(self, role_id=None) -> ChangeUserRoleInput:
        return ChangeUserRoleInput(user_id=USER_ID, role_id=role_id or ROLE_ID, changed_by=ADMIN_ID)

    @pytest.mark.asyncio
    async def test_success(self):
        """Replaces the user's role, revokes refresh tokens, commits, and returns the new role"""
        role = _make_role()
        with patch("app.application.use_cases.users_usecase.RefreshTokenRepository", return_value=AsyncMock()):
            result = await _make_uc(
                user_repo=_make_user_repo(user=_make_user()),
                role_repo=_make_role_repo(locked=True, role=role, assignments=[])
            ).change_role(self._data())
        assert result.role_id == role.id

    @pytest.mark.asyncio
    async def test_lock_fails_raises_user_not_found(self):
        """Raises UserNotFoundError immediately when the row lock cannot be acquired"""
        with pytest.raises(UserNotFoundError):
            await _make_uc(role_repo=_make_role_repo(locked=False)).change_role(self._data())

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when the account does not exist after acquiring the lock"""
        with pytest.raises(UserNotFoundError):
            await _make_uc(
                user_repo=_make_user_repo(user=None),
                role_repo=_make_role_repo(locked=True)
            ).change_role(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when the target account is deactivated"""
        with pytest.raises(UserInactiveError):
            await _make_uc(
                user_repo=_make_user_repo(user=_make_user(status=UserStatus.INACTIVE)),
                role_repo=_make_role_repo(locked=True)
            ).change_role(self._data())

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        """Raises UserInactiveError when the target account is soft-deleted"""
        with pytest.raises(UserInactiveError):
            await _make_uc(
                user_repo=_make_user_repo(user=_make_user(status=UserStatus.DELETED)),
                role_repo=_make_role_repo(locked=True)
            ).change_role(self._data())

    @pytest.mark.asyncio
    async def test_role_not_found(self):
        """Raises RoleNotFoundError when the requested replacement role does not exist"""
        with pytest.raises(RoleNotFoundError):
            await _make_uc(
                user_repo=_make_user_repo(user=_make_user()),
                role_repo=_make_role_repo(locked=True, role=None)
            ).change_role(self._data())

    @pytest.mark.asyncio
    async def test_role_already_current(self):
        """Raises RoleAlreadyCurrentError when the user already holds the requested role as their only assignment"""
        role = _make_role()
        assignment = MagicMock()
        assignment.role_id = role.id
        with pytest.raises(RoleAlreadyCurrentError):
            await _make_uc(
                user_repo=_make_user_repo(user=_make_user()),
                role_repo=_make_role_repo(locked=True, role=role, assignments=[assignment])
            ).change_role(self._data(role_id=role.id))

    @pytest.mark.asyncio
    async def test_rolls_back_on_exception(self):
        """Rolls back the transaction and re-raises when an unexpected error occurs during role replacement"""
        role_repo = _make_role_repo(locked=True, role=_make_role(), assignments=[])
        role_repo.replace_active_assignments = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        uc = AdminUserAccountUseCase(
            user_repo=_make_user_repo(user=_make_user()), role_repo=role_repo,
            db=db, arq=AsyncMock(), password_reset_repo=AsyncMock()
        )
        with pytest.raises(RuntimeError):
            await uc.change_role(self._data())
        db.rollback.assert_awaited_once()


# ─── change_email ─────────────────────────────────────────────────────────────

class TestChangeEmail:
    def _data(self, email=NEW_EMAIL) -> ChangeUserEmailInput:
        return ChangeUserEmailInput(user_id=USER_ID, email=email, changed_by=ADMIN_ID)

    @pytest.mark.asyncio
    async def test_success(self):
        """Updates the email, clears verification, sends a new verification link, and returns the updated email"""
        updated = _make_user(email=NEW_EMAIL)
        updated.id = USER_ID
        user_repo = _make_user_repo(user=_make_user(), updated_user=updated)
        with (patch("app.application.use_cases.users_usecase.verification_token", return_value="vtok"),
              patch("app.application.use_cases.users_usecase.send_email", new_callable=AsyncMock),
              patch("app.application.use_cases.users_usecase.RefreshTokenRepository", return_value=AsyncMock())):
            result = await _make_uc(user_repo=user_repo).change_email(self._data())
        assert result.email == NEW_EMAIL

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the given ID"""
        user_repo = _make_user_repo(user=None)
        user_repo.get_by_id_for_update = AsyncMock(return_value=None)
        with pytest.raises(UserNotFoundError):
            await _make_uc(user_repo=user_repo).change_email(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when the account is deactivated"""
        with pytest.raises(UserInactiveError):
            await _make_uc(user_repo=_make_user_repo(user=_make_user(status=UserStatus.INACTIVE))).change_email(self._data())

    @pytest.mark.asyncio
    async def test_same_email_raises(self):
        """Raises SameEmailError when the new email matches the current address"""
        with pytest.raises(SameEmailError):
            await _make_uc(user_repo=_make_user_repo(user=_make_user(email=USER_EMAIL))).change_email(self._data(email=USER_EMAIL))

    @pytest.mark.asyncio
    async def test_same_email_case_insensitive(self):
        """Raises SameEmailError even when the casing of the address differs"""
        with pytest.raises(SameEmailError):
            await _make_uc(user_repo=_make_user_repo(user=_make_user(email=USER_EMAIL))).change_email(self._data(email=USER_EMAIL.upper()))

    @pytest.mark.asyncio
    async def test_integrity_error_raises_email_taken(self):
        """Raises EmailAlreadyTakenError and rolls back when the new email belongs to another account"""
        user_repo = _make_user_repo(user=_make_user())
        user_repo.update_email_and_clear_verification = AsyncMock(
            side_effect=IntegrityError(None, None, Exception("unique_email"))
        )
        with (patch("app.application.use_cases.users_usecase.RefreshTokenRepository", return_value=AsyncMock()),
              pytest.raises(EmailAlreadyTakenError)):
            await _make_uc(user_repo=user_repo).change_email(self._data())

    @pytest.mark.asyncio
    async def test_rolls_back_on_exception(self):
        """Rolls back the transaction and re-raises on any unexpected database error"""
        user_repo = _make_user_repo(user=_make_user())
        user_repo.update_email_and_clear_verification = AsyncMock(side_effect=RuntimeError("db error"))
        db = AsyncMock()
        uc = AdminUserAccountUseCase(
            user_repo=user_repo, role_repo=_make_role_repo(),
            db=db, arq=AsyncMock(), password_reset_repo=AsyncMock()
        )
        with pytest.raises(RuntimeError):
            await uc.change_email(self._data())
        db.rollback.assert_awaited_once()


# ─── send_password_reset ──────────────────────────────────────────────────────

class TestSendPasswordReset:
    def _data(self) -> SendUserPasswordResetInput:
        return SendUserPasswordResetInput(user_id=USER_ID, requested_by=ADMIN_ID)

    @pytest.mark.asyncio
    async def test_success(self):
        """Generates a reset token, stores it in Redis, and sends a password-reset email"""
        user_repo = _make_user_repo(user=_make_user())
        user_repo.get_security_by_user_id = AsyncMock(return_value=_make_security())
        pr_repo = AsyncMock()
        pr_repo.store = AsyncMock()
        with (patch("app.application.use_cases.users_usecase.create_password_reset_token", return_value="rst"),
              patch("app.application.use_cases.users_usecase.send_email", new_callable=AsyncMock) as mock_send):
            await _make_uc(user_repo=user_repo, pr_repo=pr_repo).send_password_reset(self._data())
        mock_send.assert_awaited_once()
        pr_repo.store.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        """Raises UserNotFoundError when no account exists for the given ID"""
        with pytest.raises(UserNotFoundError):
            await _make_uc(user_repo=_make_user_repo(user=None)).send_password_reset(self._data())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        """Raises UserInactiveError when the target account is deactivated"""
        with pytest.raises(UserInactiveError):
            await _make_uc(user_repo=_make_user_repo(user=_make_user(status=UserStatus.INACTIVE))).send_password_reset(self._data())

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        """Raises UserInactiveError when the target account is soft-deleted"""
        with pytest.raises(UserInactiveError):
            await _make_uc(user_repo=_make_user_repo(user=_make_user(status=UserStatus.DELETED))).send_password_reset(self._data())

    @pytest.mark.asyncio
    async def test_no_security_record_raises(self):
        """Raises PasswordResetEmailNotVerifiedError when no security record exists for the account"""
        user_repo = _make_user_repo(user=_make_user())
        user_repo.get_security_by_user_id = AsyncMock(return_value=None)
        with pytest.raises(PasswordResetEmailNotVerifiedError):
            await _make_uc(user_repo=user_repo).send_password_reset(self._data())

    @pytest.mark.asyncio
    async def test_email_not_verified_raises(self):
        """Raises PasswordResetEmailNotVerifiedError when the account email is unconfirmed"""
        user_repo = _make_user_repo(user=_make_user())
        user_repo.get_security_by_user_id = AsyncMock(return_value=_make_security(email_verified=False))
        with pytest.raises(PasswordResetEmailNotVerifiedError):
            await _make_uc(user_repo=user_repo).send_password_reset(self._data())
