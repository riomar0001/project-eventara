import uuid
from datetime import datetime
from pydantic import BaseModel, Field, IPvAnyAddress, model_validator


class Token(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    token_hash: str

    # Device Information
    ip_address: IPvAnyAddress | None = None
    user_agent: str | None = None
    browser: str | None = None
    os: str | None = None
    device_type: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None

    # Token lifecycle
    is_active: bool = True
    revoked_at: datetime | None = None
    expires_at: datetime
    last_used_at: datetime | None = None

    updated_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "from_attributes": True
    }

    @model_validator(mode="after")
    def check_revoked(self):
        if self.revoked_at and self.is_active:
            raise ValueError("Revoked token cannot be active")
        return self
