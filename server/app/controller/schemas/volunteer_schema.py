import uuid

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.entities.volunteer_entity import ApplicationStatus, VolunteerStatus


class AddVolunteerRequest(BaseModel):
    target_user_id: uuid.UUID
    contact_phone: str = Field(min_length=7, max_length=20)
    volunteer_role_id: uuid.UUID

    @field_validator("contact_phone")
    @classmethod
    def strip_contact_phone(cls, v: str) -> str:
        return v.strip()


class CreateVolunteerRoleRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class SubmitApplicationRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    preferred_role: str | None = Field(default=None, max_length=100)
    reason: str = Field(min_length=10, max_length=1000)
    skills_experience: str | None = Field(default=None, max_length=1000)
    availability: str | None = Field(default=None, max_length=200)

    @field_validator("full_name", "email", "reason")
    @classmethod
    def strip_required(cls, v: str) -> str:
        return v.strip()

    @field_validator("preferred_role", "skills_experience", "availability")
    @classmethod
    def strip_optional(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class ReviewApplicationRequest(BaseModel):
    status: ApplicationStatus
    contact_phone: str | None = Field(default=None, min_length=7, max_length=20)
    volunteer_role_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_review_fields(self) -> ReviewApplicationRequest:
        if self.status not in (ApplicationStatus.APPROVED, ApplicationStatus.REJECTED):
            raise ValueError("status must be 'approved' or 'rejected'")
        if self.status == ApplicationStatus.APPROVED and (not self.contact_phone or not self.volunteer_role_id):
            raise ValueError("contact_phone and volunteer_role_id are required when approving an application")
        return self

    @field_validator("contact_phone")
    @classmethod
    def strip_contact_phone(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class UpdateVolunteerRoleRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class UpdateVolunteerRequest(BaseModel):
    contact_phone: str | None = Field(default=None, min_length=7, max_length=20)
    volunteer_role_id: uuid.UUID | None = None
    status: VolunteerStatus | None = None

    @field_validator("contact_phone")
    @classmethod
    def strip_contact_phone(cls, v: str | None) -> str | None:
        return v.strip() if v else v
