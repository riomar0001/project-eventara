import uuid
from dataclasses import dataclass, field

from app.domain.entities.volunteer_entity import ApplicationStatus, Volunteer, VolunteerApplication, VolunteerRole

_UNSET: object = object()


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


@dataclass
class GetAllVolunteerRolesInput:
    page: int
    page_size: int
    search: str | None = None
    is_active: bool | None = None


@dataclass
class GetAllVolunteerRolesOutput:
    roles: list[VolunteerRole]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass
class UpdateVolunteerRoleInput:
    role_id: uuid.UUID
    actor_id: uuid.UUID
    name: str | None = None
    description: object = field(default_factory=lambda: _UNSET)
    is_active: bool | None = None


@dataclass
class UpdateVolunteerRoleOutput:
    role: VolunteerRole


@dataclass
class DeleteVolunteerRoleInput:
    role_id: uuid.UUID
    actor_id: uuid.UUID


@dataclass
class DeleteVolunteerRoleOutput:
    role_id: uuid.UUID
    volunteers_removed: int


@dataclass
class SubmitApplicationInput:
    user_id: uuid.UUID
    application_data: dict | None


@dataclass
class SubmitApplicationOutput:
    application: VolunteerApplication


@dataclass
class ReviewApplicationInput:
    application_id: uuid.UUID
    reviewer_id: uuid.UUID
    new_status: ApplicationStatus
    contact_phone: str | None
    volunteer_role_id: uuid.UUID | None


@dataclass
class ReviewApplicationOutput:
    application: VolunteerApplication
    volunteer: Volunteer | None


@dataclass
class WithdrawApplicationInput:
    application_id: uuid.UUID
    user_id: uuid.UUID


@dataclass
class WithdrawApplicationOutput:
    application: VolunteerApplication
