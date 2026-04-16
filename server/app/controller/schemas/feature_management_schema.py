import uuid

from pydantic import BaseModel, Field


class FeatureCreateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    is_enabled: bool = True


class FeatureUpdateRequest(BaseModel):
    slug: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    is_enabled: bool = True


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
