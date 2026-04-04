import uuid
from typing import Protocol

from app.domain.entities.user_entity import PublicUser, User, UserActivity, UserSecurity


class IUserRepository(Protocol):
    async def get_by_email(self, email: str) -> User | None: ...
    async def get_by_id(self, user_id: uuid.UUID) -> User | None: ...
    async def get_security_by_user_id(self, user_id: uuid.UUID) -> UserSecurity | None: ...
    async def create(
        self,
        user: User,
        security: UserSecurity,
        activity: UserActivity,
    ) -> PublicUser: ...
    async def update_verification_status(self, user_id: uuid.UUID, verified: bool) -> bool: ...
