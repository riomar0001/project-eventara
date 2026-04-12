from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.user_dto import ChangePasswordInput, UserOnboardingInput, UserOnboardingOutput
from app.application.interfaces.user_interface import IUserRepository
from app.core.security.hashing import hash_string, verify_hash
from app.domain.entities.user_entity import UserProfile, UserStatus
from app.domain.exceptions.auth_exceptions import InvalidCredentialsError
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    SamePasswordError,
    UserInactiveError,
    UserNotFoundError,
)
from app.infrastructure.database.repositories.refresh_token_repository import RefreshTokenRepository


class OnboardingUseCase:
    """Handles user onboarding after email verification.

    Onboarding collects the user's profile details (alias, name, demographics)
    and marks the account as fully set up. It can only be completed once.
    """

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def complete_onboarding(self, data: UserOnboardingInput) -> UserOnboardingOutput:
        """Create the user's profile and mark onboarding as complete.

        Concurrency note:
            Alias uniqueness is checked optimistically before the INSERT, and the
            database unique constraint acts as the final guard.  ``complete_onboarding``
            uses a conditional UPDATE (``WHERE onboarding_completed = FALSE``) so
            concurrent requests for the same user cannot both succeed.

        Args:
            data: A ``UserOnboardingInput`` with the user ID and all profile fields.

        Returns:
            A ``UserOnboardingOutput`` containing the newly created profile.

        Raises:
            UserNotFoundError: No user exists for the given ID.
            EmailNotVerifiedError: The user has not yet verified their email address.
            OnboardingAlreadyCompletedError: Onboarding was already completed, or a
                concurrent request completed it just before this one.
            AliasAlreadyTakenError: The requested alias is already in use by another user.
        """
        user = await self.repo.get_by_id(data.user_id)
        if not user:
            raise UserNotFoundError()

        security = await self.repo.get_security_by_user_id(data.user_id)
        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        if user.onboarding_completed:
            raise OnboardingAlreadyCompletedError()

        existing_alias = await self.repo.get_by_alias(data.alias)
        if existing_alias:
            raise AliasAlreadyTakenError(data.alias)

        profile = UserProfile(
            user_id=data.user_id,
            email=user.email,
            alias=data.alias,
            first_name=data.first_name,
            last_name=data.last_name,
            age_group=data.age_group,
            gender=data.gender,
            education_level=data.education_level,
            occupation=data.occupation,
            bio=data.bio,
        )

        try:
            created_profile = await self.repo.create_profile(profile)
        except IntegrityError as exc:
            await self.db.rollback()
            orig = str(getattr(exc, "orig", exc)).lower()
            if "alias" in orig:
                raise AliasAlreadyTakenError(data.alias)
            raise OnboardingAlreadyCompletedError()

        updated = await self.repo.complete_onboarding(data.user_id)
        if not updated:
            await self.db.rollback()
            raise OnboardingAlreadyCompletedError()

        return UserOnboardingOutput(profile=created_profile)


class CheckAliasUseCase:
    """Checks whether a given alias is available."""

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def is_available(self, alias: str) -> bool:
        existing = await self.repo.get_by_alias(alias)
        return existing is None


class ChangePasswordUseCase:
    """Handles authenticated password changes for an existing user account.

    Requires a valid access token — the caller must already be authenticated.
    On success, all refresh tokens belonging to the account are revoked so
    every other active session is immediately invalidated, limiting the damage
    window if credentials were compromised.

    Concurrency strategy — sequential atomic updates:
        Two concurrent change-password requests from the same authenticated user
        require no distributed lock because both operations are inherently atomic
        at the database level:

        1. ``UserRepository.update_password`` executes a single SQL ``UPDATE``
           on ``users`` followed by an ``UPDATE`` on ``user_security``, both
           within the same transaction.  If two requests race, the second write
           simply overwrites the first — both originate from the authenticated
           owner, so the final state is always a valid password.

        2. ``RefreshTokenRepository.revoke_all_for_user`` executes a single bulk
           ``UPDATE … WHERE is_active = TRUE``.  If the two requests overlap, the
           second call matches zero rows (already revoked) and commits a no-op,
           which is the correct outcome.

        Pessimistic locking (``SELECT … FOR UPDATE``) is deliberately avoided
        because the naturally idempotent semantics of both updates make it
        unnecessary overhead for this particular flow.
    """

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def change_password(self, data: ChangePasswordInput) -> None:
        """Verify the current password and replace it with a new bcrypt hash.

        Guards are applied in the following order to fail fast on the cheapest
        checks before reaching the bcrypt comparison:

        1. User existence — avoids a bcrypt call for a non-existent account.
        2. Account status — inactive and deleted accounts cannot authenticate.
        3. Email verification — an unverified account should not hold an active
           session, but this acts as a belt-and-suspenders guard.
        4. Current password verification — constant-time bcrypt check.
        5. Same-password guard — prevents a no-op change that would silently
           succeed and confuse the caller.

        On success, the new password hash is written atomically alongside the
        ``password_change_at`` timestamp, and all existing refresh tokens are
        revoked to invalidate every other active session.

        Args:
            data: A ``ChangePasswordInput`` carrying the caller's user ID,
                their current plaintext password, and the desired new password.

        Raises:
            UserNotFoundError: No user exists for the given ID.
            UserInactiveError: The account is deactivated or soft-deleted.
            EmailNotVerifiedError: The account's email address is unverified.
            InvalidCredentialsError: The supplied current password is incorrect.
            SamePasswordError: The new password is identical to the current one.
        """
        user = await self.repo.get_by_id(data.user_id)
        if not user:
            raise UserNotFoundError()

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        security = await self.repo.get_security_by_user_id(data.user_id)
        if not security or not security.email_verified:
            raise EmailNotVerifiedError()

        if not verify_hash(data.current_password, user.password):
            raise InvalidCredentialsError()

        if verify_hash(data.new_password, user.password):
            raise SamePasswordError()

        new_hash = hash_string(data.new_password)
        updated = await self.repo.update_password(data.user_id, new_hash)
        if not updated:
            raise UserNotFoundError()

        token_repo = RefreshTokenRepository(self.db)
        await token_repo.revoke_all_for_user(data.user_id)
