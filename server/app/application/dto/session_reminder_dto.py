import uuid
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class SessionReminder:
    """A registration claimed for a reminder email, with what the email shows."""

    participant_id: uuid.UUID
    email: str
    first_name: str | None
    event_id: uuid.UUID
    event_title: str
    session_title: str
    session_start: datetime
    venue_name: str
    venue_address: str
