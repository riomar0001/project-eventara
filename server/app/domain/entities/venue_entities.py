import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field

"""Venue classification init
   will ask the team for more details on the classification of venues and update this file accordingly 
"""


class VenueType(StrEnum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    HYBRID = "hybrid"


"""Venue entity definition"""


class Venue(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    creator_id: uuid.UUID
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)

    # Address fields
    address_line: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    region: str = Field(min_length=1, max_length=100)
    country: str = Field(min_length=1, max_length=100)

    # Venue details
    capacity: int = Field(gt=0)  # Must be greater than 0
    venue_type: VenueType

    # Contact information
    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=20)
    contact_email: str = Field(min_length=1, max_length=255)

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PublicVenue(BaseModel):
    """Public venue view (without sensitive info)"""

    id: uuid.UUID
    name: str
    description: str | None
    address_line: str
    city: str
    province: str
    region: str
    postal_code: str
    country: str
    capacity: int
    venue_type: VenueType
    contact_name: str
    contact_phone: str
    contact_email: str
    created_at: datetime | None

    model_config = {"from_attributes": True}
