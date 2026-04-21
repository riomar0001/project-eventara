import math
import uuid
from dataclasses import dataclass

from app.domain.entities.venue_entities import VenueRating


@dataclass
class CreateVenueRatingInput:
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int
    comment: str | None = None


@dataclass
class UpdateVenueRatingInput:
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int
    comment: str | None = None


@dataclass
class VenueRatingOutput:
    rating: VenueRating


@dataclass
class VenueAverageRatingOutput:
    venue_id: uuid.UUID
    average: float | None
    count: int


@dataclass
class ListVenueRatingsInput:
    venue_id: uuid.UUID
    page: int = 1
    page_size: int = 10


@dataclass
class ListVenueRatingsOutput:
    ratings: list[VenueRating]
    total_count: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        return math.ceil(self.total_count / self.page_size) if self.page_size else 0
