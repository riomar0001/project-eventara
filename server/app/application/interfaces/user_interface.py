import uuid
from datetime import datetime
from typing import Protocol

from app.domain.entities.user_entity import (
    PublicUser,
    User,
    UserActivity,
    UserLoginHistory,
    UserProfile,
    UserSecurity,
)


class IUserRepository(Protocol):
    async def get_by_email(self, email: str) -> User | None: ...

    async def get_by_id(self, user_id: uuid.UUID) -> User | None: ...

    async def get_security_by_user_id(self, user_id: uuid.UUID) -> UserSecurity | None: ...

    async def get_profile_by_user_id(self, user_id: uuid.UUID) -> UserProfile | None: ...

    async def get_by_alias(self, alias: str) -> User | None: ...

    async def create(
        self,
        user: User,
        security: UserSecurity,
        activity: UserActivity,
    ) -> PublicUser: ...

    async def create_profile(self, profile: UserProfile) -> UserProfile: ...

    async def complete_onboarding(self, user_id: uuid.UUID) -> bool: ...

    async def update_verification_status(self, user_id: uuid.UUID, verified: bool) -> bool: ...

    async def record_failed_login(
        self,
        user_id: uuid.UUID,
        max_attempts: int,
        lockout_until: datetime,
    ) -> int: ...

    async def reset_failed_login(self, user_id: uuid.UUID) -> None: ...

    async def record_login(
        self,
        user_id: uuid.UUID,
        *,
        ip_address: str | None = None,
        user_agent: str | None = None,
        browser: str | None = None,
        os: str | None = None,
        device_type: str | None = None,
        city: str | None = None,
        region: str | None = None,
        country: str | None = None,
        successful: bool = True,
    ) -> None: ...

    async def get_login_history(self, user_id: uuid.UUID, limit: int = 10) -> list[UserLoginHistory]: ...

    async def update_password(self, user_id: uuid.UUID, password_hash: str) -> bool: ...
