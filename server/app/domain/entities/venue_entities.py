import uuid
from datetime import datetime
from enum import IntEnum, StrEnum

from pydantic import BaseModel, Field


class VenueType(StrEnum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    HYBRID = "hybrid"


class RatingValue(IntEnum):
    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5


class Venue(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    creator_id: uuid.UUID
    image_file_id: uuid.UUID | None = None
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    address_line: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    region: str = Field(min_length=1, max_length=100)
    country: str = Field(min_length=1, max_length=100)
    capacity: int = Field(gt=0)
    venue_type: VenueType
    popularity_count: int = Field(default=0, ge=0)
    usage_count: int = Field(default=0, ge=0)
    is_partner: bool = False
    amenities: list[str] | None = None
    contact_name: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=20)
    contact_email: str | None = Field(default=None, max_length=255)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PublicVenue(BaseModel):
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


class VenueRating(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
