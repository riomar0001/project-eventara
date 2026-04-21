import uuid
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ChangePasswordInput:
    user_id: uuid.UUID
    current_password: str
    new_password: str


@dataclass
class RequestAccountDeletionInput:
    target_user_id: uuid.UUID
    requested_by: uuid.UUID
    reason: str | None = None
    current_password: str | None = None


@dataclass
class RequestAccountDeletionOutput:
    user_id: uuid.UUID
    deletion_requested_at: datetime
    deletion_scheduled_for: datetime
    requested_by: uuid.UUID
