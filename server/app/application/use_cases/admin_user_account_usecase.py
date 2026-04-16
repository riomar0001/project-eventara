"""Administrative user-account application services.

This module implements the account-management operations used by the new admin
UI: paginated listing, detailed inspection, role replacement, email changes,
role catalog retrieval, and password-reset dispatch.

Concurrency strategy:
    Role changes lock the target user row before inspecting active assignments,
    then replace all effective assignments and revoke refresh tokens inside one
    transaction so concurrent administrators cannot leave competing current
    roles behind.

    Email changes lock the target user row with ``SELECT ... FOR UPDATE``,
    stage the email update and verification reset, and rely on the database's
    unique-email constraint as the final guard against races. Refresh tokens are
    revoked in the same transaction to ensure the account state and session
    invalidation commit together.

    Password reset dispatch reuses the Redis-backed single-token flow already
    used by self-service password recovery. Storing a new token atomically
    overwrites any previously pending reset link for the same user.
"""

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.admin_user_account_dto import (
    AdminUserAccountDetail,
    ChangeUserEmailInput,
    ChangeUserEmailOutput,
    ChangeUserRoleInput,
    ChangeUserRoleOutput,
    ListAssignableRolesOutput,
    ListUserAccountsInput,
    ListUserAccountsOutput,
    SendUserPasswordResetInput,
)
from app.application.interfaces.role_interface import IRoleRepository
from app.application.interfaces.user_interface import IUserRepository
from app.domain.entities.user_entity import UserStatus
from app.domain.exceptions.role_exceptions import RoleAlreadyCurrentError, RoleNotFoundError
from app.domain.exceptions.user_exceptions import (
    EmailAlreadyTakenError,
    PasswordResetEmailNotVerifiedError,
    SameEmailError,
    UserInactiveError,
    UserNotFoundError,
)
from app.infrastructure.cache.repositories.password_reset_repository import PasswordResetRepository
from app.infrastructure.database.repositories.refresh_token_repository import RefreshTokenRepository
from app.infrastructure.messaging.auth_email_templates import reset_password_email_html
from app.infrastructure.messaging.email import send_email, verification_email_html
from app.core.security.token_service import create_password_reset_token, verification_token


class AdminUserAccountUseCase:
    """Provides administrative management operations for user accounts.

    The use case is intentionally narrow: it exposes only the user-facing admin
    actions required by the management table and detail sheet while delegating
    data access and locking primitives to repositories.
    """

    def __init__(
        self,
        user_repo: IUserRepository,
        role_repo: IRoleRepository,
        db: AsyncSession,
        arq,
        password_reset_repo: PasswordResetRepository,
    ) -> None:
        self.user_repo = user_repo
        self.role_repo = role_repo
        self.db = db
        self.arq = arq
        self.password_reset_repo = password_reset_repo

    async def list_user_accounts(self, data: ListUserAccountsInput) -> ListUserAccountsOutput:
        """Return one page of user-account summaries for the admin table.

        Args:
            data: Pagination input carrying the one-based page index and page size.

        Returns:
            A ``ListUserAccountsOutput`` containing the current page of users and
            aggregate pagination metadata.
        """
        users, total_count = await self.user_repo.list_admin_user_accounts(page=data.page, page_size=data.page_size)
        total_pages = (total_count + data.page_size - 1) // data.page_size if total_count > 0 else 0
        return ListUserAccountsOutput(
            users=users,
            total_count=total_count,
            page=data.page,
            page_size=data.page_size,
            total_pages=total_pages,
        )

    async def get_user_account_detail(self, user_id) -> AdminUserAccountDetail:
        """Return the full administrative detail payload for a single account.

        Args:
            user_id: The target account identifier.

        Returns:
            The detailed admin view of the account.

        Raises:
            UserNotFoundError: The target account does not exist.
        """
        detail = await self.user_repo.get_admin_user_account_detail(user_id)
        if detail is None:
            raise UserNotFoundError(str(user_id))
        return detail

    async def list_roles(self) -> ListAssignableRolesOutput:
        """Return the role catalog exposed in the admin change-role dialog."""
        return ListAssignableRolesOutput(roles=await self.role_repo.list_roles())

    async def change_role(self, data: ChangeUserRoleInput) -> ChangeUserRoleOutput:
        """Replace a user's current effective role with a single new role.

        Args:
            data: The target user, replacement role, and administrator identity.

        Returns:
            A ``ChangeUserRoleOutput`` describing the new effective role.

        Raises:
            UserNotFoundError: The target account does not exist.
            UserInactiveError: The target account is inactive or deleted.
            RoleNotFoundError: The requested replacement role does not exist.
            RoleAlreadyCurrentError: The requested role is already the user's only
                current effective role.
        """
        try:
            locked = await self.role_repo.lock_user(data.user_id)
            if not locked:
                raise UserNotFoundError(str(data.user_id))

            user = await self.user_repo.get_by_id(data.user_id)
            if user is None:
                raise UserNotFoundError(str(data.user_id))

            if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
                raise UserInactiveError()

            role = await self.role_repo.get_role_by_id(data.role_id)
            if role is None:
                raise RoleNotFoundError(str(data.role_id))

            active_assignments = await self.role_repo.get_active_assignments_for_user(data.user_id)
            if len(active_assignments) == 1 and active_assignments[0].role_id == data.role_id:
                raise RoleAlreadyCurrentError()

            await self.role_repo.replace_active_assignments(
                user_id=data.user_id,
                role_id=data.role_id,
                assigned_by=data.changed_by,
            )
            await RefreshTokenRepository(self.db).stage_revoke_all_for_user(data.user_id)
            await self.db.commit()
            return ChangeUserRoleOutput(
                user_id=data.user_id,
                role_id=role.id,
                role_name=role.name,
            )
        except Exception:
            await self.db.rollback()
            raise

    async def change_email(self, data: ChangeUserEmailInput) -> ChangeUserEmailOutput:
        """Update a user's email, clear verification state, and send a new verification link.

        Args:
            data: The target user, replacement email address, and administrator identity.

        Returns:
            A ``ChangeUserEmailOutput`` containing the persisted email value.

        Raises:
            UserNotFoundError: The target account does not exist.
            UserInactiveError: The target account is inactive or deleted.
            SameEmailError: The replacement email matches the current address.
            EmailAlreadyTakenError: Another account already owns the requested email.
        """
        try:
            locked_user = await self.user_repo.get_by_id_for_update(data.user_id)
            if locked_user is None:
                raise UserNotFoundError(str(data.user_id))

            if locked_user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
                raise UserInactiveError()

            if locked_user.email.lower() == data.email.lower():
                raise SameEmailError()

            updated_user = await self.user_repo.update_email_and_clear_verification(data.user_id, data.email)
            if updated_user is None:
                raise UserNotFoundError(str(data.user_id))

            await RefreshTokenRepository(self.db).stage_revoke_all_for_user(data.user_id)
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise EmailAlreadyTakenError(data.email) from exc
        except Exception:
            await self.db.rollback()
            raise

        verify_token = verification_token(updated_user.id, updated_user.email)
        await send_email(
            self.arq,
            to=updated_user.email,
            subject="Verify your updated Eventara email",
            html=verification_email_html(verify_token),
        )
        return ChangeUserEmailOutput(user_id=updated_user.id, email=updated_user.email)

    async def send_password_reset(self, data: SendUserPasswordResetInput) -> None:
        """Send a reset-password link to the target user's verified email address.

        Args:
            data: The target user and the administrator triggering the action.

        Raises:
            UserNotFoundError: The target account does not exist.
            UserInactiveError: The target account is inactive or deleted.
            PasswordResetEmailNotVerifiedError: The target account does not have a
                verified email address to receive the reset link.
        """
        user = await self.user_repo.get_by_id(data.user_id)
        if user is None:
            raise UserNotFoundError(str(data.user_id))

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        security = await self.user_repo.get_security_by_user_id(data.user_id)
        if security is None or not security.email_verified:
            raise PasswordResetEmailNotVerifiedError()

        reset_token = create_password_reset_token(user.id, user.email)
        await self.password_reset_repo.store(user.id, reset_token)
        await send_email(
            self.arq,
            to=user.email,
            subject="Reset your Eventara password",
            html=reset_password_email_html(reset_token),
        )
