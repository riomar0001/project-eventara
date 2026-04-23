import uuid
from dataclasses import dataclass

from app.domain.entities.event_entity import EventParticipant, EventParticipantStatus


@dataclass
class RegisterForSessionInput:
    user_id: uuid.UUID
    session_id: uuid.UUID


@dataclass
class RegisterForSessionOutput:
    participant: EventParticipant


@dataclass
class UpdateParticipantStatusInput:
    participant_id: uuid.UUID
    updated_by: uuid.UUID
    new_status: EventParticipantStatus


@dataclass
class UpdateParticipantStatusOutput:
    participant: EventParticipant
    old_participant: EventParticipant
