import uuid
from datetime import datetime
from enum import IntEnum

from pydantic import BaseModel, Field


class RatingValue(IntEnum):
    """Rating values from 1 to 5 stars"""

    ONE = 1
    TWO = 2
    THREE = 3
    FOUR = 4
    FIVE = 5


class VenueRating(BaseModel):
    """Venue Rating entity definition"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int = Field(ge=1, le=5, description="Rating value from 1 to 5")

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
