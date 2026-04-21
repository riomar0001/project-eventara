"""Unit tests for profile use cases: OnboardingUseCase, CheckAliasUseCase, GetLoginHistoryUseCase."""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.profile_dto import GetLoginHistoryInput, UserOnboardingInput
from app.application.use_cases.profile_usecase import (
    CheckAliasUseCase,
    GetLoginHistoryUseCase,
    OnboardingUseCase,
)
from app.domain.entities.user_entity import (
    AgeGroup,
    EducationLevel,
    Gender,
    User,
    UserLoginHistory,
    UserProfile,
    UserSecurity,
    UserStatus,
)
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    UserInactiveError,
    UserNotFoundError,
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

USER_ID = uuid.uuid4()
USER_EMAIL = "user@example.com"


def _make_user(*, status=UserStatus.ACTIVE, onboarding_completed=False) -> User:
    return User(
        id=USER_ID,
        email=USER_EMAIL,
        password="hashed",
        status=status,
        onboarding_completed=onboarding_completed,
    )


def _make_security(*, email_verified=True) -> UserSecurity:
    return UserSecurity(user_id=USER_ID, email_verified=email_verified)


def _make_profile() -> UserProfile:
    return UserProfile(
        user_id=USER_ID,
        alias="riomar",
        first_name="Mario",
        last_name="Inguito",
        age_group=AgeGroup.ADULT,
        gender=Gender.MALE,
        education_level=EducationLevel.BACHELORS_DEGREE,
    )


def _make_onboarding_input(alias="riomar") -> UserOnboardingInput:
    return UserOnboardingInput(
        user_id=USER_ID,
        alias=alias,
        first_name="Mario",
        last_name="Inguito",
        age_group=AgeGroup.ADULT,
        gender=Gender.MALE,
        education_level=EducationLevel.BACHELORS_DEGREE,
        occupation="Engineer",
        bio="Hello",
    )


def _make_repo(*, user=None, security=None, alias_taken=False, profile=None, login_history=None) -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=security)
    repo.get_by_alias = AsyncMock(return_value=_make_user() if alias_taken else None)
    repo.create_profile = AsyncMock(return_value=profile or _make_profile())
    repo.complete_onboarding = AsyncMock(return_value=True)
    repo.get_login_history = AsyncMock(return_value=login_history or [])
    return repo


# ─── OnboardingUseCase ────────────────────────────────────────────────────────


class TestOnboardingUseCase:
    def _make_uc(self, repo) -> OnboardingUseCase:
        return OnboardingUseCase(repo=repo, db=AsyncMock())

    @pytest.mark.asyncio
    async def test_success(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        result = await self._make_uc(repo).complete_onboarding(_make_onboarding_input())
        assert result.profile.alias == "riomar"
        repo.create_profile.assert_awaited_once()
        repo.complete_onboarding.assert_awaited_once_with(USER_ID)

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        uc = self._make_uc(_make_repo(user=None))
        with pytest.raises(UserNotFoundError):
            await uc.complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_inactive_user(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        with pytest.raises(UserInactiveError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_deleted_user(self):
        repo = _make_repo(user=_make_user(status=UserStatus.DELETED))
        with pytest.raises(UserInactiveError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_email_not_verified(self):
        repo = _make_repo(user=_make_user(), security=_make_security(email_verified=False))
        with pytest.raises(EmailNotVerifiedError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_no_security_record(self):
        repo = _make_repo(user=_make_user(), security=None)
        with pytest.raises(EmailNotVerifiedError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_onboarding_already_completed(self):
        repo = _make_repo(user=_make_user(onboarding_completed=True), security=_make_security())
        with pytest.raises(OnboardingAlreadyCompletedError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_alias_already_taken(self):
        repo = _make_repo(user=_make_user(), security=_make_security(), alias_taken=True)
        with pytest.raises(AliasAlreadyTakenError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_integrity_error_alias_raises_alias_taken(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        repo.create_profile = AsyncMock(side_effect=IntegrityError(None, None, Exception("unique_alias")))
        with pytest.raises(AliasAlreadyTakenError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_integrity_error_other_raises_onboarding_completed(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        repo.create_profile = AsyncMock(side_effect=IntegrityError(None, None, Exception("other constraint")))
        with pytest.raises(OnboardingAlreadyCompletedError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())

    @pytest.mark.asyncio
    async def test_complete_onboarding_returns_false_raises_already_completed(self):
        repo = _make_repo(user=_make_user(), security=_make_security())
        repo.complete_onboarding = AsyncMock(return_value=False)
        with pytest.raises(OnboardingAlreadyCompletedError):
            await self._make_uc(repo).complete_onboarding(_make_onboarding_input())


# ─── CheckAliasUseCase ────────────────────────────────────────────────────────


class TestCheckAliasUseCase:
    @pytest.mark.asyncio
    async def test_alias_available(self):
        repo = _make_repo(alias_taken=False)
        result = await CheckAliasUseCase(repo).is_available("freehandle")
        assert result is True

    @pytest.mark.asyncio
    async def test_alias_taken(self):
        repo = _make_repo(alias_taken=True)
        result = await CheckAliasUseCase(repo).is_available("takenhandle")
        assert result is False


# ─── GetLoginHistoryUseCase ───────────────────────────────────────────────────


class TestGetLoginHistoryUseCase:
    @pytest.mark.asyncio
    async def test_returns_entries(self):
        entries = [
            UserLoginHistory(user_id=USER_ID, successful=True),
            UserLoginHistory(user_id=USER_ID, successful=False),
        ]
        repo = _make_repo(login_history=entries)
        result = await GetLoginHistoryUseCase(repo).execute(GetLoginHistoryInput(user_id=USER_ID, limit=10))
        assert result.entries == entries
        repo.get_login_history.assert_awaited_once_with(USER_ID, 10)

    @pytest.mark.asyncio
    async def test_empty_history(self):
        repo = _make_repo(login_history=[])
        result = await GetLoginHistoryUseCase(repo).execute(GetLoginHistoryInput(user_id=USER_ID, limit=5))
        assert result.entries == []

    @pytest.mark.asyncio
    async def test_respects_limit(self):
        repo = _make_repo()
        await GetLoginHistoryUseCase(repo).execute(GetLoginHistoryInput(user_id=USER_ID, limit=25))
        repo.get_login_history.assert_awaited_once_with(USER_ID, 25)
