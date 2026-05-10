import uuid
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.entities.event_entity import Event, EventSession


@dataclass
class CreateEventSessionInput:
    venue_id: uuid.UUID
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    max_slots: int | None = None


@dataclass
class CreateEventInput:
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    created_by: uuid.UUID
    banner_url: str | None = None
    sessions: list[CreateEventSessionInput] = field(default_factory=list)


@dataclass
class EventWithSessionsOutput:
    event: Event
    sessions: list[EventSession]


@dataclass
class UpdateEventMetadataInput:
    event_id: uuid.UUID
    updated_by: uuid.UUID
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    banner_url: str | None = None


@dataclass
class UpdateEventMetadataOutput:
    event: Event
    old_event: Event


@dataclass
class UpdateEventSessionInput:
    session_id: uuid.UUID
    updated_by: uuid.UUID
    venue_id: uuid.UUID
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    max_slots: int | None = None


@dataclass
class UpdateEventSessionOutput:
    session: EventSession
    old_session: EventSession


@dataclass
class DeleteEventInput:
    event_id: uuid.UUID
    deleted_by: uuid.UUID


@dataclass
class DeleteEventOutput:
    event: Event


@dataclass
class DeleteEventSessionInput:
    session_id: uuid.UUID
    event_id: uuid.UUID
    deleted_by: uuid.UUID


@dataclass
class DeleteEventSessionOutput:
    session: EventSession


@dataclass
class UpdateEventBannerInput:
    event_id: uuid.UUID
    updated_by: uuid.UUID
    banner_url: str


@dataclass
class UpdateEventBannerOutput:
    event: Event
    old_banner_url: str | None
