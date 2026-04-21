import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EventRating(BaseModel):
    """Event Rating entity definition - Attendee reviews for events"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    event_id: uuid.UUID

    # Core rating (1-5 stars)
    overall_rating: int = Field(ge=1, le=5, description="Overall rating from 1 to 5")

    # Aspect ratings (optional)
    organization_rating: int | None = Field(default=None, ge=1, le=5, description="Organization rating")
    venue_rating: int | None = Field(default=None, ge=1, le=5, description="Venue rating")
    activities_rating: int | None = Field(default=None, ge=1, le=5, description="Activities rating")

    # Review content
    title: str = Field(min_length=5, max_length=100)
    review: str = Field(min_length=10, max_length=2000)

    # Engagement
    would_recommend: bool = True
    media_urls: list[str] | None = None
    helpful_count: int = Field(default=0, ge=0)

    # Creator response
    creator_response: str | None = Field(default=None, max_length=1000)
    creator_responded_at: datetime | None = None

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
