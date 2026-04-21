"""Unit tests for VenueManagementUseCase."""

import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.venue_dto import CreateVenueInput, ListVenuesInput, UpdateVenueInput
from app.application.use_cases.venue_usecase import VenueManagementUseCase, _normalise_amenities
from app.domain.entities.venue_entities import Venue, VenueType
from app.domain.exceptions.venue_exceptions import (
    VenueAlreadyExistsError,
    VenueInUseError,
    VenueNotFoundError,
)

# ─── Helpers ──────────────────────────────────────────────────────────────────

VENUE_ID = uuid.uuid4()
CREATOR_ID = uuid.uuid4()


def _make_venue(**overrides: Any) -> Venue:
    defaults: dict[str, Any] = dict(
        id=VENUE_ID,
        creator_id=CREATOR_ID,
        name="Davao Convention Center",
        description=None,
        address_line="123 Main St",
        city="Davao City",
        province="Davao del Sur",
        postal_code="8000",
        region="Region XI",
        country="Philippines",
        capacity=500,
        venue_type=VenueType.INDOOR,
        popularity_count=0,
        usage_count=0,
        is_partner=False,
        amenities=["Wifi", "Air Conditioning"],
        contact_name="Juan Dela Cruz",
        contact_phone="09171234567",
        contact_email="venue@example.com",
    )
    defaults.update(overrides)
    return Venue(**defaults)


def _make_repo(
    *,
    venue=None,
    venues=None,
    total=0,
    name_exists=False,
    event_count=0,
    created=None,
    updated=None,
    deleted=True,
) -> MagicMock:
    repo = MagicMock()
    repo.list_venues = AsyncMock(return_value=(venues or [], total))
    repo.get_venue_by_id = AsyncMock(return_value=venue)
    repo.name_exists_in_city = AsyncMock(return_value=name_exists)
    repo.get_event_session_count = AsyncMock(return_value=event_count)
    repo.create_venue = AsyncMock(return_value=created or _make_venue())
    repo.update_venue = AsyncMock(return_value=updated or _make_venue())
    repo.delete_venue = AsyncMock(return_value=deleted)
    return repo


def _make_uc(repo=None) -> VenueManagementUseCase:
    return VenueManagementUseCase(repo=repo or _make_repo(), db=AsyncMock())


def _create_input(**overrides: Any) -> CreateVenueInput:
    defaults: dict[str, Any] = dict(
        creator_id=CREATOR_ID,
        name="Davao Convention Center",
        address_line="123 Main St",
        city="Davao City",
        province="Davao del Sur",
        postal_code="8000",
        region="Region XI",
        country="Philippines",
        capacity=500,
        venue_type=VenueType.INDOOR,
        contact_name="Juan Dela Cruz",
        contact_phone="09171234567",
        contact_email="venue@example.com",
        amenities=["wifi", "air conditioning"],
    )
    defaults.update(overrides)
    return CreateVenueInput(**defaults)


def _update_input(**overrides: Any) -> UpdateVenueInput:
    defaults: dict[str, Any] = dict(
        venue_id=VENUE_ID,
        name="Davao Convention Center",
        address_line="123 Main St",
        city="Davao City",
        province="Davao del Sur",
        postal_code="8000",
        region="Region XI",
        country="Philippines",
        capacity=600,
        venue_type=VenueType.INDOOR,
        contact_name="Juan Dela Cruz",
        contact_phone="09171234567",
        contact_email="venue@example.com",
    )
    defaults.update(overrides)
    return UpdateVenueInput(**defaults)


# ─── _normalise_amenities ─────────────────────────────────────────────────────


class TestNormaliseAmenities:
    def test_returns_none_when_input_is_none(self):
        assert _normalise_amenities(None) is None

    def test_converts_to_title_case(self):
        assert _normalise_amenities(["wifi", "air conditioning"]) == ["Wifi", "Air Conditioning"]

    def test_strips_whitespace(self):
        assert _normalise_amenities(["  wifi  ", " parking "]) == ["Wifi", "Parking"]

    def test_deduplicates_case_insensitive(self):
        result = _normalise_amenities(["Wifi", "wifi", "WIFI"])
        assert result == ["Wifi"]

    def test_discards_blank_strings(self):
        assert _normalise_amenities(["", "   ", "wifi"]) == ["Wifi"]

    def test_returns_none_when_all_entries_blank(self):
        assert _normalise_amenities(["", "   "]) is None


# ─── list_venues ──────────────────────────────────────────────────────────────


class TestListVenues:
    @pytest.mark.asyncio
    async def test_returns_venues_and_total(self):
        venue = _make_venue()
        result = await _make_uc(_make_repo(venues=[venue], total=1)).list_venues(ListVenuesInput())
        assert result.venues == [venue]
        assert result.total_count == 1

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_venues(self):
        result = await _make_uc(_make_repo(venues=[], total=0)).list_venues(ListVenuesInput())
        assert result.venues == []
        assert result.total_count == 0

    @pytest.mark.asyncio
    async def test_computes_total_pages_correctly(self):
        result = await _make_uc(_make_repo(venues=[], total=25)).list_venues(ListVenuesInput(page=1, page_size=10))
        assert result.total_pages == 3


# ─── get_venue ────────────────────────────────────────────────────────────────


class TestGetVenue:
    @pytest.mark.asyncio
    async def test_success(self):
        venue = _make_venue()
        result = await _make_uc(_make_repo(venue=venue)).get_venue(VENUE_ID)
        assert result.venue is venue

    @pytest.mark.asyncio
    async def test_raises_not_found_when_missing(self):
        with pytest.raises(VenueNotFoundError):
            await _make_uc(_make_repo(venue=None)).get_venue(VENUE_ID)


# ─── create_venue ─────────────────────────────────────────────────────────────


class TestCreateVenue:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_venue(self):
        venue = _make_venue()
        repo = _make_repo(name_exists=False, created=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input())
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_normalises_amenities_to_title_case(self):
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input(amenities=["wifi", "air conditioning"]))
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["amenities"] == ["Wifi", "Air Conditioning"]

    @pytest.mark.asyncio
    async def test_duplicate_name_in_city_raises_already_exists(self):
        repo = _make_repo(name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        repo = _make_repo(name_exists=False)
        repo.create_venue = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input())
        db.rollback.assert_awaited_once()


# ─── update_venue ─────────────────────────────────────────────────────────────


class TestUpdateVenue:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_venue(self):
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False, updated=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_skips_uniqueness_check_when_name_and_city_unchanged(self):
        venue = _make_venue(name="Davao Convention Center", city="Davao City")
        repo = _make_repo(venue=venue, updated=venue)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(name="Davao Convention Center", city="Davao City"))
        repo.name_exists_in_city.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_checks_uniqueness_when_name_changes(self):
        venue = _make_venue(name="Old Name")
        repo = _make_repo(venue=venue, name_exists=False, updated=venue)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(name="New Name"))
        repo.name_exists_in_city.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_normalises_amenities_to_title_case(self):
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False, updated=venue)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(amenities=["parking", "restroom"]))
        call_kwargs = repo.update_venue.call_args.kwargs
        assert call_kwargs["amenities"] == ["Parking", "Restroom"]

    @pytest.mark.asyncio
    async def test_venue_not_found_raises(self):
        repo = _make_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_name_conflict_raises_already_exists(self):
        venue = _make_venue(name="Old Name")
        repo = _make_repo(venue=venue, name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(name="Taken Name"))
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_repo_update_returns_none_raises_not_found(self):
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False, updated=None)
        repo.update_venue = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False)
        repo.update_venue = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        db.rollback.assert_awaited_once()


# ─── delete_venue ─────────────────────────────────────────────────────────────


class TestDeleteVenue:
    @pytest.mark.asyncio
    async def test_success_commits(self):
        repo = _make_repo(venue=_make_venue(), event_count=0, deleted=True)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        repo.delete_venue.assert_awaited_once_with(VENUE_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_venue_not_found_raises(self):
        repo = _make_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_venue_with_event_sessions_raises_in_use(self):
        repo = _make_repo(venue=_make_venue(), event_count=3)
        db = AsyncMock()
        with pytest.raises(VenueInUseError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_delete_returns_false_raises_not_found(self):
        repo = _make_repo(venue=_make_venue(), event_count=0, deleted=False)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        repo = _make_repo(venue=_make_venue(), event_count=0)
        repo.delete_venue = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()
