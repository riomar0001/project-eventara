from typing import Protocol

from app.domain.entities.user_entity import PublicUser, User, UserActivity, UserSecurity


class IUserRepository(Protocol):
    async def get_by_email(self, email: str) -> User | None: ...
    async def create(
        self,
        user: User,
        security: UserSecurity,
        activity: UserActivity,
    ) -> PublicUser: ...
