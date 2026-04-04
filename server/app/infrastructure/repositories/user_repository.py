import uuid
from datetime import datetime, timezone

from typing import cast

from sqlalchemy import case, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.entities.user_entity import (
    User as DomainUser,
    PublicUser,
    UserActivity as DomainUserActivity,
    UserProfile as DomainUserProfile,
    UserSecurity as DomainUserSecurity,
    UserStatus,
    AgeGroup,
    EducationLevel,
    Gender,
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
            onboarding_completed=orm_user.onboarding_completed,
            onboarding_completed_at=orm_user.onboarding_completed_at,
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
        
    async def get_profile_by_user_id(self, user_id: uuid.UUID) -> DomainUserProfile | None:
        result = await self.db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        orm_profile = result.scalar_one_or_none()

        if orm_profile is None:
            return None

        return DomainUserProfile(
            user_id=orm_profile.user_id,
            email="",
            alias=orm_profile.alias,
            first_name=orm_profile.first_name,
            last_name=orm_profile.last_name,
            image_file_id=orm_profile.image_file_id,
            age_group=orm_profile.age_group if isinstance(orm_profile.age_group, AgeGroup) else AgeGroup(orm_profile.age_group),
            gender=orm_profile.gender if isinstance(orm_profile.gender, Gender) else Gender(orm_profile.gender),
            education_level=orm_profile.education_level if isinstance(orm_profile.education_level, EducationLevel) else EducationLevel(orm_profile.education_level),
            occupation=orm_profile.occupation,
            bio=orm_profile.bio,
            preferences=orm_profile.preferences,
        )

    async def get_by_alias(self, alias: str) -> DomainUser | None:
        result = await self.db.execute(
            select(User)
            .join(UserProfile, User.id == UserProfile.user_id)
            .where(UserProfile.alias == alias)
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

    async def create_profile(self, profile: DomainUserProfile) -> DomainUserProfile:
        orm_profile = UserProfile(
            user_id=profile.user_id,
            alias=profile.alias,
            first_name=profile.first_name,
            last_name=profile.last_name,
            age_group=profile.age_group,
            gender=profile.gender,
            education_level=profile.education_level,
            occupation=profile.occupation,
            bio=profile.bio,
            preferences=profile.preferences,
        )
        self.db.add(orm_profile)
        await self.db.flush()

        return DomainUserProfile(
            user_id=orm_profile.user_id,
            email=profile.email,
            alias=orm_profile.alias,
            first_name=orm_profile.first_name,
            last_name=orm_profile.last_name,
            image_file_id=orm_profile.image_file_id,
            age_group=orm_profile.age_group if isinstance(orm_profile.age_group, AgeGroup) else AgeGroup(orm_profile.age_group),
            gender=orm_profile.gender if isinstance(orm_profile.gender, Gender) else Gender(orm_profile.gender),
            education_level=orm_profile.education_level if isinstance(orm_profile.education_level, EducationLevel) else EducationLevel(orm_profile.education_level),
            occupation=orm_profile.occupation,
            bio=orm_profile.bio,
            preferences=orm_profile.preferences,
        )

    async def complete_onboarding(self, user_id: uuid.UUID) -> bool:
        """Atomically mark onboarding as completed.

        Returns True if updated, False if already completed.
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(User)
            .where(User.id == user_id, User.onboarding_completed == False)  # noqa: E712
            .values(onboarding_completed=True, onboarding_completed_at=now)
        )
        await self.db.commit()
        return cast(CursorResult, result).rowcount > 0

    async def update_verification_status(self, user_id: uuid.UUID, verified: bool) -> bool:
        """Atomically update verification status.

        Returns True if the row was updated, False if it was already in the
        desired state (guards against concurrent double-verification).
        """
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            update(UserSecurity)
            .where(
                UserSecurity.user_id == user_id,
                UserSecurity.email_verified != verified,
            )
            .values(email_verified=verified, email_verified_at=now if verified else None)
        )
        await self.db.commit()
        return cast(CursorResult, result).rowcount > 0

    async def record_failed_login(
        self,
        user_id: uuid.UUID,
        max_attempts: int,
        lockout_until: datetime,
    ) -> int:
        """Atomically increment failed_login_attempts and conditionally lock the account.

        A single SQL UPDATE with a CASE expression is used so the increment and
        the conditional lock are applied in one round-trip to the database.  This
        prevents the TOCTOU race where two concurrent wrong-password requests
        could both read failed_login_attempts = N, both write N+1, and together
        count only one failure instead of two.

        The account is locked by setting locked_until to ``lockout_until`` once
        failed_login_attempts reaches ``max_attempts``.  If the account is already
        locked the existing locked_until value is preserved (idempotent).

        Args:
            user_id:       The user whose counter should be incremented.
            max_attempts:  Threshold at or above which locked_until is set.
            lockout_until: The datetime until which the account should be locked
                           when the threshold is first reached.

        Returns:
            The new value of failed_login_attempts after the increment.
        """
        result = await self.db.execute(
            update(UserSecurity)
            .where(UserSecurity.user_id == user_id)
            .values(
                failed_login_attempts=UserSecurity.failed_login_attempts + 1,
                # Lock only when the new count first hits the threshold;
                # once locked, keep the existing locked_until unchanged.
                locked_until=case(
                    (UserSecurity.failed_login_attempts + 1 >= max_attempts, lockout_until),
                    else_=UserSecurity.locked_until,
                ),
            )
            .returning(UserSecurity.failed_login_attempts)
        )
        await self.db.commit()
        row = result.fetchone()
        return int(row[0]) if row else 0

    async def reset_failed_login(self, user_id: uuid.UUID) -> None:
        """Atomically reset the failed-login counter and clear any active account lock.

        Called immediately after a successful password verification so the next
        genuine login failure starts from a clean baseline rather than an
        accumulated count from previous failed attempts.
        """
        await self.db.execute(
            update(UserSecurity)
            .where(UserSecurity.user_id == user_id)
            .values(failed_login_attempts=0, locked_until=None)
        )
        await self.db.commit()

    async def record_login(self, user_id: uuid.UUID) -> None:
        """Update last_login_at and increment login_count in one atomic statement.

        Keeps UserActivity current for audit trails and analytics without
        requiring a separate SELECT before the UPDATE.
        """
        now = datetime.now(timezone.utc)
        await self.db.execute(
            update(UserActivity)
            .where(UserActivity.user_id == user_id)
            .values(
                last_login_at=now,
                login_count=UserActivity.login_count + 1,
            )
        )
        await self.db.commit()