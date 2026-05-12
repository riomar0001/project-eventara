import uuid
from dataclasses import dataclass

from app.domain.entities.event_entity import EventFeedback


@dataclass
class CreateEventFeedbackInput:
    user_id: uuid.UUID
    event_id: uuid.UUID
    rating: int
    comment: str | None = None
    suggestion: str | None = None


@dataclass
class EventFeedbackOutput:
    feedback: EventFeedback
