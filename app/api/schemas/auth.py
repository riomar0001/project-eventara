import uuid

from pydantic import BaseModel, EmailStr, field_validator

from app.core.entities.user import AgeGroup, EducationLevel, Gender


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "user"
    alias: str
    first_name: str
    last_name: str
    age_group: AgeGroup
    gender: Gender
    education_level: EducationLevel
    occupation: str | None = None
    bio: str | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("alias")
    @classmethod
    def alias_no_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Alias must not contain spaces")
        return v.lower()


class RegisterResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    message: str = "Registration successful. Please verify your email."
