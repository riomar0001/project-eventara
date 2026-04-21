import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.domain.entities.venue_entities import VenueType


class VenueCreateRequest(BaseModel):
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
    is_partner: bool = False
    amenities: list[str] | None = None
    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=20)
    contact_email: EmailStr


class VenueUpdateRequest(BaseModel):
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
    is_partner: bool = False
    amenities: list[str] | None = None
    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=20)
    contact_email: EmailStr


class VenueRecordResponse(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    name: str
    description: str | None
    address_line: str
    city: str
    province: str
    postal_code: str
    region: str
    country: str
    capacity: int
    venue_type: VenueType
    popularity_count: int
    usage_count: int
    is_partner: bool
    amenities: list[str] | None
    contact_name: str
    contact_phone: str
    contact_email: str
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class VenueResponse(BaseModel):
    success: bool = True
    data: VenueRecordResponse
    message: str = "Venue saved successfully."


class VenuePaginationResponse(BaseModel):
    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_next: bool
    has_previous: bool


class VenueListResponse(BaseModel):
    success: bool = True
    data: list[VenueRecordResponse]
    pagination: VenuePaginationResponse
