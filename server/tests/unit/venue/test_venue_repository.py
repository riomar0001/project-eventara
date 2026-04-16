import uuid
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domain.entities.venue_entities import Venue as DomainVenue
from app.domain.entities.venue_entities import VenueType
from app.infrastructure.database.repositories.venue_repository import VenueRepository

MODULE = "app.infrastructure.database.repositories.venue_repository"


def make_domain_venue(**overrides) -> DomainVenue:
    payload = {
        "id": uuid.uuid4(),
        "creator_id": uuid.uuid4(),
        "name": "Main Hall",
        "description": "Large indoor venue",
        "address_line": "123 Center St",
        "city": "Toronto",
        "province": "Ontario",
        "postal_code": "A1A1A1",
        "region": "GTA",
        "country": "Canada",
        "capacity": 300,
        "venue_type": VenueType.INDOOR,
        "contact_name": "Venue Admin",
        "contact_phone": "+1-555-0100",
        "contact_email": "venue@example.com",
        "popularity_count": 12,
        "usage_count": 34,
    }
    payload.update(overrides)
    return DomainVenue(**payload)


class FakeOrmVenue:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


@pytest.mark.asyncio
async def test_create_maps_popularity_and_usage_counts_to_orm():
    db = MagicMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    repo = VenueRepository(db)
    venue = make_domain_venue()

    with (
        patch(f"{MODULE}.Venue", new=FakeOrmVenue),
        patch(f"{MODULE}.PublicVenue.model_validate", return_value=MagicMock()),
    ):
        await repo.create(venue)

    orm_object = db.add.call_args.args[0]
    assert orm_object.popularity_count == 12
    assert orm_object.usage_count == 34


@pytest.mark.asyncio
async def test_get_by_id_maps_counts_from_orm_to_domain():
    venue_id = uuid.uuid4()
    orm_venue = SimpleNamespace(
        id=venue_id,
        creator_id=uuid.uuid4(),
        name="Main Hall",
        description="Large indoor venue",
        address_line="123 Center St",
        city="Toronto",
        province="Ontario",
        postal_code="A1A1A1",
        region="GTA",
        country="Canada",
        capacity=300,
        venue_type=VenueType.INDOOR,
        popularity_count=9,
        usage_count=27,
        contact_name="Venue Admin",
        contact_phone="+1-555-0100",
        contact_email="venue@example.com",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    result = MagicMock()
    result.scalar_one_or_none.return_value = orm_venue

    db = MagicMock()
    db.execute = AsyncMock(return_value=result)

    repo = VenueRepository(db)
    domain_venue = await repo.get_by_id(venue_id)

    assert domain_venue is not None
    assert domain_venue.popularity_count == 9
    assert domain_venue.usage_count == 27
