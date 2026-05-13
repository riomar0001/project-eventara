"""Functional test cases for VenueManagementUseCase."""

import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.venue_dto import (
    CreateVenueInput,
    DeleteSuggestedVenueInput,
    ListVenuesInput,
    UpdateSuggestedVenueInput,
    UpdateVenueInput,
)
from app.application.use_cases.venue_usecase import VenueManagementUseCase, _normalise_amenities
from app.domain.entities.venue_entities import Venue, VenueType
from app.domain.exceptions.venue_exceptions import (
    UnauthorizedVenueOperationError,
    VenueAlreadyExistsError,
    VenueInUseError,
    VenueNotCommunitySuggestionError,
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
        contact_name=None,
        contact_phone=None,
        contact_email=None,
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
        image_url="https://cdn.example.com/venue.jpg",
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
        image_url="https://cdn.example.com/updated-venue.jpg",
        contact_name="Juan Dela Cruz",
        contact_phone="09171234567",
        contact_email="venue@example.com",
    )
    defaults.update(overrides)
    return UpdateVenueInput(**defaults)


def _update_suggested_input(**overrides: Any) -> UpdateSuggestedVenueInput:
    defaults: dict[str, Any] = dict(
        venue_id=VENUE_ID,
        updated_by=CREATOR_ID,
        name="Updated Community Hall",
        address_line="456 Side St",
        city="Davao City",
        province="Davao del Sur",
        postal_code="8000",
        region="Region XI",
        country="Philippines",
        capacity=300,
        venue_type=VenueType.HYBRID,
        image_url="venue-image/community-hall.jpg",
        amenities=["parking", "wifi"],
        contact_name="Juan Dela Cruz",
        contact_phone="09171234567",
        contact_email="juan@example.com",
    )
    defaults.update(overrides)
    return UpdateSuggestedVenueInput(**defaults)


def _delete_suggested_input(**overrides: Any) -> DeleteSuggestedVenueInput:
    defaults: dict[str, Any] = dict(venue_id=VENUE_ID, deleted_by=CREATOR_ID)
    defaults.update(overrides)
    return DeleteSuggestedVenueInput(**defaults)


# ─── _normalise_amenities ─────────────────────────────────────────────────────


class TestNormaliseAmenities:
    def test_returns_none_when_input_is_none(self):
        """Returns None when amenities input is None"""
        assert _normalise_amenities(None) is None

    def test_converts_to_title_case(self):
        """Converts each amenity string to Title Case"""
        assert _normalise_amenities(["wifi", "air conditioning"]) == ["Wifi", "Air Conditioning"]

    def test_strips_whitespace(self):
        """Strips leading and trailing whitespace from each amenity"""
        assert _normalise_amenities(["  wifi  ", " parking "]) == ["Wifi", "Parking"]

    def test_deduplicates_case_insensitive(self):
        """Deduplicates amenity entries regardless of original casing"""
        result = _normalise_amenities(["Wifi", "wifi", "WIFI"])
        assert result == ["Wifi"]

    def test_discards_blank_strings(self):
        """Discards blank and whitespace-only strings silently"""
        assert _normalise_amenities(["", "   ", "wifi"]) == ["Wifi"]

    def test_returns_none_when_all_entries_blank(self):
        """Returns None when every entry in the list is blank"""
        assert _normalise_amenities(["", "   "]) is None


# ─── list_venues ──────────────────────────────────────────────────────────────


class TestListVenues:
    @pytest.mark.asyncio
    async def test_returns_venues_and_total(self):
        """Returns the venue slice and total count from the repository"""
        venue = _make_venue()
        result = await _make_uc(_make_repo(venues=[venue], total=1)).list_venues(ListVenuesInput())
        assert result.venues == [venue]
        assert result.total_count == 1

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_venues(self):
        """Returns an empty list and zero count when no venues match"""
        result = await _make_uc(_make_repo(venues=[], total=0)).list_venues(ListVenuesInput())
        assert result.venues == []
        assert result.total_count == 0

    @pytest.mark.asyncio
    async def test_computes_total_pages_correctly(self):
        """Calculates total_pages by dividing total_count by page_size with ceiling division"""
        result = await _make_uc(_make_repo(venues=[], total=25)).list_venues(ListVenuesInput(page=1, page_size=10))
        assert result.total_pages == 3


# ─── get_venue ────────────────────────────────────────────────────────────────


class TestGetVenue:
    @pytest.mark.asyncio
    async def test_success(self):
        """Returns the matching VenueOutput for a valid venue ID"""
        venue = _make_venue()
        result = await _make_uc(_make_repo(venue=venue)).get_venue(VENUE_ID)
        assert result.venue is venue

    @pytest.mark.asyncio
    async def test_raises_not_found_when_missing(self):
        """Raises VenueNotFoundError when no venue matches the given ID"""
        with pytest.raises(VenueNotFoundError):
            await _make_uc(_make_repo(venue=None)).get_venue(VENUE_ID)


# ─── create_venue ─────────────────────────────────────────────────────────────


class TestCreateVenue:
    @pytest.mark.asyncio
    async def test_success_commits_and_returns_venue(self):
        """Creates the venue, commits the transaction, and returns VenueOutput"""
        venue = _make_venue()
        repo = _make_repo(name_exists=False, created=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input())
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_normalises_amenities_to_title_case(self):
        """Persists amenity names converted to Title Case regardless of input casing"""
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input(amenities=["wifi", "air conditioning"]))
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["amenities"] == ["Wifi", "Air Conditioning"]
        assert call_kwargs["image_url"] == "https://cdn.example.com/venue.jpg"

    @pytest.mark.asyncio
    async def test_duplicate_name_in_city_raises_already_exists(self):
        """Raises VenueAlreadyExistsError and rolls back when the name is taken in the same city"""
        repo = _make_repo(name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back the transaction and re-raises on any unexpected database error"""
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
        """Updates the venue, commits the transaction, and returns the updated VenueOutput"""
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False, updated=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_skips_uniqueness_check_when_name_and_city_unchanged(self):
        """Skips the name-city uniqueness check when neither name nor city has changed"""
        venue = _make_venue(name="Davao Convention Center", city="Davao City")
        repo = _make_repo(venue=venue, updated=venue)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(name="Davao Convention Center", city="Davao City"))
        repo.name_exists_in_city.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_checks_uniqueness_when_name_changes(self):
        """Re-validates name uniqueness within the city when the name is changed"""
        venue = _make_venue(name="Old Name")
        repo = _make_repo(venue=venue, name_exists=False, updated=venue)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(name="New Name"))
        repo.name_exists_in_city.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_normalises_amenities_to_title_case(self):
        """Persists updated amenity names converted to Title Case"""
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False, updated=venue)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(amenities=["parking", "restroom"]))
        call_kwargs = repo.update_venue.call_args.kwargs
        assert call_kwargs["amenities"] == ["Parking", "Restroom"]
        assert call_kwargs["image_url"] == "https://cdn.example.com/updated-venue.jpg"

    @pytest.mark.asyncio
    async def test_venue_not_found_raises(self):
        """Raises VenueNotFoundError and rolls back when no venue matches the ID"""
        repo = _make_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_name_conflict_raises_already_exists(self):
        """Raises VenueAlreadyExistsError and rolls back when the new name conflicts in the same city"""
        venue = _make_venue(name="Old Name")
        repo = _make_repo(venue=venue, name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input(name="Taken Name"))
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_repo_update_returns_none_raises_not_found(self):
        """Raises VenueNotFoundError and rolls back when the repository update finds no matching row"""
        venue = _make_venue()
        repo = _make_repo(venue=venue, name_exists=False)
        repo.update_venue = AsyncMock(return_value=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).update_venue(_update_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back the transaction and re-raises on any unexpected database error"""
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
        """Deletes the venue and commits the transaction when no event sessions reference it"""
        repo = _make_repo(venue=_make_venue(), event_count=0, deleted=True)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        repo.delete_venue.assert_awaited_once_with(VENUE_ID)
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_venue_not_found_raises(self):
        """Raises VenueNotFoundError and rolls back when no venue matches the ID"""
        repo = _make_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_venue_with_event_sessions_raises_in_use(self):
        """Raises VenueInUseError and rolls back when event sessions still reference the venue"""
        repo = _make_repo(venue=_make_venue(), event_count=3)
        db = AsyncMock()
        with pytest.raises(VenueInUseError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_delete_returns_false_raises_not_found(self):
        """Raises VenueNotFoundError and rolls back when the repository delete finds no matching row"""
        repo = _make_repo(venue=_make_venue(), event_count=0, deleted=False)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_unexpected_error_rolls_back(self):
        """Rolls back the transaction and re-raises on any unexpected database error"""
        repo = _make_repo(venue=_make_venue(), event_count=0)
        repo.delete_venue = AsyncMock(side_effect=RuntimeError("db failure"))
        db = AsyncMock()
        with pytest.raises(RuntimeError):
            await VenueManagementUseCase(repo=repo, db=db).delete_venue(VENUE_ID)
        db.rollback.assert_awaited_once()


# ─── create_venue (community) ─────────────────────────────────────────────────


class TestCreateCommunityVenue:
    @pytest.mark.asyncio
    async def test_is_partner_stored_as_false(self):
        """Passes is_partner=False to the repository when creating a community venue"""
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input(is_partner=False))
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["is_partner"] is False

    @pytest.mark.asyncio
    async def test_contact_fields_are_none_when_omitted(self):
        """Passes None for all contact fields when none are supplied in the input"""
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input(is_partner=False))
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["contact_name"] is None
        assert call_kwargs["contact_phone"] is None
        assert call_kwargs["contact_email"] is None

    @pytest.mark.asyncio
    async def test_optional_contact_fields_passed_when_provided(self):
        """Passes contact fields verbatim to the repository when optionally supplied for a community venue"""
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(
            _create_input(is_partner=False, contact_name="Juan Dela Cruz", contact_phone="09171234567", contact_email="juan@example.com")
        )
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["contact_name"] == "Juan Dela Cruz"
        assert call_kwargs["contact_phone"] == "09171234567"
        assert call_kwargs["contact_email"] == "juan@example.com"

    @pytest.mark.asyncio
    async def test_success_commits_and_returns_venue(self):
        """Creates the community venue, commits the transaction, and returns VenueOutput"""
        venue = _make_venue(is_partner=False)
        repo = _make_repo(name_exists=False, created=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input(is_partner=False))
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_already_exists(self):
        """Raises VenueAlreadyExistsError and rolls back when the name is taken in the same city"""
        repo = _make_repo(name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).create_venue(_create_input(is_partner=False))
        db.rollback.assert_awaited_once()


class TestUpdateSuggestedVenue:
    @pytest.mark.asyncio
    async def test_success_updates_owner_suggestion_and_returns_old_state(self):
        """Updates a caller-owned suggestion, commits once, and returns old plus new venue state"""
        old_venue = _make_venue(is_partner=False)
        updated_venue = _make_venue(name="Updated Community Hall", is_partner=False)
        repo = _make_repo(venue=old_venue, updated=updated_venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).update_suggested_venue(_update_suggested_input())
        repo.get_venue_by_id.assert_awaited_once_with(VENUE_ID, for_update=True)
        repo.update_venue.assert_awaited_once()
        call_kwargs = repo.update_venue.call_args.kwargs
        assert call_kwargs["is_partner"] is False
        assert call_kwargs["amenities"] == ["Parking", "Wifi"]
        assert result.venue is updated_venue
        assert result.old_venue is old_venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError and rolls back when the suggestion does not exist"""
        repo = _make_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).update_suggested_venue(_update_suggested_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_when_venue_is_partner(self):
        """Raises VenueNotCommunitySuggestionError and rolls back for official partner venues"""
        repo = _make_repo(venue=_make_venue(is_partner=True))
        db = AsyncMock()
        with pytest.raises(VenueNotCommunitySuggestionError):
            await VenueManagementUseCase(repo=repo, db=db).update_suggested_venue(_update_suggested_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_when_actor_is_not_creator(self):
        """Raises UnauthorizedVenueOperationError and rolls back when the caller is not the creator"""
        repo = _make_repo(venue=_make_venue(creator_id=uuid.uuid4()))
        db = AsyncMock()
        with pytest.raises(UnauthorizedVenueOperationError):
            await VenueManagementUseCase(repo=repo, db=db).update_suggested_venue(_update_suggested_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_already_exists(self):
        """Raises VenueAlreadyExistsError and rolls back when the new name conflicts in the city"""
        repo = _make_repo(venue=_make_venue(name="Old Name"), name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).update_suggested_venue(_update_suggested_input(name="New Name"))
        db.rollback.assert_awaited_once()


class TestDeleteSuggestedVenue:
    @pytest.mark.asyncio
    async def test_success_deletes_owner_suggestion_and_returns_old_state(self):
        """Deletes a caller-owned unused suggestion, commits once, and returns deleted venue state"""
        venue = _make_venue(is_partner=False)
        repo = _make_repo(venue=venue, event_count=0, deleted=True)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).delete_suggested_venue(_delete_suggested_input())
        repo.get_venue_by_id.assert_awaited_once_with(VENUE_ID, for_update=True)
        repo.get_event_session_count.assert_awaited_once_with(VENUE_ID)
        repo.delete_venue.assert_awaited_once_with(VENUE_ID)
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_not_found_when_venue_missing(self):
        """Raises VenueNotFoundError and rolls back when the suggestion does not exist"""
        repo = _make_repo(venue=None)
        db = AsyncMock()
        with pytest.raises(VenueNotFoundError):
            await VenueManagementUseCase(repo=repo, db=db).delete_suggested_venue(_delete_suggested_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_when_venue_is_partner(self):
        """Raises VenueNotCommunitySuggestionError and rolls back for official partner venues"""
        repo = _make_repo(venue=_make_venue(is_partner=True))
        db = AsyncMock()
        with pytest.raises(VenueNotCommunitySuggestionError):
            await VenueManagementUseCase(repo=repo, db=db).delete_suggested_venue(_delete_suggested_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_when_actor_is_not_creator(self):
        """Raises UnauthorizedVenueOperationError and rolls back when the caller is not the creator"""
        repo = _make_repo(venue=_make_venue(creator_id=uuid.uuid4()))
        db = AsyncMock()
        with pytest.raises(UnauthorizedVenueOperationError):
            await VenueManagementUseCase(repo=repo, db=db).delete_suggested_venue(_delete_suggested_input())
        db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_raises_when_venue_has_event_sessions(self):
        """Raises VenueInUseError and rolls back when event sessions still reference the suggestion"""
        repo = _make_repo(venue=_make_venue(is_partner=False), event_count=1)
        db = AsyncMock()
        with pytest.raises(VenueInUseError):
            await VenueManagementUseCase(repo=repo, db=db).delete_suggested_venue(_delete_suggested_input())
        db.rollback.assert_awaited_once()


# ─── create_venue (official) ──────────────────────────────────────────────────


class TestCreateOfficialVenue:
    @pytest.mark.asyncio
    async def test_is_partner_stored_as_true(self):
        """Passes is_partner=True to the repository when creating an official venue"""
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(
            _create_input(is_partner=True, contact_name="Maria Santos", contact_phone="09171234567", contact_email="contact@venue.ph")
        )
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["is_partner"] is True

    @pytest.mark.asyncio
    async def test_contact_fields_passed_to_repo(self):
        """Passes all three contact fields verbatim to the repository"""
        repo = _make_repo(name_exists=False)
        db = AsyncMock()
        await VenueManagementUseCase(repo=repo, db=db).create_venue(
            _create_input(is_partner=True, contact_name="Maria Santos", contact_phone="09171234567", contact_email="contact@venue.ph")
        )
        call_kwargs = repo.create_venue.call_args.kwargs
        assert call_kwargs["contact_name"] == "Maria Santos"
        assert call_kwargs["contact_phone"] == "09171234567"
        assert call_kwargs["contact_email"] == "contact@venue.ph"

    @pytest.mark.asyncio
    async def test_success_commits_and_returns_venue(self):
        """Creates the official venue, commits the transaction, and returns VenueOutput"""
        venue = _make_venue(is_partner=True, contact_name="Maria Santos", contact_phone="09171234567", contact_email="contact@venue.ph")
        repo = _make_repo(name_exists=False, created=venue)
        db = AsyncMock()
        result = await VenueManagementUseCase(repo=repo, db=db).create_venue(
            _create_input(is_partner=True, contact_name="Maria Santos", contact_phone="09171234567", contact_email="contact@venue.ph")
        )
        assert result.venue is venue
        db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_duplicate_name_raises_already_exists(self):
        """Raises VenueAlreadyExistsError and rolls back when the name is taken in the same city"""
        repo = _make_repo(name_exists=True)
        db = AsyncMock()
        with pytest.raises(VenueAlreadyExistsError):
            await VenueManagementUseCase(repo=repo, db=db).create_venue(
                _create_input(is_partner=True, contact_name="Maria Santos", contact_phone="09171234567", contact_email="contact@venue.ph")
            )
        db.rollback.assert_awaited_once()
