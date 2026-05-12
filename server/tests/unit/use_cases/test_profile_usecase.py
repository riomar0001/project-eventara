import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.profile_dto import (
    AttendedEventRecord,
    GetEventsAttendedInput,
    GetLoginHistoryInput,
    GetUserDetailsInput,
    UserOnboardingInput,
)
from app.application.use_cases.profile_usecase import (
    CheckAliasUseCase,
    GetEventsAttendedUseCase,
    GetLoginHistoryUseCase,
    GetUserDetailsUseCase,
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
    ProfileNotFoundError,
    UserInactiveError,
    UserNotFoundError,
)

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


def _make_attended_event() -> AttendedEventRecord:
    now = datetime.now(UTC)
    return AttendedEventRecord(
        participant_id=uuid.uuid4(),
        event_id=uuid.uuid4(),
        event_title="Community Night",
        event_start_date=now,
        event_end_date=now,
        event_banner_url=None,
        session_id=uuid.uuid4(),
        session_title="Main Session",
        session_start_datetime=now,
        session_end_datetime=now,
        attended_at=now,
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


def _make_repo(
    *,
    user=None,
    security=None,
    alias_taken=False,
    profile=None,
    login_history=None,
    attended_events=None,
    role_name="participant",
) -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user)
    repo.get_security_by_user_id = AsyncMock(return_value=security)
    repo.get_by_alias = AsyncMock(return_value=_make_user() if alias_taken else None)
    repo.create_profile = AsyncMock(return_value=profile or _make_profile())
    repo.complete_onboarding = AsyncMock(return_value=True)
    repo.get_login_history = AsyncMock(return_value=login_history or [])
    repo.get_profile_by_user_id = AsyncMock(return_value=profile)
    repo.get_active_role_name_by_user_id = AsyncMock(return_value=role_name)
    repo.list_attended_events_by_user_id = AsyncMock(return_value=attended_events or [])
    return repo


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


class TestGetEventsAttendedUseCase:
    @pytest.mark.asyncio
    async def test_returns_attended_events_for_active_user(self):
        events = [_make_attended_event()]
        repo = _make_repo(user=_make_user(), attended_events=events)
        result = await GetEventsAttendedUseCase(repo).execute(GetEventsAttendedInput(user_id=USER_ID, limit=5))
        assert result.events == events
        repo.list_attended_events_by_user_id.assert_awaited_once_with(USER_ID, 5)

    @pytest.mark.asyncio
    async def test_raises_user_not_found_when_user_missing(self):
        repo = _make_repo(user=None)
        with pytest.raises(UserNotFoundError):
            await GetEventsAttendedUseCase(repo).execute(GetEventsAttendedInput(user_id=USER_ID))

    @pytest.mark.asyncio
    async def test_raises_user_inactive_when_user_inactive(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        with pytest.raises(UserInactiveError):
            await GetEventsAttendedUseCase(repo).execute(GetEventsAttendedInput(user_id=USER_ID))


class TestGetUserDetailsUseCase:
    @pytest.mark.asyncio
    async def test_returns_profile_role_and_attended_events(self):
        events = [_make_attended_event()]
        profile = _make_profile()
        repo = _make_repo(user=_make_user(), profile=profile, attended_events=events, role_name="admin")
        result = await GetUserDetailsUseCase(repo).execute(GetUserDetailsInput(user_id=USER_ID, attended_events_limit=3))
        assert result.profile is profile
        assert result.profile.email == USER_EMAIL
        assert result.role_name == "admin"
        assert result.events_attended == events
        repo.list_attended_events_by_user_id.assert_awaited_once_with(USER_ID, 3)

    @pytest.mark.asyncio
    async def test_raises_user_not_found_when_user_missing(self):
        repo = _make_repo(user=None, profile=_make_profile())
        with pytest.raises(UserNotFoundError):
            await GetUserDetailsUseCase(repo).execute(GetUserDetailsInput(user_id=USER_ID))

    @pytest.mark.asyncio
    async def test_raises_user_inactive_when_user_deleted(self):
        repo = _make_repo(user=_make_user(status=UserStatus.DELETED), profile=_make_profile())
        with pytest.raises(UserInactiveError):
            await GetUserDetailsUseCase(repo).execute(GetUserDetailsInput(user_id=USER_ID))

    @pytest.mark.asyncio
    async def test_raises_profile_not_found_when_profile_missing(self):
        repo = _make_repo(user=_make_user(), profile=None)
        with pytest.raises(ProfileNotFoundError):
            await GetUserDetailsUseCase(repo).execute(GetUserDetailsInput(user_id=USER_ID))
