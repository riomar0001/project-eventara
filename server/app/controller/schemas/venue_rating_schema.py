import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class VenueRatingCreateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class VenueRatingUpdateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class VenueRatingRecordResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime | None
    updated_at: datetime | None

    model_config = {"from_attributes": True}


class VenueRatingResponse(BaseModel):
    success: bool = True
    data: VenueRatingRecordResponse
    message: str = "Rating saved successfully."


class VenueRatingPaginationResponse(BaseModel):
    page: int
    page_size: int
    total_count: int
    total_pages: int
    has_next: bool
    has_previous: bool


class VenueRatingListResponse(BaseModel):
    success: bool = True
    data: list[VenueRatingRecordResponse]
    pagination: VenueRatingPaginationResponse


class VenueRatingDeleteResponse(BaseModel):
    success: bool = True
    message: str = "Rating removed successfully."


class VenueRatingAverageData(BaseModel):
    venue_id: uuid.UUID
    average: float | None
    count: int


class VenueRatingAverageResponse(BaseModel):
    success: bool = True
    data: VenueRatingAverageData
