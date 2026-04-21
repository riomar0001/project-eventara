"""Application service for venue CRUD operations."""

import uuid

from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import IntegrityError

from app.application.interfaces.venue_interface import IVenueRepository
from app.domain.entities.venue_entities import PublicVenue, Venue, VenueType
from app.domain.exceptions.venue_exceptions import (
    UnauthorizedVenueOperationError,
    VenueAlreadyExistsError,
    VenueNotFoundError,
    VenueValidationError,
)


class CreateVenueInput(BaseModel):
    creator_id: uuid.UUID
    name: str
    description: str | None = None
    address_line: str
    city: str
    province: str
    postal_code: str
    region: str
    country: str
    capacity: int
    venue_type: VenueType
    contact_name: str
    contact_phone: str
    contact_email: str


class UpdateVenueInput(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    name: str | None = None
    description: str | None = None
    address_line: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    region: str | None = None
    country: str | None = None
    capacity: int | None = None
    venue_type: VenueType | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    contact_email: str | None = None


class CreateVenueOutput(BaseModel):
    venue: PublicVenue


class UpdateVenueOutput(BaseModel):
    venue: PublicVenue


class GetVenueOutput(BaseModel):
    venue: Venue


class VenueUseCase:
    def __init__(self, repo: IVenueRepository) -> None:
        self.repo = repo

    async def create(self, data: CreateVenueInput) -> CreateVenueOutput:
        try:
            venue = Venue(
                creator_id=data.creator_id,
                name=data.name,
                description=data.description,
                address_line=data.address_line,
                city=data.city,
                province=data.province,
                postal_code=data.postal_code,
                region=data.region,
                country=data.country,
                capacity=data.capacity,
                venue_type=data.venue_type,
                contact_name=data.contact_name,
                contact_phone=data.contact_phone,
                contact_email=data.contact_email,
            )
            result = await self.repo.create(venue)
            return CreateVenueOutput(venue=result)
        except IntegrityError as exc:
            raise VenueAlreadyExistsError(data.name) from exc
        except ValidationError as exc:
            raise VenueValidationError(str(exc)) from exc

    async def update(self, data: UpdateVenueInput) -> UpdateVenueOutput:
        existing = await self.repo.get_by_id(data.id)
        if existing is None:
            raise VenueNotFoundError(str(data.id))
        if existing.creator_id != data.creator_id:
            raise UnauthorizedVenueOperationError(str(data.id))

        try:
            updated = Venue(
                id=existing.id,
                creator_id=existing.creator_id,
                name=data.name if data.name is not None else existing.name,
                description=data.description if data.description is not None else existing.description,
                address_line=data.address_line if data.address_line is not None else existing.address_line,
                city=data.city if data.city is not None else existing.city,
                province=data.province if data.province is not None else existing.province,
                postal_code=data.postal_code if data.postal_code is not None else existing.postal_code,
                region=data.region if data.region is not None else existing.region,
                country=data.country if data.country is not None else existing.country,
                capacity=data.capacity if data.capacity is not None else existing.capacity,
                venue_type=data.venue_type if data.venue_type is not None else existing.venue_type,
                popularity_count=existing.popularity_count,
                usage_count=existing.usage_count,
                contact_name=data.contact_name if data.contact_name is not None else existing.contact_name,
                contact_phone=data.contact_phone if data.contact_phone is not None else existing.contact_phone,
                contact_email=data.contact_email if data.contact_email is not None else existing.contact_email,
            )
            result = await self.repo.update(updated)
            return UpdateVenueOutput(venue=result)
        except IntegrityError as exc:
            raise VenueAlreadyExistsError(data.name or "") from exc
        except ValidationError as exc:
            raise VenueValidationError(str(exc)) from exc

    async def delete(self, venue_id: uuid.UUID, creator_id: uuid.UUID) -> None:
        existing = await self.repo.get_by_id(venue_id)
        if existing is None:
            raise VenueNotFoundError(str(venue_id))
        if existing.creator_id != creator_id:
            raise UnauthorizedVenueOperationError(str(venue_id))
        await self.repo.delete(venue_id)

    async def get_by_id(self, venue_id: uuid.UUID) -> GetVenueOutput:
        venue = await self.repo.get_by_id(venue_id)
        if venue is None:
            raise VenueNotFoundError(str(venue_id))
        return GetVenueOutput(venue=venue)

    async def get_by_creator(self, creator_id: uuid.UUID) -> list[PublicVenue]:
        return await self.repo.get_by_creator(creator_id)
