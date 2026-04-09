import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreateVenueRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    address_line: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    region: str = Field(min_length=1, max_length=100)
    country: str = Field(min_length=1, max_length=100)
    capacity: int = Field(gt=0)
    venue_type: str
    contact_name: str = Field(min_length=1, max_length=255)
    contact_phone: str = Field(min_length=1, max_length=20)
    contact_email: str = Field(min_length=1, max_length=255)


class VenueResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    address_line: str
    city: str
    province: str
    postal_code: str
    region: str
    country: str
    capacity: int
    venue_type: str
    contact_name: str
    contact_phone: str
    contact_email: str
    created_at: datetime | None


class CreateVenueResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    name: str
    message: str = "Venue created successfully."
    
class UpdateVenueRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    country: str | None = None
    region: str | None = None
    capacity: int | None = None
    venue_type: str | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None
    
class UpdateVenueResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    name: str | None = None
    message: str = "Venue updated successfully."

class DeleteVenueResponse(BaseModel):
    success: bool = True
    venue_id: uuid.UUID
    message: str = "Venue deleted successfully."
    
class VenueDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    address_line: str
    city: str
    province: str
    postal_code: str
    region: str
    country: str
    capacity: int
    venue_type: str
    contact_name: str
    contact_phone: str
    contact_email: str
    created_at: datetime | None
