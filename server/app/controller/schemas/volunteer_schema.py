import uuid

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.entities.volunteer_entity import ApplicationStatus


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
    application_data: dict | None = None


class ReviewApplicationRequest(BaseModel):
    status: ApplicationStatus
    contact_phone: str | None = Field(default=None, min_length=7, max_length=20)
    volunteer_role_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_review_fields(self) -> "ReviewApplicationRequest":
        if self.status not in (ApplicationStatus.APPROVED, ApplicationStatus.REJECTED):
            raise ValueError("status must be 'approved' or 'rejected'")
        if self.status == ApplicationStatus.APPROVED and (not self.contact_phone or not self.volunteer_role_id):
            raise ValueError("contact_phone and volunteer_role_id are required when approving an application")
        return self

    @field_validator("contact_phone")
    @classmethod
    def strip_contact_phone(cls, v: str | None) -> str | None:
        return v.strip() if v else v
