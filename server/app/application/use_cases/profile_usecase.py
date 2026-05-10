from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.profile_dto import (
    GetLoginHistoryInput,
    GetLoginHistoryOutput,
    UpdateProfileAvatarInput,
    UpdateProfileAvatarOutput,
    UpdateProfileInput,
    UpdateProfileOutput,
    UserOnboardingInput,
    UserOnboardingOutput,
)
from app.application.interfaces.user_interface import IUserRepository
from app.domain.entities.user_entity import UserProfile, UserStatus
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    ProfileNotFoundError,
    UserInactiveError,
    UserNotFoundError,
)


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

        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

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


class UpdateProfileUseCase:
    """Handles updating an authenticated user's mutable profile fields.

    Serialises concurrent edits through a pessimistic ``SELECT FOR UPDATE`` lock
    on the profile row.  Alias changes are checked for uniqueness before the
    ``UPDATE``; the database unique constraint is the final integrity guard if two
    requests for different accounts slip through simultaneously.
    """

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def update_profile(self, data: UpdateProfileInput) -> UpdateProfileOutput:
        """Apply mutable field changes to the authenticated user's profile.

        Concurrency strategy:
            ``get_profile_by_user_id_for_update`` acquires a row-level write lock
            before the alias check and the ``UPDATE``.  This collapses concurrent
            requests into a serial queue so only one can read a stale alias and
            pass the pre-update uniqueness check at a time.  The database ``UNIQUE``
            constraint on ``alias`` remains the authoritative integrity guard.

        Args:
            data: ``UpdateProfileInput`` containing the user ID and all mutable
                profile fields.

        Returns:
            ``UpdateProfileOutput`` with the updated profile and the pre-update
            snapshot for audit log construction.

        Raises:
            UserNotFoundError: No user exists for the given ID.
            UserInactiveError: The account is inactive or deleted.
            ProfileNotFoundError: The user has not completed onboarding.
            AliasAlreadyTakenError: The requested alias belongs to another account.
        """
        user = await self.repo.get_by_id(data.user_id)
        if not user:
            raise UserNotFoundError()
        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        current_profile = await self.repo.get_profile_by_user_id_for_update(data.user_id)
        if not current_profile:
            raise ProfileNotFoundError()

        if data.alias != current_profile.alias:
            if await self.repo.get_by_alias(data.alias):
                raise AliasAlreadyTakenError(data.alias)

        try:
            updated_profile = await self.repo.update_profile(
                data.user_id,
                alias=data.alias,
                first_name=data.first_name,
                last_name=data.last_name,
                age_group=data.age_group,
                gender=data.gender,
                education_level=data.education_level,
                occupation=data.occupation,
                bio=data.bio,
            )
        except IntegrityError:
            await self.db.rollback()
            raise AliasAlreadyTakenError(data.alias)

        if updated_profile is None:
            await self.db.rollback()
            raise ProfileNotFoundError()

        await self.db.commit()
        return UpdateProfileOutput(profile=updated_profile, previous_profile=current_profile)


class UpdateProfileAvatarUseCase:
    """Handles updating the authenticated user's profile avatar URL.

    Acquires a pessimistic ``SELECT FOR UPDATE`` lock on the profile row before
    reading the current avatar URL and writing the new one, serialising concurrent
    avatar-update requests for the same account.
    """

    def __init__(self, repo: IUserRepository, db: AsyncSession) -> None:
        self.repo = repo
        self.db = db

    async def update_avatar(self, data: UpdateProfileAvatarInput) -> UpdateProfileAvatarOutput:
        """Replace the profile avatar URL for the authenticated user.

        Args:
            data: ``UpdateProfileAvatarInput`` with the user ID and new image object key.

        Returns:
            ``UpdateProfileAvatarOutput`` with the updated profile and the previous avatar URL.

        Raises:
            UserNotFoundError: No user exists for the given ID.
            UserInactiveError: The account is inactive or deleted.
            ProfileNotFoundError: The user has not completed onboarding.
        """
        user = await self.repo.get_by_id(data.user_id)
        if not user:
            raise UserNotFoundError()
        if user.status in (UserStatus.INACTIVE, UserStatus.DELETED):
            raise UserInactiveError()

        current_profile = await self.repo.get_profile_by_user_id_for_update(data.user_id)
        if not current_profile:
            raise ProfileNotFoundError()

        old_image_url = current_profile.image_file_id

        try:
            updated_profile = await self.repo.update_profile_image(data.user_id, data.image_url)
        except Exception:
            await self.db.rollback()
            raise

        if updated_profile is None:
            await self.db.rollback()
            raise ProfileNotFoundError()

        await self.db.commit()
        return UpdateProfileAvatarOutput(profile=updated_profile, old_image_url=old_image_url)


class CheckAliasUseCase:
    """Checks whether a given alias is available."""

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def is_available(self, alias: str) -> bool:
        existing = await self.repo.get_by_alias(alias)
        return existing is None


class GetLoginHistoryUseCase:
    """Retrieves recent login history entries for the authenticated user."""

    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def execute(self, data: GetLoginHistoryInput) -> GetLoginHistoryOutput:
        entries = await self.repo.get_login_history(data.user_id, data.limit)
        return GetLoginHistoryOutput(entries=entries)
