import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, IPvAnyAddress, model_validator


class Token(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    token_hash: str

    is_active: bool = True
    revoked_at: datetime | None = None
    expires_at: datetime
    last_used_at: datetime | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def check_revoked(self):
        """Enforce the invariant that a revoked token cannot also be marked active.

        Prevents accidentally constructing a ``Token`` in a contradictory state
        where ``revoked_at`` is set but ``is_active`` is still ``True``.
        """
        if self.revoked_at and self.is_active:
            raise ValueError("Revoked token cannot be active")
        return self


class TokenPayload(BaseModel):
    sub: str
    email: str | None = None
    done_onboarding: bool = False
    role_id: str | None = None
    alias: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    age_group: str | None = None
    gender: str | None = None
    education_level: str | None = None
    occupation: str | None = None
    bio: str | None = None
    type: Literal["access", "refresh", "verification", "otp", "password_reset"]
    jti: str
    exp: datetime
    iat: datetime


class LoginHistory(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    ip_address: IPvAnyAddress | None = None
    user_agent: str | None = None
    browser: str | None = None
    os: str | None = None
    device_type: str | None = None
    city: str | None = None
    region: str | None = None
    country: str | None = None
    successful: bool

    model_config = {"from_attributes": True}


class UserOneTimeCode(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    user_id: uuid.UUID
    code_hash: str
    expires_at: datetime

    model_config = {"from_attributes": True}
