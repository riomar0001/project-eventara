import uuid
from dataclasses import dataclass

from app.domain.entities.event_entity import Event, EventSession, EventSessionStatus, EventStatus


@dataclass
class UpdateEventStatusInput:
    event_id: uuid.UUID
    updated_by: uuid.UUID
    new_status: EventStatus


@dataclass
class UpdateEventStatusOutput:
    event: Event
    old_event: Event


@dataclass
class UpdateEventSessionStatusInput:
    session_id: uuid.UUID
    updated_by: uuid.UUID
    new_status: EventSessionStatus


@dataclass
class UpdateEventSessionStatusOutput:
    session: EventSession
    old_session: EventSession
