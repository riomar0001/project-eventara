import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.venue_rating_entities import PublicVenueRating
from app.domain.entities.venue_rating_entities import VenueRating as DomainVenueRating
from app.infrastructure.database.models.venue_rating_models import VenueRating


class VenueRatingRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, rating: DomainVenueRating) -> PublicVenueRating:
        orm_rating = VenueRating(
            id=rating.id,
            user_id=rating.user_id,
            venue_id=rating.venue_id,
            rating=rating.rating,
        )
        self.db.add(orm_rating)
        await self.db.commit()
        await self.db.refresh(orm_rating)
        return PublicVenueRating.model_validate(orm_rating)

    async def get_by_id(self, rating_id: uuid.UUID) -> DomainVenueRating | None:
        result = await self.db.execute(select(VenueRating).where(VenueRating.id == rating_id))
        orm_rating = result.scalar_one_or_none()
        if not orm_rating:
            return None
        return DomainVenueRating.model_validate(orm_rating)

    async def get_by_user_and_venue(self, user_id: uuid.UUID, venue_id: uuid.UUID) -> DomainVenueRating | None:
        result = await self.db.execute(select(VenueRating).where((VenueRating.user_id == user_id) & (VenueRating.venue_id == venue_id)))
        orm_rating = result.scalar_one_or_none()
        if not orm_rating:
            return None
        return DomainVenueRating.model_validate(orm_rating)

    async def get_by_venue(self, venue_id: uuid.UUID) -> list[PublicVenueRating]:
        result = await self.db.execute(select(VenueRating).where(VenueRating.venue_id == venue_id).order_by(VenueRating.created_at.desc()))
        orm_ratings = result.scalars().all()
        return [PublicVenueRating.model_validate(r) for r in orm_ratings]

    async def update(self, rating: DomainVenueRating) -> PublicVenueRating:
        result = await self.db.execute(select(VenueRating).where(VenueRating.id == rating.id))
        orm_rating = result.scalar_one_or_none()
        if not orm_rating:
            return None

        orm_rating.rating = rating.rating

        await self.db.commit()
        await self.db.refresh(orm_rating)
        return PublicVenueRating.model_validate(orm_rating)

    async def delete(self, rating_id: uuid.UUID) -> None:
        result = await self.db.execute(select(VenueRating).where(VenueRating.id == rating_id))
        orm_rating = result.scalar_one_or_none()
        if orm_rating:
            await self.db.delete(orm_rating)
            await self.db.commit()
