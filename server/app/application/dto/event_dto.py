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


@dataclass
class CreateEventInput:
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    created_by: uuid.UUID
    sessions: list[CreateEventSessionInput] = field(default_factory=list)


@dataclass
class EventWithSessionsOutput:
    event: Event
    sessions: list[EventSession]


@dataclass
class UpdateEventSessionInput:
    venue_id: uuid.UUID
    title: str
    description: str | None
    start_datetime: datetime
    end_datetime: datetime
    id: uuid.UUID | None = None


@dataclass
class UpdateEventInput:
    event_id: uuid.UUID
    updated_by: uuid.UUID
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    sessions: list[UpdateEventSessionInput] = field(default_factory=list)


@dataclass
class UpdateEventOutput:
    event: Event
    sessions: list[EventSession]
    old_event: Event
    old_sessions: list[EventSession]
