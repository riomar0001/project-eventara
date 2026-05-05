import uuid

from pydantic import BaseModel, Field, field_validator


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
