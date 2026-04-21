"""Functional test cases for VenueRatingUseCase."""

import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.exc import IntegrityError

from app.application.dto.venue_rating_dto import (
    CreateVenueRatingInput,
    ListVenueRatingsInput,
    UpdateVenueRatingInput,
)
from app.application.use_cases.venue_rating_usecase import VenueRatingUseCase
from app.domain.entities.venue_entities import VenueRating
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.domain.exceptions.venue_rating_exceptions import (
    VenueRatingAlreadyExistsError,
    VenueRatingNotFoundError,
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

USER_ID = uuid.uuid4()
VENUE_ID = uuid.uuid4()
RATING_ID = uuid.uuid4()


def _make_rating(**overrides: Any) -> VenueRating:
    defaults: dict[str, Any] = dict(
        id=RATING_ID,
        user_id=USER_ID,
        venue_id=VENUE_ID,
        rating=4,
        comment="Great venue",
    )
    defaults.update(overrides)
    return VenueRating(**defaults)


def _make_repo(
    *,
    venue_exists: bool = True,
    existing_rating: VenueRating | None = None,
    created_rating: VenueRating | None = None,
    updated_rating: VenueRating | None = None,
    deleted: bool = True,
    ratings: list | None = None,
    total: int = 0,
) -> MagicMock:
    repo = MagicMock()
    repo.venue_exists = AsyncMock(return_value=venue_exists)
    repo.get_by_user_and_venue = AsyncMock(return_value=existing_rating)
    repo.create = AsyncMock(return_value=created_rating or _make_rating())
    repo.update = AsyncMock(return_value=updated_rating or _make_rating())
    repo.delete = AsyncMock(return_value=deleted)
    repo.list_by_venue = AsyncMock(return_value=(ratings or [], total))
    repo.increment_venue_popularity = AsyncMock()
    repo.decrement_venue_popularity = AsyncMock()
    return repo


def _make_uc(repo: MagicMock | None = None) -> VenueRatingUseCase:
    return VenueRatingUseCase(repo=repo or _make_repo(), db=AsyncMock())


def _create_input(**overrides: Any) -> CreateVenueRatingInput:
    defaults: dict[str, Any] = dict(user_id=USER_ID, venue_id=VENUE_ID, rating=4, comment="Great")
    defaults.update(overrides)
    return CreateVenueRatingInput(**defaults)


def _update_input(**overrides: Any) -> UpdateVenueRatingInput:
    defaults: dict[str, Any] = dict(user_id=USER_ID, venue_id=VENUE_ID, rating=5, comment="Amazing")
    defaults.update(overrides)
    return UpdateVenueRatingInput(**defaults)


# ─── create_rating ────────────────────────────────────────────────────────────


class TestCreateRating:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_rating(self):
        """Commits the transaction and returns the created rating on success"""
        created = _make_rating()
        repo = _make_repo(existing_rating=None, created_rating=created)
        db = AsyncMock()
        result = await VenueRatingUseCase(repo=repo, db=db).create_rating(_create_input())
        assert result.rating is created
        db.commit.assert_awaited_once()
        repo.increment_venue_popularity.assert_awaited_once_with(VENUE_ID)

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when the target venue does not exist"""
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).create_rating(_create_input())

    @pytest.mark.asyncio
    async def test_raises_already_exists_when_rating_present(self):
        """Raises VenueRatingAlreadyExistsError when the user has already rated the venue"""
        repo = _make_repo(existing_rating=_make_rating())
        with pytest.raises(VenueRatingAlreadyExistsError):
            await _make_uc(repo).create_rating(_create_input())

    @pytest.mark.asyncio
    async def test_integrity_error_raises_already_exists_and_rolls_back(self):
        """Raises VenueRatingAlreadyExistsError and rolls back when the unique constraint fires"""
        repo = _make_repo(existing_rating=None)
        repo.create = AsyncMock(side_effect=IntegrityError(None, None, Exception("unique")))
        db = AsyncMock()
        with pytest.raises(VenueRatingAlreadyExistsError):
            await VenueRatingUseCase(repo=repo, db=db).create_rating(_create_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back and re-raises on any unexpected repository failure"""
        repo = _make_repo(existing_rating=None)
        repo.create = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueRatingUseCase(repo=repo, db=db).create_rating(_create_input())
        db.rollback.assert_awaited_once()


# ─── get_my_rating ────────────────────────────────────────────────────────────


class TestGetMyRating:
    @pytest.mark.asyncio
    async def test_success_returns_rating(self):
        """Returns the matching VenueRatingOutput for an existing user rating"""
        rating = _make_rating()
        repo = _make_repo(existing_rating=rating)
        result = await _make_uc(repo).get_my_rating(USER_ID, VENUE_ID)
        assert result.rating is rating

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when the target venue does not exist"""
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).get_my_rating(USER_ID, VENUE_ID)

    @pytest.mark.asyncio
    async def test_raises_not_found_when_no_rating_exists(self):
        """Raises VenueRatingNotFoundError when the user has not rated the venue"""
        repo = _make_repo(existing_rating=None)
        with pytest.raises(VenueRatingNotFoundError):
            await _make_uc(repo).get_my_rating(USER_ID, VENUE_ID)


# ─── update_rating ────────────────────────────────────────────────────────────


class TestUpdateRating:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_updated_rating(self):
        """Commits the transaction and returns the updated rating on success"""
        updated = _make_rating(rating=5)
        repo = _make_repo(existing_rating=_make_rating(), updated_rating=updated)
        db = AsyncMock()
        result = await VenueRatingUseCase(repo=repo, db=db).update_rating(_update_input())
        assert result.rating is updated
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when the target venue does not exist"""
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).update_rating(_update_input())

    @pytest.mark.asyncio
    async def test_raises_not_found_when_no_existing_rating(self):
        """Raises VenueRatingNotFoundError when the user has no rating to update"""
        repo = _make_repo(existing_rating=None)
        with pytest.raises(VenueRatingNotFoundError):
            await _make_uc(repo).update_rating(_update_input())

    @pytest.mark.asyncio
    async def test_repo_update_returns_none_raises_not_found_and_rolls_back(self):
        """Raises VenueRatingNotFoundError and rolls back when the repository update matches no row"""
        repo = _make_repo(existing_rating=_make_rating())
        repo.update = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(VenueRatingNotFoundError):
            await VenueRatingUseCase(repo=repo, db=db).update_rating(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back and re-raises on any unexpected repository failure"""
        repo = _make_repo(existing_rating=_make_rating())
        repo.update = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueRatingUseCase(repo=repo, db=db).update_rating(_update_input())
        db.rollback.assert_awaited_once()


# ─── delete_rating ────────────────────────────────────────────────────────────


class TestDeleteRating:
    @pytest.mark.asyncio
    async def test_success_commits_and_decrements_popularity(self):
        """Commits the transaction and decrements venue popularity on success"""
        repo = _make_repo(existing_rating=_make_rating(), deleted=True)
        db = AsyncMock()
        await VenueRatingUseCase(repo=repo, db=db).delete_rating(USER_ID, VENUE_ID)
        db.commit.assert_awaited_once()
        repo.decrement_venue_popularity.assert_awaited_once_with(VENUE_ID)

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when the target venue does not exist"""
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).delete_rating(USER_ID, VENUE_ID)

    @pytest.mark.asyncio
    async def test_raises_not_found_when_no_existing_rating(self):
        """Raises VenueRatingNotFoundError when the user has no rating to delete"""
        repo = _make_repo(existing_rating=None)
        with pytest.raises(VenueRatingNotFoundError):
            await _make_uc(repo).delete_rating(USER_ID, VENUE_ID)

    @pytest.mark.asyncio
    async def test_repo_delete_returns_false_raises_not_found_and_rolls_back(self):
        """Raises VenueRatingNotFoundError and rolls back when the repository delete matches no row"""
        repo = _make_repo(existing_rating=_make_rating(), deleted=False)
        db = AsyncMock()
        with pytest.raises(VenueRatingNotFoundError):
            await VenueRatingUseCase(repo=repo, db=db).delete_rating(USER_ID, VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back and re-raises on any unexpected repository failure"""
        repo = _make_repo(existing_rating=_make_rating())
        repo.delete = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueRatingUseCase(repo=repo, db=db).delete_rating(USER_ID, VENUE_ID)
        db.rollback.assert_awaited_once()


# ─── list_ratings ─────────────────────────────────────────────────────────────


class TestListRatings:
    @pytest.mark.asyncio
    async def test_success_returns_ratings_and_total(self):
        """Returns the rating slice and total count from the repository"""
        rating = _make_rating()
        repo = _make_repo(existing_rating=None, ratings=[rating], total=1)
        result = await _make_uc(repo).list_ratings(ListVenueRatingsInput(venue_id=VENUE_ID))
        assert result.ratings == [rating]
        assert result.total_count == 1

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_ratings(self):
        """Returns an empty list and zero count when no ratings match"""
        repo = _make_repo(existing_rating=None, ratings=[], total=0)
        result = await _make_uc(repo).list_ratings(ListVenueRatingsInput(venue_id=VENUE_ID))
        assert result.ratings == []
        assert result.total_count == 0

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError when the target venue does not exist"""
        repo = _make_repo(venue_exists=False)
        with pytest.raises(VenueNotFoundError):
            await _make_uc(repo).list_ratings(ListVenueRatingsInput(venue_id=VENUE_ID))

    @pytest.mark.asyncio
    async def test_computes_total_pages_correctly(self):
        """Calculates total_pages using ceiling division of total_count by page_size"""
        repo = _make_repo(existing_rating=None, ratings=[], total=25)
        result = await _make_uc(repo).list_ratings(ListVenueRatingsInput(venue_id=VENUE_ID, page=1, page_size=10))
        assert result.total_pages == 3
