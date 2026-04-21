import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field


class VolunteerRole(StrEnum):
    ORGANIZER = "organizer"
    COORDINATOR = "coordinator"
    VOLUNTEER = "volunteer"


class VolunteerStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class Volunteer(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    email: EmailStr
    contact_phone: str = Field(min_length=7, max_length=20)
    role: VolunteerRole
    status: VolunteerStatus = VolunteerStatus.ACTIVE
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class VolunteerApplication(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    status: ApplicationStatus = ApplicationStatus.PENDING
    application_data: dict | None = Field(default=None)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
