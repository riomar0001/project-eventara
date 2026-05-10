from typing import Literal

from pydantic import BaseModel, Field

ResourceType = Literal["event-cover-banner", "registration-uploads", "user-profile"]


class PresignUploadRequest(BaseModel):
    resource_type: ResourceType
    content_type: str = Field(min_length=1, max_length=100)


class PresignUploadData(BaseModel):
    upload_url: str
    object_key: str
    public_url: str
    expires_in: int


class PresignUploadResponse(BaseModel):
    success: bool = True
    message: str = "Presigned URL generated."
    data: PresignUploadData
