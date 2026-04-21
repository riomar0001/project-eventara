from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.profile_dto import (
    GetLoginHistoryInput,
    GetLoginHistoryOutput,
    UserOnboardingInput,
    UserOnboardingOutput,
)
from app.application.interfaces.user_interface import IUserRepository
from app.domain.entities.user_entity import UserProfile, UserStatus
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
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
