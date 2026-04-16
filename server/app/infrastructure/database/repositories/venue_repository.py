import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.venue_entities import PublicVenue
from app.domain.entities.venue_entities import Venue as DomainVenue
from app.infrastructure.database.models.venue_models import Venue


class VenueRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, venue: DomainVenue) -> PublicVenue:
        orm_venue = Venue(
            id=venue.id,
            creator_id=venue.creator_id,
            name=venue.name,
            description=venue.description,
            address_line=venue.address_line,
            city=venue.city,
            province=venue.province,
            postal_code=venue.postal_code,
            region=venue.region,
            country=venue.country,
            capacity=venue.capacity,
            venue_type=venue.venue_type,
            popularity_count=venue.popularity_count,
            usage_count=venue.usage_count,
            contact_name=venue.contact_name,
            contact_phone=venue.contact_phone,
            contact_email=venue.contact_email,
        )
        self.db.add(orm_venue)
        await self.db.commit()
        await self.db.refresh(orm_venue)
        return PublicVenue.model_validate(orm_venue)

    async def update(self, venue: DomainVenue) -> DomainVenue:
        orm_venue = await self.db.get(Venue, venue.id)
        if not orm_venue:
            raise ValueError(f"Venue with ID {venue.id} not found")
        orm_venue.name = venue.name
        orm_venue.description = venue.description
        orm_venue.address_line = venue.address_line
        orm_venue.city = venue.city
        orm_venue.province = venue.province
        orm_venue.postal_code = venue.postal_code
        orm_venue.region = venue.region
        orm_venue.country = venue.country
        orm_venue.capacity = venue.capacity
        orm_venue.venue_type = venue.venue_type
        orm_venue.popularity_count = venue.popularity_count
        orm_venue.usage_count = venue.usage_count
        orm_venue.contact_name = venue.contact_name
        orm_venue.contact_phone = venue.contact_phone
        orm_venue.contact_email = venue.contact_email
        await self.db.commit()
        await self.db.refresh(orm_venue)
        return DomainVenue.model_validate(orm_venue)

    async def delete(self, venue_id: uuid.UUID) -> DomainVenue:
        orm_venue = await self.db.get(Venue, venue_id)
        if not orm_venue:
            raise ValueError(f"Venue with ID {venue_id} not found")
        await self.db.delete(orm_venue)
        await self.db.commit()
        return DomainVenue.model_validate(orm_venue)

    async def get_by_id(self, venue_id: uuid.UUID) -> DomainVenue | None:
        result = await self.db.execute(select(Venue).where(Venue.id == venue_id))
        orm_venue = result.scalar_one_or_none()
        if not orm_venue:
            return None
        return DomainVenue.model_validate(orm_venue)

    async def get_by_creator(self, creator_id: uuid.UUID) -> list[PublicVenue]:
        result = await self.db.execute(select(Venue).where(Venue.creator_id == creator_id))
        orm_venues = result.scalars().all()
        return [PublicVenue.model_validate(v) for v in orm_venues]
