import uuid

from pydantic import BaseModel, EmailStr, field_validator, Field
from typing import Optional

from app.core.entities.user_entities import AgeGroup, EducationLevel, Gender


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "user"
    alias: str = Field(min_length=3, max_length=30)
    first_name: str = Field(min_length=2, max_length=50)
    last_name: str = Field(min_length=2, max_length=50)
    age_group: AgeGroup
    gender: Gender
    education_level: EducationLevel
    occupation: Optional[str] = None
    bio: Optional[str] = None

    @field_validator("alias")
    @classmethod
    def alias_no_spaces(cls, value: str) -> str:
        if " " in value:
            raise ValueError("Alias must not contain spaces")
        return value.lower()


class RegisterResponse(BaseModel):
    user_id: uuid.UUID
    email: str
    message: str = "Registration successful. Please verify your email."


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    message: str = "Login successful."
