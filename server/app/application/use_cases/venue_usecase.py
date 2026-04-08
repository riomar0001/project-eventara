import uuid
from dataclasses import dataclass, field, field
from dataclasses import fields as dataclass_fields
from datetime import datetime

from app.domain.entities.venue_entities import Venue, PublicVenue, VenueType
from app.domain.exceptions import VenueNotFoundError
from app.application.interfaces.venue_interface import IVenueRepository


@dataclass
class CreateVenueInput:
    creator_id: uuid.UUID
    name: str
    description: str | None
    address_line: str
    city: str
    province: str
    region: str
    postal_code: str
    country: str
    capacity: int
    venue_type: VenueType
    contact_name: str
    contact_phone: str
    contact_email: str

@dataclass
class UpdateVenueInput:
    id: uuid.UUID
    creator_id: uuid.UUID
    name: str | None = None
    description: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    country: str | None = None
    region: str | None = None
    capacity: int | None = None
    venue_type: VenueType | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None


@dataclass
class CreatedVenueOutput:
    venue: PublicVenue


@dataclass
class VenueDetailOutput:
    venue: Venue

""" @dev 
    Venue update and deletion needs to be restricted only to the creator and the admin
    will get back to the team for more details on the authorization and update this file accordingly
    ***if you know the details please go ahead and implement the authorization logic in the use case
"""
class VenueUseCase:
    def __init__(self, repo: IVenueRepository) -> None:
        self.repo = repo

    async def create(self, data: CreateVenueInput) -> CreatedVenueOutput:
        venue = Venue(
            creator_id=data.creator_id,
            name=data.name,
            description=data.description,
            address_line=data.address_line,
            city=data.city,
            province=data.province,
            region=data.region,
            postal_code=data.postal_code,
            country=data.country,
            capacity=data.capacity,
            venue_type=data.venue_type,
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            contact_email=data.contact_email,
        )
        created = await self.repo.create(venue)
        return CreatedVenueOutput(venue=created)
    
    async def update(self, venue_id: uuid.UUID, data: UpdateVenueInput) -> VenueDetailOutput:
        existing = await self.repo.get_by_id(venue_id)
        if not existing:
            raise VenueNotFoundError(str(venue_id))
        
        for field in dataclass_fields(data):
            if field.name == "venue_id":
                continue  # skip the ID fields
            value = getattr(data, field.name)
            if value is not None:
                setattr(existing, field.name, value)

        updated = await self.repo.update(existing)
        return VenueDetailOutput(venue=updated)
    
    async def delete(self, venue_id: uuid.UUID) -> None:
        existing = await self.repo.get_by_id(venue_id)
        if not existing:
            raise VenueNotFoundError(str(venue_id))
        await self.repo.delete(venue_id)

    async def get_by_id(self, venue_id: uuid.UUID) -> VenueDetailOutput:
        venue = await self.repo.get_by_id(venue_id)
        if not venue:
            raise VenueNotFoundError(str(venue_id))
        return VenueDetailOutput(venue=venue)

    async def get_by_creator(self, creator_id: uuid.UUID) -> list[PublicVenue]:
        return await self.repo.get_by_creator(creator_id)