"""Unit tests for UpdateProfileUseCase."""

import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.profile_dto import UpdateProfileInput
from app.application.use_cases.profile_usecase import UpdateProfileUseCase
from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, User, UserProfile, UserStatus
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    ProfileNotFoundError,
    UserInactiveError,
    UserNotFoundError,
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

USER_ID = uuid.uuid4()


def _make_user(**overrides: Any) -> User:
    defaults: dict[str, Any] = dict(
        id=USER_ID,
        email="user@example.com",
        password="hashed",
        status=UserStatus.ACTIVE,
        onboarding_completed=True,
    )
    defaults.update(overrides)
    return User(**defaults)


def _make_profile(**overrides: Any) -> UserProfile:
    defaults: dict[str, Any] = dict(
        user_id=USER_ID,
        alias="johndoe",
        first_name="John",
        last_name="Doe",
        age_group=AgeGroup.ADULT,
        gender=Gender.MALE,
        education_level=EducationLevel.BACHELORS_DEGREE,
        occupation="Engineer",
        bio="Hello world",
    )
    defaults.update(overrides)
    return UserProfile(**defaults)


def _make_repo(
    *,
    user: User | None = None,
    profile: UserProfile | None = None,
    alias_taken: User | None = None,
    updated_profile: UserProfile | None = None,
) -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=user or _make_user())
    repo.get_profile_by_user_id_for_update = AsyncMock(return_value=profile if profile is not None else _make_profile())
    repo.get_by_alias = AsyncMock(return_value=alias_taken)
    repo.update_profile = AsyncMock(return_value=updated_profile if updated_profile is not None else _make_profile())
    return repo


def _make_uc(repo: MagicMock | None = None) -> UpdateProfileUseCase:
    return UpdateProfileUseCase(repo=repo or _make_repo(), db=AsyncMock())


def _make_input(**overrides: Any) -> UpdateProfileInput:
    defaults: dict[str, Any] = dict(
        user_id=USER_ID,
        alias="johndoe",
        first_name="John",
        last_name="Doe",
        age_group=AgeGroup.ADULT,
        gender=Gender.MALE,
        education_level=EducationLevel.BACHELORS_DEGREE,
        occupation="Engineer",
        bio="Hello world",
    )
    defaults.update(overrides)
    return UpdateProfileInput(**defaults)


# ─── Success path ─────────────────────────────────────────────────────────────


class TestUpdateProfileSuccess:
    @pytest.mark.asyncio
    async def test_commits_and_returns_updated_profile(self):
        updated = _make_profile(first_name="Jane")
        repo = _make_repo(updated_profile=updated)
        db = AsyncMock()
        result = await UpdateProfileUseCase(repo=repo, db=db).update_profile(_make_input(first_name="Jane"))
        assert result.profile is updated
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_previous_profile_is_pre_update_snapshot(self):
        original = _make_profile(alias="original")
        updated = _make_profile(alias="new_alias")
        repo = _make_repo(profile=original, updated_profile=updated)
        result = await _make_uc(repo).update_profile(_make_input(alias="new_alias"))
        assert result.previous_profile is original
        assert result.profile is updated

    @pytest.mark.asyncio
    async def test_skips_alias_check_when_alias_unchanged(self):
        repo = _make_repo(profile=_make_profile(alias="johndoe"))
        await _make_uc(repo).update_profile(_make_input(alias="johndoe"))
        repo.get_by_alias.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_checks_alias_uniqueness_when_alias_changes(self):
        repo = _make_repo(profile=_make_profile(alias="old_alias"), alias_taken=None)
        await _make_uc(repo).update_profile(_make_input(alias="new_alias"))
        repo.get_by_alias.assert_awaited_once_with("new_alias")


# ─── Guard rails ──────────────────────────────────────────────────────────────


class TestUpdateProfileGuards:
    @pytest.mark.asyncio
    async def test_raises_user_not_found_when_user_missing(self):
        repo = _make_repo(user=None)
        repo.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(UserNotFoundError):
            await _make_uc(repo).update_profile(_make_input())

    @pytest.mark.asyncio
    async def test_raises_user_inactive_when_account_is_inactive(self):
        repo = _make_repo(user=_make_user(status=UserStatus.INACTIVE))
        with pytest.raises(UserInactiveError):
            await _make_uc(repo).update_profile(_make_input())

    @pytest.mark.asyncio
    async def test_raises_user_inactive_when_account_is_deleted(self):
        repo = _make_repo(user=_make_user(status=UserStatus.DELETED))
        with pytest.raises(UserInactiveError):
            await _make_uc(repo).update_profile(_make_input())

    @pytest.mark.asyncio
    async def test_raises_profile_not_found_when_no_profile_exists(self):
        repo = _make_repo()
        repo.get_profile_by_user_id_for_update = AsyncMock(return_value=None)
        with pytest.raises(ProfileNotFoundError):
            await _make_uc(repo).update_profile(_make_input())

    @pytest.mark.asyncio
    async def test_raises_alias_taken_when_new_alias_owned_by_other(self):
        other_user = _make_user(id=uuid.uuid4())
        repo = _make_repo(profile=_make_profile(alias="old"), alias_taken=other_user)
        with pytest.raises(AliasAlreadyTakenError):
            await _make_uc(repo).update_profile(_make_input(alias="taken"))

    @pytest.mark.asyncio
    async def test_integrity_error_raises_alias_taken_and_rolls_back(self):
        repo = _make_repo(profile=_make_profile(alias="old"), alias_taken=None)
        repo.update_profile = AsyncMock(side_effect=IntegrityError(None, None, Exception("unique")))
        db = AsyncMock()
        with pytest.raises(AliasAlreadyTakenError):
            await UpdateProfileUseCase(repo=repo, db=db).update_profile(_make_input(alias="raced"))
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_repo_update_returns_none_raises_profile_not_found_and_rolls_back(self):
        repo = _make_repo(profile=_make_profile(), updated_profile=None)
        repo.update_profile = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(ProfileNotFoundError):
            await UpdateProfileUseCase(repo=repo, db=db).update_profile(_make_input())
        db.rollback.assert_awaited_once()
