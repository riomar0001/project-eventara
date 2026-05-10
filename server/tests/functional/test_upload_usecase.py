"""Functional test cases for image-upload use cases (event banner, venue image, profile avatar)."""

import uuid
from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.event_dto import UpdateEventBannerInput
from app.application.dto.profile_dto import UpdateProfileAvatarInput
from app.application.dto.venue_dto import UpdateVenueImageInput
from app.application.use_cases.event_usecase import EventUseCase
from app.application.use_cases.profile_usecase import UpdateProfileAvatarUseCase
from app.application.use_cases.venue_usecase import VenueManagementUseCase
from app.domain.entities.event_entity import Event, EventStatus
from app.domain.entities.user_entity import AgeGroup, EducationLevel, Gender, User, UserProfile, UserStatus
from app.domain.entities.venue_entities import Venue, VenueType
from app.domain.exceptions.event_exceptions import EventNotFoundError, UnauthorizedEventOperationError
from app.domain.exceptions.user_exceptions import ProfileNotFoundError, UserInactiveError, UserNotFoundError
from app.domain.exceptions.venue_exceptions import UnauthorizedVenueOperationError, VenueNotFoundError

# ─── Shared constants ─────────────────────────────────────────────────────────

EVENT_ID = uuid.uuid4()
VENUE_ID = uuid.uuid4()
USER_ID = uuid.uuid4()
CREATOR_ID = uuid.uuid4()
OTHER_ID = uuid.uuid4()
PUBLIC_URL = "https://cdn.example.com/image.jpg"
OLD_URL = "https://cdn.example.com/old.jpg"

_NOW = datetime(2026, 1, 1)


# ─── Event helpers ────────────────────────────────────────────────────────────


def _make_event(**overrides: Any) -> Event:
    defaults: dict[str, Any] = dict(
        id=EVENT_ID,
        title="Test Event",
        description="A test event",
        start_date=_NOW,
        end_date=_NOW,
        status=EventStatus.DRAFT,
        created_by=CREATOR_ID,
        banner_url=None,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _make_event_repo(*, event=None, updated_event=None) -> MagicMock:
    repo = MagicMock()
    repo.get_event_by_id = AsyncMock(return_value=event)
    repo.update_event_banner = AsyncMock(return_value=updated_event or _make_event(banner_url=PUBLIC_URL))
    return repo


# ─── Venue helpers ────────────────────────────────────────────────────────────


def _make_venue(**overrides: Any) -> Venue:
    defaults: dict[str, Any] = dict(
        id=VENUE_ID,
        creator_id=CREATOR_ID,
        image_url=None,
        name="Test Venue",
        description=None,
        address_line="123 Main St",
        city="Davao City",
        province="Davao del Sur",
        postal_code="8000",
        region="Region XI",
        country="Philippines",
        capacity=200,
        venue_type=VenueType.INDOOR,
        popularity_count=0,
        usage_count=0,
        is_partner=False,
        amenities=None,
        contact_name=None,
        contact_phone=None,
        contact_email=None,
    )
    defaults.update(overrides)
    return Venue(**defaults)


def _make_venue_repo(*, venue=None, updated_venue=None) -> MagicMock:
    repo = MagicMock()
    repo.get_venue_by_id = AsyncMock(return_value=venue)
    repo.update_venue_image = AsyncMock(return_value=updated_venue or _make_venue(image_url=PUBLIC_URL))
    return repo


# ─── Profile helpers ──────────────────────────────────────────────────────────


def _make_user(**overrides: Any) -> User:
    defaults: dict[str, Any] = dict(
        id=USER_ID,
        email="user@example.com",
        password="hashed",
        status=UserStatus.ACTIVE,
    )
    defaults.update(overrides)
    return User(**defaults)


def _make_profile(**overrides: Any) -> UserProfile:
    defaults: dict[str, Any] = dict(
        user_id=USER_ID,
        alias="testuser",
        first_name="Test",
        last_name="User",
        age_group=AgeGroup.ADULT,
        gender=Gender.MALE,
        education_level=EducationLevel.ELEMENTARY_GRADUATE,
        image_file_id=None,
    )
    defaults.update(overrides)
    return UserProfile(**defaults)


_MISSING = object()


def _make_profile_repo(*, user=_MISSING, profile=_MISSING, updated_profile=_MISSING) -> MagicMock:
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=_make_user() if user is _MISSING else user)
    repo.get_profile_by_user_id_for_update = AsyncMock(return_value=_make_profile() if profile is _MISSING else profile)
    repo.update_profile_image = AsyncMock(return_value=_make_profile(image_file_id=PUBLIC_URL) if updated_profile is _MISSING else updated_profile)
    return repo


# ─── TestUpdateEventBanner ────────────────────────────────────────────────────


class TestUpdateEventBanner:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_output(self):
        """Returns the updated event and commits the transaction on success"""
        event = _make_event(created_by=CREATOR_ID, banner_url=None)
        updated = _make_event(created_by=CREATOR_ID, banner_url=PUBLIC_URL)
        repo = _make_event_repo(event=event, updated_event=updated)
        db = AsyncMock()
        result = await EventUseCase(repo=repo, db=db).update_event_banner(
            UpdateEventBannerInput(event_id=EVENT_ID, updated_by=CREATOR_ID, banner_url=PUBLIC_URL)
        )
        assert result.event is updated
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_captures_old_banner_url(self):
        """Preserves the previous banner URL in the output for audit log use"""
        event = _make_event(created_by=CREATOR_ID, banner_url=OLD_URL)
        repo = _make_event_repo(event=event)
        db = AsyncMock()
        result = await EventUseCase(repo=repo, db=db).update_event_banner(
            UpdateEventBannerInput(event_id=EVENT_ID, updated_by=CREATOR_ID, banner_url=PUBLIC_URL)
        )
        assert result.old_banner_url == OLD_URL

    @pytest.mark.asyncio
    async def test_event_not_found_raises(self):
        """Raises EventNotFoundError when no event matches the given ID"""
        repo = _make_event_repo(event=None)
        db = AsyncMock()
        with pytest.raises(EventNotFoundError):
            await EventUseCase(repo=repo, db=db).update_event_banner(
                UpdateEventBannerInput(event_id=EVENT_ID, updated_by=CREATOR_ID, banner_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_unauthorized_raises(self):
        """Raises UnauthorizedEventOperationError when caller is not the event creator"""
        event = _make_event(created_by=CREATOR_ID)
        repo = _make_event_repo(event=event)
        db = AsyncMock()
        with pytest.raises(UnauthorizedEventOperationError):
            await EventUseCase(repo=repo, db=db).update_event_banner(
                UpdateEventBannerInput(event_id=EVENT_ID, updated_by=OTHER_ID, banner_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_repo_error_rolls_back(self):
        """Rolls back the transaction when the repository raises an unexpected error"""
        event = _make_event(created_by=CREATOR_ID)
        repo = _make_event_repo(event=event)
        repo.update_event_banner = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await EventUseCase(repo=repo, db=db).update_event_banner(
                UpdateEventBannerInput(event_id=EVENT_ID, updated_by=CREATOR_ID, banner_url=PUBLIC_URL)
            )
        db.rollback.assert_awaited_once()


# ─── TestUpdateVenueImage ─────────────────────────────────────────────────────


class TestUpdateVenueImage:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_output(self):
        """Returns the updated venue and commits the transaction on success"""
        venue = _make_venue(creator_id=CREATOR_ID, image_url=None)
        updated = _make_venue(creator_id=CREATOR_ID, image_url=PUBLIC_URL)
        repo = _make_venue_repo(venue=venue, updated_venue=updated)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).update_venue_image(
            UpdateVenueImageInput(venue_id=VENUE_ID, updated_by=CREATOR_ID, image_url=PUBLIC_URL)
        )
        assert result.venue is updated
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_captures_old_image_url(self):
        """Preserves the previous image URL in the output for audit log use"""
        venue = _make_venue(creator_id=CREATOR_ID, image_url=OLD_URL)
        repo = _make_venue_repo(venue=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).update_venue_image(
            UpdateVenueImageInput(venue_id=VENUE_ID, updated_by=CREATOR_ID, image_url=PUBLIC_URL)
        )
        assert result.old_image_url == OLD_URL

    @pytest.mark.asyncio
    async def test_venue_not_found_raises(self):
        """Raises VenueNotFoundError when no venue matches the given ID"""
        repo = _make_venue_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue_image(
                UpdateVenueImageInput(venue_id=VENUE_ID, updated_by=CREATOR_ID, image_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_unauthorized_raises(self):
        """Raises UnauthorizedVenueOperationError when caller is not the venue creator"""
        venue = _make_venue(creator_id=CREATOR_ID)
        repo = _make_venue_repo(venue=venue)
        db = AsyncMock()
        with pytest.raises(UnauthorizedVenueOperationError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue_image(
                UpdateVenueImageInput(venue_id=VENUE_ID, updated_by=OTHER_ID, image_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_repo_error_rolls_back(self):
        """Rolls back the transaction when the repository raises an unexpected error"""
        venue = _make_venue(creator_id=CREATOR_ID)
        repo = _make_venue_repo(venue=venue)
        repo.update_venue_image = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue_image(
                UpdateVenueImageInput(venue_id=VENUE_ID, updated_by=CREATOR_ID, image_url=PUBLIC_URL)
            )
        db.rollback.assert_awaited_once()


# ─── TestUpdateProfileAvatar ──────────────────────────────────────────────────


class TestUpdateProfileAvatar:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_output(self):
        """Returns the updated profile and commits the transaction on success"""
        user = _make_user(status=UserStatus.ACTIVE)
        profile = _make_profile(image_file_id=None)
        updated = _make_profile(image_file_id=PUBLIC_URL)
        repo = _make_profile_repo(user=user, profile=profile, updated_profile=updated)
        db = AsyncMock()
        result = await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
            UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
        )
        assert result.profile is updated
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_captures_old_image_url(self):
        """Preserves the previous avatar URL in the output for audit log use"""
        profile = _make_profile(image_file_id=OLD_URL)
        repo = _make_profile_repo(profile=profile)
        db = AsyncMock()
        result = await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
            UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
        )
        assert result.old_image_url == OLD_URL

    @pytest.mark.asyncio
    async def test_user_not_found_raises(self):
        """Raises UserNotFoundError when no user exists for the given ID"""
        repo = _make_profile_repo(user=None)
        db = AsyncMock()
        with pytest.raises(UserNotFoundError):
            await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
                UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_user_inactive_raises(self):
        """Raises UserInactiveError when the account is inactive or deleted"""
        user = _make_user(status=UserStatus.INACTIVE)
        repo = _make_profile_repo(user=user)
        db = AsyncMock()
        with pytest.raises(UserInactiveError):
            await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
                UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_no_profile_raises(self):
        """Raises ProfileNotFoundError when the user has no profile (onboarding not complete)"""
        repo = _make_profile_repo(profile=None)
        repo.update_profile_image = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(ProfileNotFoundError):
            await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
                UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
            )

    @pytest.mark.asyncio
    async def test_repo_returns_none_rolls_back_and_raises(self):
        """Rolls back the transaction and raises ProfileNotFoundError when the repository UPDATE finds no row"""
        repo = _make_profile_repo(updated_profile=None)
        repo.update_profile_image = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(ProfileNotFoundError):
            await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
                UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
            )
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_repo_error_rolls_back(self):
        """Rolls back the transaction when the repository raises an unexpected error"""
        repo = _make_profile_repo()
        repo.update_profile_image = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await UpdateProfileAvatarUseCase(repo=repo, db=db).update_avatar(
                UpdateProfileAvatarInput(user_id=USER_ID, image_url=PUBLIC_URL)
            )
        db.rollback.assert_awaited_once()
