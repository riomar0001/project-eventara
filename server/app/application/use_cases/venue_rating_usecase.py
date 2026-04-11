import uuid
from dataclasses import dataclass

from app.application.interfaces.venue_rating_interface import IVenueRatingRepository
from app.domain.entities.venue_rating_entities import PublicVenueRating, VenueRating
from app.domain.exceptions import (
    InvalidRatingError,
    RatingAlreadyExistsError,
    VenueRatingNotFoundError,
)


@dataclass
class CreateVenueRatingInput:
    user_id: uuid.UUID
    venue_id: uuid.UUID
    rating: int


@dataclass
class UpdateVenueRatingInput:
    rating_id: uuid.UUID
    user_id: uuid.UUID
    rating: int


@dataclass
class CreatedVenueRatingOutput:
    rating: PublicVenueRating


@dataclass
class VenueRatingDetailOutput:
    rating: VenueRating


class VenueRatingUseCase:
    def __init__(self, repo: IVenueRatingRepository) -> None:
        self.repo = repo

    async def create(self, data: CreateVenueRatingInput) -> CreatedVenueRatingOutput:
        if not 1 <= data.rating <= 5:
            raise InvalidRatingError("Rating must be between 1 and 5")

        # Check if user already rated this venue
        existing = await self.repo.get_by_user_and_venue(data.user_id, data.venue_id)
        if existing:
            raise RatingAlreadyExistsError(str(data.user_id), str(data.venue_id))

        rating = VenueRating(
            user_id=data.user_id,
            venue_id=data.venue_id,
            rating=data.rating,
        )
        created = await self.repo.create(rating)
        return CreatedVenueRatingOutput(rating=created)

    async def get_by_id(self, rating_id: uuid.UUID) -> VenueRatingDetailOutput:
        rating = await self.repo.get_by_id(rating_id)
        if not rating:
            raise VenueRatingNotFoundError(str(rating_id))
        return VenueRatingDetailOutput(rating=rating)

    async def get_by_venue(self, venue_id: uuid.UUID) -> list[PublicVenueRating]:
        return await self.repo.get_by_venue(venue_id)

    async def update(self, data: UpdateVenueRatingInput) -> CreatedVenueRatingOutput:
        if not 1 <= data.rating <= 5:
            raise InvalidRatingError("Rating must be between 1 and 5")

        rating = await self.repo.get_by_id(data.rating_id)
        if not rating:
            raise VenueRatingNotFoundError(str(data.rating_id))

        # Verify user owns this rating
        if rating.user_id != data.user_id:
            raise ValueError("User can only update their own ratings")

        updated_rating = VenueRating(
            id=data.rating_id,
            user_id=data.user_id,
            venue_id=rating.venue_id,
            rating=data.rating,
        )
        updated = await self.repo.update(updated_rating)
        return CreatedVenueRatingOutput(rating=updated)

    async def delete(self, rating_id: uuid.UUID, user_id: uuid.UUID) -> None:
        rating = await self.repo.get_by_id(rating_id)
        if not rating:
            raise VenueRatingNotFoundError(str(rating_id))

        # Verify user owns this rating
        if rating.user_id != user_id:
            raise ValueError("User can only delete their own ratings")

        await self.repo.delete(rating_id)
