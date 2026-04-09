import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreateVenueRatingRequest(BaseModel):
    venue_id: uuid.UUID
    rating: int = Field(ge=1, le=5)


class UpdateVenueRatingRequest(BaseModel):
    rating: int = Field(ge=1, le=5)


class VenueRatingResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int
    created_at: datetime | None


class CreateVenueRatingResponse(BaseModel):
    success: bool = True
    rating_id: uuid.UUID
    rating: int
    message: str = "Rating created successfully."


class UpdateVenueRatingResponse(BaseModel):
    success: bool = True
    rating_id: uuid.UUID
    rating: int
    message: str = "Rating updated successfully."


class DeleteVenueRatingResponse(BaseModel):
    success: bool = True
    rating_id: uuid.UUID
    message: str = "Rating deleted successfully."