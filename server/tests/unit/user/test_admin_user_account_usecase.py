import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.admin_user_account_dto import (
    AdminUserAccountDetail,
    AdminUserAccountSummary,
    ChangeUserEmailInput,
    ChangeUserRoleInput,
    ListUserAccountsInput,
    SendUserPasswordResetInput,
)
from app.application.use_cases.admin_user_account_usecase import AdminUserAccountUseCase
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.authorization_entities import UserRole as UserRoleEntity
from app.domain.entities.user_entity import User, UserSecurity, UserStatus
from app.domain.exceptions.role_exceptions import RoleAlreadyCurrentError
from app.domain.exceptions.user_exceptions import (
    EmailAlreadyTakenError,
    PasswordResetEmailNotVerifiedError,
    SameEmailError,
    UserNotFoundError,
)

MODULE = "app.application.use_cases.admin_user_account_usecase"


def make_user(*, email: str = "user@example.com", status: UserStatus = UserStatus.ACTIVE) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password="hashed_password",
        status=status,
    )


def make_security(*, email_verified: bool = True) -> UserSecurity:
    return UserSecurity(
        user_id=uuid.uuid4(),
        email_verified=email_verified,
    )


def make_use_case(
    *,
    user_repo: MagicMock | None = None,
    role_repo: MagicMock | None = None,
    password_reset_repo: AsyncMock | None = None,
    db: AsyncMock | None = None,
) -> AdminUserAccountUseCase:
    return AdminUserAccountUseCase(
        user_repo=user_repo or MagicMock(),
        role_repo=role_repo or MagicMock(),
        db=db or AsyncMock(),
        arq=AsyncMock(),
        password_reset_repo=password_reset_repo or AsyncMock(),
    )


class TestAdminUserAccountUseCase:
    async def test_list_user_accounts_returns_expected_pagination(self):
        summary = AdminUserAccountSummary(
            user_id=uuid.uuid4(),
            name="Jane Doe",
            email="jane@example.com",
            role_id=None,
            role_name="participant",
            status=UserStatus.ACTIVE,
        )
        user_repo = MagicMock()
        user_repo.list_admin_user_accounts = AsyncMock(return_value=([summary], 11))

        use_case = make_use_case(user_repo=user_repo)

        result = await use_case.list_user_accounts(ListUserAccountsInput(page=2, page_size=10))

        assert result.total_count == 11
        assert result.total_pages == 2
        assert result.page == 2
        assert result.users == [summary]

    async def test_get_user_account_detail_raises_not_found(self):
        user_repo = MagicMock()
        user_repo.get_admin_user_account_detail = AsyncMock(return_value=None)

        use_case = make_use_case(user_repo=user_repo)

        with pytest.raises(UserNotFoundError):
            await use_case.get_user_account_detail(uuid.uuid4())

    async def test_change_role_replaces_assignments_and_revokes_tokens(self):
        user = make_user()
        role_id = uuid.uuid4()
        role_repo = MagicMock()
        role_repo.lock_user = AsyncMock(return_value=True)
        role_repo.get_role_by_id = AsyncMock(
            return_value=RoleEntity(
                id=role_id,
                name="system_administrator",
                description=None,
                is_default=False,
                is_system=True,
            )
        )
        role_repo.get_active_assignments_for_user = AsyncMock(
            return_value=[
                UserRoleEntity(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    role_id=uuid.uuid4(),
                    assigned_by=uuid.uuid4(),
                    assigned_at=datetime.now(timezone.utc),
                )
            ]
        )
        role_repo.replace_active_assignments = AsyncMock()
        user_repo = MagicMock()
        user_repo.get_by_id = AsyncMock(return_value=user)
        db = AsyncMock()
        token_repo = MagicMock()
        token_repo.stage_revoke_all_for_user = AsyncMock(return_value=1)

        use_case = make_use_case(user_repo=user_repo, role_repo=role_repo, db=db)

        with patch(f"{MODULE}.RefreshTokenRepository", return_value=token_repo):
            result = await use_case.change_role(
                ChangeUserRoleInput(
                    user_id=user.id,
                    role_id=role_id,
                    changed_by=uuid.uuid4(),
                )
            )

        assert result.user_id == user.id
        assert result.role_id == role_id
        role_repo.replace_active_assignments.assert_awaited_once()
        token_repo.stage_revoke_all_for_user.assert_awaited_once_with(user.id)
        db.commit.assert_awaited_once()

    async def test_change_role_raises_conflict_when_same_single_role(self):
        user = make_user()
        role_id = uuid.uuid4()
        role_repo = MagicMock()
        role_repo.lock_user = AsyncMock(return_value=True)
        role_repo.get_role_by_id = AsyncMock(
            return_value=RoleEntity(
                id=role_id,
                name="participant",
                description=None,
                is_default=True,
                is_system=False,
            )
        )
        role_repo.get_active_assignments_for_user = AsyncMock(
            return_value=[
                UserRoleEntity(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    role_id=role_id,
                    assigned_by=uuid.uuid4(),
                    assigned_at=datetime.now(timezone.utc),
                )
            ]
        )
        user_repo = MagicMock()
        user_repo.get_by_id = AsyncMock(return_value=user)
        db = AsyncMock()

        use_case = make_use_case(user_repo=user_repo, role_repo=role_repo, db=db)

        with pytest.raises(RoleAlreadyCurrentError):
            await use_case.change_role(
                ChangeUserRoleInput(
                    user_id=user.id,
                    role_id=role_id,
                    changed_by=uuid.uuid4(),
                )
            )

        db.rollback.assert_awaited_once()

    async def test_change_email_updates_email_revokes_tokens_and_sends_verification(self):
        current_user = make_user(email="old@example.com")
        updated_user = make_user(email="new@example.com")
        updated_user.id = current_user.id
        user_repo = MagicMock()
        user_repo.get_by_id_for_update = AsyncMock(return_value=current_user)
        user_repo.update_email_and_clear_verification = AsyncMock(return_value=updated_user)
        db = AsyncMock()
        token_repo = MagicMock()
        token_repo.stage_revoke_all_for_user = AsyncMock(return_value=1)

        use_case = make_use_case(user_repo=user_repo, db=db)

        with (
            patch(f"{MODULE}.RefreshTokenRepository", return_value=token_repo),
            patch(f"{MODULE}.verification_token", return_value="verify-token"),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send_email,
        ):
            result = await use_case.change_email(
                ChangeUserEmailInput(
                    user_id=current_user.id,
                    email="new@example.com",
                    changed_by=uuid.uuid4(),
                )
            )

        assert result.email == "new@example.com"
        token_repo.stage_revoke_all_for_user.assert_awaited_once_with(current_user.id)
        db.commit.assert_awaited_once()
        mock_send_email.assert_awaited_once()

    async def test_change_email_raises_same_email(self):
        current_user = make_user(email="same@example.com")
        user_repo = MagicMock()
        user_repo.get_by_id_for_update = AsyncMock(return_value=current_user)
        db = AsyncMock()

        use_case = make_use_case(user_repo=user_repo, db=db)

        with pytest.raises(SameEmailError):
            await use_case.change_email(
                ChangeUserEmailInput(
                    user_id=current_user.id,
                    email="same@example.com",
                    changed_by=uuid.uuid4(),
                )
            )

        db.rollback.assert_awaited_once()

    async def test_change_email_maps_integrity_error_to_email_already_taken(self):
        current_user = make_user(email="old@example.com")
        user_repo = MagicMock()
        user_repo.get_by_id_for_update = AsyncMock(return_value=current_user)
        user_repo.update_email_and_clear_verification = AsyncMock(
            side_effect=IntegrityError("stmt", "params", Exception("duplicate key"))
        )
        db = AsyncMock()

        use_case = make_use_case(user_repo=user_repo, db=db)

        with pytest.raises(EmailAlreadyTakenError):
            await use_case.change_email(
                ChangeUserEmailInput(
                    user_id=current_user.id,
                    email="taken@example.com",
                    changed_by=uuid.uuid4(),
                )
            )

        db.rollback.assert_awaited_once()

    async def test_send_password_reset_sends_email_for_verified_user(self):
        user = make_user()
        security = make_security(email_verified=True)
        security.user_id = user.id
        user_repo = MagicMock()
        user_repo.get_by_id = AsyncMock(return_value=user)
        user_repo.get_security_by_user_id = AsyncMock(return_value=security)
        password_reset_repo = AsyncMock()

        use_case = make_use_case(user_repo=user_repo, password_reset_repo=password_reset_repo)

        with (
            patch(f"{MODULE}.create_password_reset_token", return_value="reset-token"),
            patch(f"{MODULE}.send_email", new_callable=AsyncMock) as mock_send_email,
        ):
            await use_case.send_password_reset(
                SendUserPasswordResetInput(
                    user_id=user.id,
                    requested_by=uuid.uuid4(),
                )
            )

        password_reset_repo.store.assert_awaited_once_with(user.id, "reset-token")
        mock_send_email.assert_awaited_once()

    async def test_send_password_reset_raises_when_email_is_not_verified(self):
        user = make_user()
        security = make_security(email_verified=False)
        security.user_id = user.id
        user_repo = MagicMock()
        user_repo.get_by_id = AsyncMock(return_value=user)
        user_repo.get_security_by_user_id = AsyncMock(return_value=security)

        use_case = make_use_case(user_repo=user_repo)

        with pytest.raises(PasswordResetEmailNotVerifiedError):
            await use_case.send_password_reset(
                SendUserPasswordResetInput(
                    user_id=user.id,
                    requested_by=uuid.uuid4(),
                )
            )
