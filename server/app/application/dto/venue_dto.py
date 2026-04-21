import math
import uuid
from dataclasses import dataclass, field

from app.domain.entities.venue_entities import Venue as VenueEntity
from app.domain.entities.venue_entities import VenueType


@dataclass
class ListVenuesInput:
    page: int = 1
    page_size: int = 10
    search: str | None = None
    venue_type: VenueType | None = None
    is_partner: bool | None = None


@dataclass
class CreateVenueInput:
    creator_id: uuid.UUID
    name: str
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
    description: str | None = None
    is_partner: bool = False
    amenities: list[str] | None = None


@dataclass
class UpdateVenueInput:
    venue_id: uuid.UUID
    name: str
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
    description: str | None = None
    is_partner: bool = False
    amenities: list[str] | None = None


@dataclass
class VenueOutput:
    venue: VenueEntity


@dataclass
class ListVenuesOutput:
    venues: list[VenueEntity]
    total_count: int
    page: int
    page_size: int

    @property
    def total_pages(self) -> int:
        return math.ceil(self.total_count / self.page_size) if self.page_size else 0
