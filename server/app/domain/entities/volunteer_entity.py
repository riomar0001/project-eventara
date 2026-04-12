import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, EmailStr, Field

"""Will update this when we have more details on the volunteer roles and statuses"""


class VolunteerRole(StrEnum):
    ORGANIZER = "organizer"
    COORDINATOR = "coordinator"
    VOLUNTEER = "volunteer"


class VolunteerStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class Volunteer(BaseModel):
    """Volunteer entity definition"""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    email: EmailStr
    contact_phone: str = Field(min_length=7, max_length=20)
    role: VolunteerRole
    status: VolunteerStatus = VolunteerStatus.ACTIVE

    # Timestamps
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}
