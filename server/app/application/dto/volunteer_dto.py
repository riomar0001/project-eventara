import uuid
from dataclasses import dataclass

from app.domain.entities.volunteer_entity import Volunteer, VolunteerRole


@dataclass
class AddVolunteerInput:
    actor_id: uuid.UUID
    target_user_id: uuid.UUID
    contact_phone: str
    volunteer_role_id: uuid.UUID


@dataclass
class AddVolunteerOutput:
    volunteer: Volunteer


@dataclass
class CreateVolunteerRoleInput:
    name: str
    description: str | None
    created_by: uuid.UUID


@dataclass
class CreateVolunteerRoleOutput:
    role: VolunteerRole
