from unittest import result
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.user_entity import (
    User as DomainUser,
    PublicUser,
    UserActivity as DomainUserActivity,
    UserSecurity as DomainUserSecurity,
    UserStatus,
)
from app.infrastructure.database.models.user_models import (
    User,
    UserActivity,
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
        
    async def get_by_id(self, user_id: uuid.UUID) -> DomainUser | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.profile), selectinload(User.security))
            .where(User.id == user_id)
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

    async def get_security_by_user_id(self, user_id: uuid.UUID) -> DomainUserSecurity | None:
        result = await self.db.execute(
            select(UserSecurity).where(UserSecurity.user_id == user_id)
        )
        orm_security = result.scalar_one_or_none()

        if orm_security is None:
            return None

        return DomainUserSecurity(
            user_id=orm_security.user_id,
            email_verified=orm_security.email_verified,
            email_verified_at=orm_security.email_verified_at,
            password_change_at=orm_security.password_change_at,
            failed_login_attempts=orm_security.failed_login_attempts,
            locked_until=orm_security.locked_until,
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
        
    async def update_verification_status(self, user_id: uuid.UUID, verified: bool) -> None:
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(UserSecurity)
            .where(UserSecurity.user_id == user_id)
            .values(email_verified=verified, email_verified_at=now if verified else None)
            .returning(UserSecurity.user_id)
        )
        updated_user_id = result.scalar_one_or_none()
        await self.db.commit()

        if updated_user_id is None:
            raise RuntimeError("Invariant violated: user should exist")