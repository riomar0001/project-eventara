import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.dto.venue_dto import GetVenueCapacityInput
from app.application.use_cases.venue_query_usecase import GetVenueCapacityUseCase
from app.domain.entities.venue_entities import Venue, VenueType
from app.domain.exceptions.venue_exceptions import VenueNotFoundError
from app.infrastructure.database.repositories.venue_repository import VenueRepository

VENUE_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CREATOR_ID = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")


def _sample_venue(**overrides) -> Venue:
    defaults = dict(
        id=VENUE_ID,
        creator_id=CREATOR_ID,
        name="Makati Sports Complex",
        address_line="Gil Puyat Ave",
        city="Makati",
        province="Metro Manila",
        postal_code="1200",
        region="NCR",
        country="Philippines",
        capacity=500,
        venue_type=VenueType.INDOOR,
    )
    defaults.update(overrides)
    return Venue(**defaults)


def _make_repo():
    repo = MagicMock(spec=VenueRepository)
    repo.get_venue_by_id = AsyncMock(return_value=_sample_venue())
    return repo


def _make_uc(repo=None):
    repo = repo or _make_repo()
    return GetVenueCapacityUseCase(repo), repo


class TestGetVenueCapacityUseCase:
    @pytest.mark.asyncio
    async def test_returns_capacity_for_valid_venue_id(self):
        uc, _ = _make_uc()
        result = await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))
        assert result.capacity == 500

    @pytest.mark.asyncio
    async def test_returns_venue_id_in_output(self):
        uc, _ = _make_uc()
        result = await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))
        assert result.venue_id == VENUE_ID

    @pytest.mark.asyncio
    async def test_returns_venue_name_in_output(self):
        uc, _ = _make_uc()
        result = await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))
        assert result.name == "Makati Sports Complex"

    @pytest.mark.asyncio
    async def test_raises_venue_not_found_when_repo_returns_none(self):
        repo = _make_repo()
        repo.get_venue_by_id = AsyncMock(return_value=None)
        uc = GetVenueCapacityUseCase(repo)
        with pytest.raises(VenueNotFoundError):
            await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))

    @pytest.mark.asyncio
    async def test_calls_repository_with_supplied_venue_id(self):
        uc, repo = _make_uc()
        await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))
        repo.get_venue_by_id.assert_called_once_with(VENUE_ID)

    @pytest.mark.asyncio
    async def test_does_not_request_row_lock_for_read_only_query(self):
        uc, repo = _make_uc()
        await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))
        call_kwargs = repo.get_venue_by_id.call_args
        assert call_kwargs == ((VENUE_ID,), {})

    @pytest.mark.asyncio
    async def test_returns_correct_capacity_for_large_venue(self):
        repo = _make_repo()
        repo.get_venue_by_id = AsyncMock(return_value=_sample_venue(capacity=10000))
        uc = GetVenueCapacityUseCase(repo)
        result = await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))
        assert result.capacity == 10000

    @pytest.mark.asyncio
    async def test_venue_not_found_error_message_contains_venue_id(self):
        repo = _make_repo()
        repo.get_venue_by_id = AsyncMock(return_value=None)
        uc = GetVenueCapacityUseCase(repo)
        with pytest.raises(VenueNotFoundError, match=str(VENUE_ID)):
            await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=VENUE_ID))

    @pytest.mark.asyncio
    async def test_output_venue_id_matches_input_venue_id(self):
        other_id = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
        repo = _make_repo()
        repo.get_venue_by_id = AsyncMock(return_value=_sample_venue(id=other_id))
        uc = GetVenueCapacityUseCase(repo)
        result = await uc.get_venue_capacity(GetVenueCapacityInput(venue_id=other_id))
        assert result.venue_id == other_id
