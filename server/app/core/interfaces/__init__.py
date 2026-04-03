import uuid
from typing import Protocol

from app.infrastructure.database.models.user import User, UserActivity, UserProfile, UserSecurity


class IUserRepository(Protocol):
    async def get_by_email(self, email: str) -> User | None: ...
    async def get_by_id(self, user_id: uuid.UUID) -> User | None: ...
    async def create(
        self,
        user: User,
        security: UserSecurity,
        activity: UserActivity,
        profile: UserProfile,
    ) -> User: ...
