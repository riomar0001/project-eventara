from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.domain.entities.event_entity import EventVolunteer, EventVolunteerStatus


@dataclass
class AssignVolunteerInput:
    event_id: uuid.UUID
    alias: str
    actor_id: uuid.UUID


@dataclass
class AssignVolunteerOutput:
    event_volunteer: EventVolunteer


@dataclass
class ApplyEventVolunteerInput:
    event_id: uuid.UUID
    actor_id: uuid.UUID
    message: str | None = None


@dataclass
class ApplyEventVolunteerOutput:
    event_volunteer: EventVolunteer


@dataclass
class UpdateEventVolunteerStatusInput:
    event_volunteer_id: uuid.UUID
    actor_id: uuid.UUID
    new_status: EventVolunteerStatus


@dataclass
class UpdateEventVolunteerStatusOutput:
    event_volunteer: EventVolunteer
    old_status: EventVolunteerStatus


@dataclass
class RemoveEventVolunteerInput:
    event_volunteer_id: uuid.UUID
    actor_id: uuid.UUID


@dataclass
class RemoveEventVolunteerOutput:
    event_volunteer: EventVolunteer


@dataclass
class ListEventVolunteersInput:
    event_id: uuid.UUID
    actor_id: uuid.UUID
    status: EventVolunteerStatus | None = None


@dataclass
class ListEventVolunteersOutput:
    event_volunteers: list[EventVolunteer]
