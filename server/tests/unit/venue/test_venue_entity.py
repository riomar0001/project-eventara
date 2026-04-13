import uuid

import pytest
from pydantic import ValidationError

from app.domain.entities.venue_entities import Venue, VenueType


def make_venue(**overrides) -> Venue:
    payload = {
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
    }
    payload.update(overrides)
    return Venue(**payload)


def test_venue_counts_default_to_zero():
    venue = make_venue()

    assert venue.popularity_count == 0
    assert venue.usage_count == 0


@pytest.mark.parametrize(
    ("field_name", "value"),
    [
        ("popularity_count", -1),
        ("usage_count", -1),
    ],
)
def test_venue_counts_reject_negative_values(field_name: str, value: int):
    with pytest.raises(ValidationError):
        make_venue(**{field_name: value})
