import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.user_entity import (
    AgeGroup,
    EducationLevel,
    Gender,
    User as DomainUser,
    PublicUser,
    UserActivity as DomainUserActivity,
    UserProfile as DomainUserProfile,
    UserSecurity as DomainUserSecurity,
    UserStatus,
)
from app.infrastructure.database.models.user_models import (
    User,
    UserActivity,
    UserProfile,
    UserSecurity,
)


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_email(self, email: str) -> DomainUser | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.security))
            .where(User.email == email)
        )
        orm_user = result.scalar_one_or_none()
        
        if orm_user is None:
            return None
        
        return DomainUser(
            id=orm_user.id,
            email=orm_user.email,
            password=orm_user.password,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )
    
    async def create(
        self,
        user: DomainUser,
        security: DomainUserSecurity,
        activity: DomainUserActivity,
    ) -> PublicUser:
        orm_user = User(id=user.id, email=user.email, password=user.password, status=user.status)
        orm_security = UserSecurity(user_id=security.user_id)
        orm_activity = UserActivity(user_id=activity.user_id)
        self.db.add_all([orm_user, orm_security, orm_activity])
        await self.db.commit()
        await self.db.refresh(orm_user)
        return PublicUser(
            id=orm_user.id,
            email=orm_user.email,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )