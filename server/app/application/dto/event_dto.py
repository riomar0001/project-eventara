import uuid
from dataclasses import dataclass, field
from datetime import datetime

from app.domain.entities.event_entity import Event, EventSession, EventStatus


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
class CreateEventSessionForEventInput:
    event_id: uuid.UUID
    updated_by: uuid.UUID
    venue_id: uuid.UUID
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    max_slots: int | None = None
    caller_role: str | None = None


@dataclass
class CreateEventSessionOutput:
    session: EventSession


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
    caller_role: str | None = None


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
    caller_role: str | None = None


@dataclass
class UpdateEventSessionOutput:
    session: EventSession
    old_session: EventSession


@dataclass
class DeleteEventInput:
    event_id: uuid.UUID
    deleted_by: uuid.UUID
    caller_role: str | None = None


@dataclass
class DeleteEventOutput:
    event: Event


@dataclass
class DeleteEventSessionInput:
    session_id: uuid.UUID
    event_id: uuid.UUID
    deleted_by: uuid.UUID
    caller_role: str | None = None


@dataclass
class DeleteEventSessionOutput:
    session: EventSession


@dataclass
class UpdateEventBannerInput:
    event_id: uuid.UUID
    updated_by: uuid.UUID
    banner_url: str
    caller_role: str | None = None


@dataclass
class UpdateEventBannerOutput:
    event: Event
    old_banner_url: str | None


@dataclass
class GetAllEventsInput:
    page: int = 1
    page_size: int = 20
    status: EventStatus | None = None


@dataclass
class GetAllEventsOutput:
    events: list[Event]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class GetEventWithSessionsInput:
    event_id: uuid.UUID


@dataclass
class GetPublicEventsInput:
    q: str | None = None
    page: int = 1
    page_size: int = 9


@dataclass
class PublicEventsOutput:
    events: list[HomeEventRecord]
    total: int
    page: int
    page_size: int
    total_pages: int
    events_type: str


@dataclass
class HomeEventRecord:
    event: Event
    sessions: list[EventSession]


@dataclass
class HomeEventsOutput:
    live_event: Event | None
    live_event_sessions: list[EventSession]
    events: list[HomeEventRecord]
    events_type: str
