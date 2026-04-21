import re
import uuid

from pydantic import BaseModel, Field, field_validator

_KEBAB_CASE_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def _validate_kebab_slug(value: str) -> str:
    if not _KEBAB_CASE_RE.match(value):
        raise ValueError("Slug must be lowercase kebab-case (e.g. user-accounts). Only a-z, 0-9, and hyphens are allowed.")
    return value


class FeatureCreateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    is_enabled: bool = True

    @field_validator("slug")
    @classmethod
    def slug_must_be_kebab_case(cls, value: str) -> str:
        return _validate_kebab_slug(value)


class FeatureUpdateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    is_enabled: bool = True

    @field_validator("slug")
    @classmethod
    def slug_must_be_kebab_case(cls, value: str) -> str:
        return _validate_kebab_slug(value)


class FeatureRecordResponse(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    description: str | None = None
    is_enabled: bool

    model_config = {"from_attributes": True}


class FeatureResponse(BaseModel):
    success: bool = True
    data: FeatureRecordResponse
    message: str = "Feature saved successfully."


class FeatureListResponse(BaseModel):
    success: bool = True
    data: list[FeatureRecordResponse]
