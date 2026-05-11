import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class VolunteerStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class ApplicationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class VolunteerRole(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    description: str | None = None
    created_by: uuid.UUID | None = None
    is_active: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class Volunteer(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    contact_phone: str = Field(min_length=7, max_length=20)
    volunteer_role_id: uuid.UUID
    status: VolunteerStatus = VolunteerStatus.ACTIVE
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class VolunteerSummary(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    contact_phone: str
    volunteer_role_id: uuid.UUID
    status: VolunteerStatus
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    email: str | None = None
    role_name: str | None = None
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


class PotentialVolunteer(BaseModel):
    user_id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    alias: str | None = None
    email: str
    events_count: int

    model_config = {"from_attributes": True}
