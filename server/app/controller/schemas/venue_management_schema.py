import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.sanitize import sanitize_html
from app.domain.entities.venue_entities import VenueType


class _VenueBaseRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None)
    image_url: str | None = Field(default=None, max_length=512)
    address_line: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    region: str = Field(min_length=1, max_length=100)
    country: str = Field(min_length=1, max_length=100)
    capacity: int = Field(gt=0)
    venue_type: VenueType
    amenities: list[str] | None = None

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return sanitize_html(v) or None


class CommunityVenueCreateRequest(_VenueBaseRequest):
    """Venue suggested by the community — contact information is optional."""

    contact_name: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=20)
    contact_email: EmailStr | None = None


class OfficialVenueCreateRequest(_VenueBaseRequest):
    """Officially managed venue — contact information is required."""

    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=20)
    contact_email: EmailStr


# Kept for backward compatibility with the update endpoint.
class VenueCreateRequest(_VenueBaseRequest):
    is_partner: bool = False
    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=20)
    contact_email: EmailStr


class VenueUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None)
    image_url: str | None = Field(default=None, max_length=512)
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

    @field_validator("description", mode="before")
    @classmethod
    def sanitize_description(cls, v: str | None) -> str | None:
        if v is None:
            return None
        return sanitize_html(v) or None


class VenueRecordResponse(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    image_url: str | None = None
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
    contact_name: str | None
    contact_phone: str | None
    contact_email: str | None
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


class PublicVenueRecordResponse(BaseModel):
    id: uuid.UUID
    image_url: str | None = None
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
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class PublicVenueResponse(BaseModel):
    success: bool = True
    data: PublicVenueRecordResponse


class PublicVenueListResponse(BaseModel):
    success: bool = True
    data: list[PublicVenueRecordResponse]
    pagination: VenuePaginationResponse


class VenueCapacityData(BaseModel):
    id: uuid.UUID
    name: str
    capacity: int


class VenueCapacityResponse(BaseModel):
    success: bool = True
    message: str = "Venue capacity retrieved successfully."
    data: VenueCapacityData


class VenueImageUploadRequest(BaseModel):
    content_type: str = Field(min_length=1, max_length=100)


class VenueImageUploadData(BaseModel):
    upload_url: str
    object_key: str
    public_url: str
    expires_in: int


class VenueImageUploadResponse(BaseModel):
    success: bool = True
    message: str = "Venue image upload URL generated. Use upload_url to PUT your image directly to storage."
    data: VenueRecordResponse
    upload: VenueImageUploadData
