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


@dataclass
class WithdrawRegistrationInput:
    user_id: uuid.UUID
    event_id: uuid.UUID
    session_id: uuid.UUID


@dataclass
class WithdrawRegistrationOutput:
    participant: EventParticipant
    old_participant: EventParticipant


@dataclass
class CheckInParticipantInput:
    event_id: uuid.UUID
    session_id: uuid.UUID
    participant_id: uuid.UUID
    checked_in_by: uuid.UUID


@dataclass
class CheckInParticipantOutput:
    participant: EventParticipant
    old_participant: EventParticipant
