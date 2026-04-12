import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class VolunteerApplication(BaseModel):
    """Volunteer Application entity definition"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    status: ApplicationStatus = ApplicationStatus.PENDING
    application_data: dict | None = Field(default=None, description="Additional application data")

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
