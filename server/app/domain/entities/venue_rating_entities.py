import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class VenueRating(BaseModel):
    """Venue rating domain entity"""
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int = Field(ge=1, le=5)  # Rating from 1-5
    
    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class PublicVenueRating(BaseModel):
    """Public venue rating view"""
    id: uuid.UUID
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int
    created_at: datetime | None

    model_config = {"from_attributes": True}