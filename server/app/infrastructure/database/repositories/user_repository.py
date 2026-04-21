import uuid
from datetime import UTC, datetime
from typing import cast

from sqlalchemy import case, func, or_, select, update
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.application.dto.users_dto import AdminUserAccountDetail, AdminUserAccountSummary
from app.domain.entities.user_entity import (
    AgeGroup,
    EducationLevel,
    Gender,
    PublicUser,
    UserStatus,
)
from app.domain.entities.user_entity import (
    User as DomainUser,
)
from app.domain.entities.user_entity import (
    UserActivity as DomainUserActivity,
)
from app.domain.entities.user_entity import (
    UserLoginHistory as DomainUserLoginHistory,
)
from app.domain.entities.user_entity import (
    UserProfile as DomainUserProfile,
)
from app.domain.entities.user_entity import (
    UserSecurity as DomainUserSecurity,
)
from app.infrastructure.database.models.user_models import (
    Role,
    User,
    UserActivity,
    UserLoginHistory,
    UserProfile,
    UserRole,
    UserSecurity,
)


class UserRepository:
    """Data-access layer for users and their related sub-records.

    Covers the ``users``, ``user_security``, ``user_activity``, and
    ``user_profiles`` tables.  All writes use atomic SQL statements where
    concurrent access is a concern; see individual method docstrings for details.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _utcnow_naive() -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    @staticmethod
    def _as_naive_utc(value: datetime) -> datetime:
        return value.astimezone(UTC).replace(tzinfo=None) if value.tzinfo else value

    @staticmethod
    def _build_display_name(
        first_name: str | None,
        last_name: str | None,
        alias: str | None,
        email: str,
    ) -> str:
        full_name = " ".join(part for part in [first_name, last_name] if part).strip()
        if full_name:
            return full_name
        if alias:
            return alias
        return email.split("@")[0]

    async def _get_role_by_name(self, role_name: str) -> Role | None:
        result = await self.db.execute(select(Role).where(Role.name == role_name))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> DomainUser | None:
        """Return the user with the given email address, or None if not found."""
        result = await self.db.execute(select(User).options(selectinload(User.profile), selectinload(User.security)).where(User.email == email))
        orm_user = result.scalar_one_or_none()

        if orm_user is None:
            return None

        return DomainUser(
            id=orm_user.id,
            email=orm_user.email,
            password=orm_user.password,
            deletion_requested_at=orm_user.deletion_requested_at,
            deletion_scheduled_for=orm_user.deletion_scheduled_for,
            deletion_requested_by=orm_user.deletion_requested_by,
            deletion_reason=orm_user.deletion_reason,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )

    async def get_by_id(self, user_id: uuid.UUID) -> DomainUser | None:
        """Return the user with the given ID, or None if not found."""
        result = await self.db.execute(select(User).options(selectinload(User.profile), selectinload(User.security)).where(User.id == user_id))
        orm_user = result.scalar_one_or_none()

        if orm_user is None:
            return None

        return DomainUser(
            id=orm_user.id,
            email=orm_user.email,
            password=orm_user.password,
            onboarding_completed=orm_user.onboarding_completed,
            onboarding_completed_at=orm_user.onboarding_completed_at,
            deletion_requested_at=orm_user.deletion_requested_at,
            deletion_scheduled_for=orm_user.deletion_scheduled_for,
            deletion_requested_by=orm_user.deletion_requested_by,
            deletion_reason=orm_user.deletion_reason,
            deleted_at=orm_user.deleted_at,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )

    async def get_by_id_for_update(self, user_id: uuid.UUID) -> DomainUser | None:
        """Return the user while holding a row-level lock for account mutations.

        Email changes rely on ``SELECT … FOR UPDATE`` so concurrent administrators
        cannot both modify the same user row before the unique-email constraint is
        checked and the verification state is reset.
        """
        result = await self.db.execute(select(User).where(User.id == user_id).with_for_update())
        orm_user = result.scalar_one_or_none()

        if orm_user is None:
            return None

        return DomainUser(
            id=orm_user.id,
            email=orm_user.email,
            password=orm_user.password,
            onboarding_completed=orm_user.onboarding_completed,
            onboarding_completed_at=orm_user.onboarding_completed_at,
            deletion_requested_at=orm_user.deletion_requested_at,
            deletion_scheduled_for=orm_user.deletion_scheduled_for,
            deletion_requested_by=orm_user.deletion_requested_by,
            deletion_reason=orm_user.deletion_reason,
            deleted_at=orm_user.deleted_at,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )

    async def get_active_role_name_by_user_id(self, user_id: uuid.UUID) -> str | None:
        """Return the most recently assigned active role name for the user."""
        now = self._utcnow_naive()
        result = await self.db.execute(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(
                UserRole.user_id == user_id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
            .order_by(UserRole.assigned_at.desc())
        )
        return result.scalars().first()

    async def list_admin_user_accounts(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        status: UserStatus | None = None,
        role_name: str | None = None,
    ) -> tuple[list[AdminUserAccountSummary], int]:
        """Return a paginated administrative view of user accounts with optional search and status filters.

        The role columns are resolved through correlated subqueries that select
        the most recently assigned non-expired role for each user, matching the
        effective-role semantics used by access tokens.

        Search is applied as a case-insensitive ILIKE match across ``email``,
        ``UserProfile.first_name``, ``UserProfile.last_name``, and
        ``UserProfile.alias``.  The same predicates are applied to the COUNT
        query so pagination metadata always reflects the filtered result set.

        Concurrency strategy:
            Both queries are read-only SELECTs.  No row-level locking or
            additional serialisation is required beyond the per-request database
            session already provided by the dependency injector.
        """
        now = self._utcnow_naive()
        role_id_sq = (
            select(UserRole.role_id)
            .where(
                UserRole.user_id == User.id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
            .order_by(UserRole.assigned_at.desc())
            .limit(1)
            .correlate(User)
            .scalar_subquery()
        )
        role_name_sq = (
            select(Role.name)
            .select_from(UserRole)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                UserRole.user_id == User.id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
            .order_by(UserRole.assigned_at.desc())
            .limit(1)
            .correlate(User)
            .scalar_subquery()
        )

        filter_clauses = []
        if status is not None:
            filter_clauses.append(User.status == status)
        if role_name is not None:
            filter_clauses.append(role_name_sq == role_name)
        if search:
            pattern = f"%{search.strip()}%"
            filter_clauses.append(
                or_(
                    User.email.ilike(pattern),
                    UserProfile.first_name.ilike(pattern),
                    UserProfile.last_name.ilike(pattern),
                    UserProfile.alias.ilike(pattern),
                )
            )

        base_query = select(func.count(User.id)).select_from(User).outerjoin(UserProfile, UserProfile.user_id == User.id)
        if filter_clauses:
            base_query = base_query.where(*filter_clauses)

        total_result = await self.db.execute(base_query)
        total_count = total_result.scalar_one()

        data_query = (
            select(
                User.id.label("user_id"),
                User.email,
                User.status,
                User.deletion_scheduled_for,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                role_id_sq.label("role_id"),
                role_name_sq.label("role_name"),
            )
            .select_from(User)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .order_by(User.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        if filter_clauses:
            data_query = data_query.where(*filter_clauses)

        result = await self.db.execute(data_query)
        rows = result.mappings().all()
        return (
            [
                AdminUserAccountSummary(
                    user_id=row["user_id"],
                    name=self._build_display_name(row["first_name"], row["last_name"], row["alias"], row["email"]),
                    alias=row["alias"],
                    email=row["email"],
                    role_id=row["role_id"],
                    role_name=row["role_name"],
                    status=row["status"] if isinstance(row["status"], UserStatus) else UserStatus(row["status"]),
                    deletion_scheduled_for=row["deletion_scheduled_for"],
                )
                for row in rows
            ],
            total_count,
        )

    async def get_admin_user_account_detail(self, user_id: uuid.UUID) -> AdminUserAccountDetail | None:
        """Return the full administrative profile for a single user account."""
        now = self._utcnow_naive()
        role_id_sq = (
            select(UserRole.role_id)
            .where(
                UserRole.user_id == User.id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
            .order_by(UserRole.assigned_at.desc())
            .limit(1)
            .correlate(User)
            .scalar_subquery()
        )
        role_name_sq = (
            select(Role.name)
            .select_from(UserRole)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                UserRole.user_id == User.id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
            .order_by(UserRole.assigned_at.desc())
            .limit(1)
            .correlate(User)
            .scalar_subquery()
        )
        result = await self.db.execute(
            select(
                User.id.label("user_id"),
                User.email,
                User.status,
                User.onboarding_completed,
                User.onboarding_completed_at,
                User.deletion_requested_at,
                User.deletion_scheduled_for,
                User.deletion_requested_by,
                User.deletion_reason,
                User.deleted_at,
                User.created_at,
                User.updated_at,
                UserProfile.alias,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.age_group,
                UserProfile.gender,
                UserProfile.education_level,
                UserProfile.occupation,
                UserProfile.bio,
                UserSecurity.email_verified,
                UserSecurity.email_verified_at,
                UserSecurity.password_change_at,
                UserSecurity.failed_login_attempts,
                UserSecurity.locked_until,
                UserActivity.last_login_at,
                UserActivity.last_activity_at,
                UserActivity.login_count,
                role_id_sq.label("role_id"),
                role_name_sq.label("role_name"),
            )
            .select_from(User)
            .outerjoin(UserProfile, UserProfile.user_id == User.id)
            .outerjoin(UserSecurity, UserSecurity.user_id == User.id)
            .outerjoin(UserActivity, UserActivity.user_id == User.id)
            .where(User.id == user_id)
        )
        row = result.mappings().one_or_none()

        if row is None:
            return None

        return AdminUserAccountDetail(
            user_id=row["user_id"],
            name=self._build_display_name(row["first_name"], row["last_name"], row["alias"], row["email"]),
            email=row["email"],
            status=row["status"] if isinstance(row["status"], UserStatus) else UserStatus(row["status"]),
            role_id=row["role_id"],
            role_name=row["role_name"],
            alias=row["alias"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            age_group=row["age_group"] if row["age_group"] is None or isinstance(row["age_group"], AgeGroup) else AgeGroup(row["age_group"]),
            gender=row["gender"] if row["gender"] is None or isinstance(row["gender"], Gender) else Gender(row["gender"]),
            education_level=row["education_level"]
            if row["education_level"] is None or isinstance(row["education_level"], EducationLevel)
            else EducationLevel(row["education_level"]),
            occupation=row["occupation"],
            bio=row["bio"],
            onboarding_completed=row["onboarding_completed"],
            onboarding_completed_at=row["onboarding_completed_at"],
            email_verified=bool(row["email_verified"]),
            email_verified_at=row["email_verified_at"],
            password_change_at=row["password_change_at"],
            failed_login_attempts=row["failed_login_attempts"] or 0,
            locked_until=row["locked_until"],
            last_login_at=row["last_login_at"],
            last_activity_at=row["last_activity_at"],
            login_count=row["login_count"] or 0,
            deletion_requested_at=row["deletion_requested_at"],
            deletion_scheduled_for=row["deletion_scheduled_for"],
            deletion_requested_by=row["deletion_requested_by"],
            deletion_reason=row["deletion_reason"],
            deleted_at=row["deleted_at"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    async def get_security_by_user_id(self, user_id: uuid.UUID) -> DomainUserSecurity | None:
        """Return the security record for a user (verification status, failed attempts, lock),
        or None."""
        result = await self.db.execute(select(UserSecurity).where(UserSecurity.user_id == user_id))
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
        """Insert a new user together with its security and activity rows in one commit.

        Returns:
            A ``PublicUser`` containing only the fields safe to expose externally.
        """
        orm_user = User(
            id=user.id,
            email=user.email,
            password=user.password,
            status=user.status,
            accepted_terms=user.accepted_terms,
            accepted_terms_at=user.accepted_terms_at,
            accepted_privacy_policy=user.accepted_privacy_policy,
            accepted_privacy_policy_at=user.accepted_privacy_policy_at,
        )
        orm_security = UserSecurity(user_id=security.user_id)
        orm_activity = UserActivity(user_id=activity.user_id)
        participant_role = await self._get_role_by_name("participant")
        if participant_role is None:
            raise RuntimeError("Role 'participant' not found. Run seeds.rbac_user_management first.")

        orm_user_role = UserRole(
            user_id=user.id,
            role_id=participant_role.id,
            assigned_at=self._utcnow_naive(),
        )

        self.db.add_all([orm_user, orm_security, orm_activity, orm_user_role])
        await self.db.commit()
        await self.db.refresh(orm_user)
        return PublicUser(
            id=orm_user.id,
            email=orm_user.email,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )

    async def get_profile_by_user_id(self, user_id: uuid.UUID) -> DomainUserProfile | None:
        """Return the profile (alias, name, demographics) for a user, or None if not yet created."""
        result = await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
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
            education_level=orm_profile.education_level
            if isinstance(orm_profile.education_level, EducationLevel)
            else EducationLevel(orm_profile.education_level),
            occupation=orm_profile.occupation,
            bio=orm_profile.bio,
            preferences=orm_profile.preferences,
        )

    async def get_profile_by_user_id_for_update(self, user_id: uuid.UUID) -> DomainUserProfile | None:
        """Return the profile while holding a row-level write lock.

        Uses ``SELECT … FOR UPDATE`` so concurrent profile-update requests for
        the same account are serialised at the database level.  The alias
        uniqueness check inside the use case is therefore safe against the TOCTOU
        race where two simultaneous requests both pass the pre-update availability
        check before either commits.
        """
        result = await self.db.execute(select(UserProfile).where(UserProfile.user_id == user_id).with_for_update())
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
            education_level=orm_profile.education_level
            if isinstance(orm_profile.education_level, EducationLevel)
            else EducationLevel(orm_profile.education_level),
            occupation=orm_profile.occupation,
            bio=orm_profile.bio,
            preferences=orm_profile.preferences,
        )

    async def update_profile(
        self,
        user_id: uuid.UUID,
        *,
        alias: str,
        first_name: str,
        last_name: str,
        age_group: AgeGroup,
        gender: Gender,
        education_level: EducationLevel,
        occupation: str | None,
        bio: str | None,
    ) -> DomainUserProfile | None:
        """Apply mutable field changes to an existing profile row.

        Uses ``UPDATE … RETURNING`` so the persisted state (including unchanged
        columns such as ``image_file_id`` and ``preferences``) is returned in one
        round-trip without a follow-up SELECT.  Returns ``None`` if no row with
        ``user_id`` exists, which the use case maps to ``ProfileNotFoundError``.
        The caller is responsible for committing or rolling back the transaction.
        """
        result = await self.db.execute(
            update(UserProfile)
            .where(UserProfile.user_id == user_id)
            .values(
                alias=alias,
                first_name=first_name,
                last_name=last_name,
                age_group=age_group,
                gender=gender,
                education_level=education_level,
                occupation=occupation,
                bio=bio,
            )
            .returning(
                UserProfile.user_id,
                UserProfile.alias,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.image_file_id,
                UserProfile.age_group,
                UserProfile.gender,
                UserProfile.education_level,
                UserProfile.occupation,
                UserProfile.bio,
                UserProfile.preferences,
            )
        )
        row = result.one_or_none()
        if row is None:
            return None

        return DomainUserProfile(
            user_id=row.user_id,
            email="",
            alias=row.alias,
            first_name=row.first_name,
            last_name=row.last_name,
            image_file_id=row.image_file_id,
            age_group=row.age_group if isinstance(row.age_group, AgeGroup) else AgeGroup(row.age_group),
            gender=row.gender if isinstance(row.gender, Gender) else Gender(row.gender),
            education_level=row.education_level
            if isinstance(row.education_level, EducationLevel)
            else EducationLevel(row.education_level),
            occupation=row.occupation,
            bio=row.bio,
            preferences=row.preferences,
        )

    async def get_by_alias(self, alias: str) -> DomainUser | None:
        """Return the user who owns the given profile alias, or None if unclaimed."""
        result = await self.db.execute(select(User).join(UserProfile, User.id == UserProfile.user_id).where(UserProfile.alias == alias))
        orm_user = result.scalar_one_or_none()

        if orm_user is None:
            return None

        return DomainUser(
            id=orm_user.id,
            email=orm_user.email,
            password=orm_user.password,
            deletion_requested_at=orm_user.deletion_requested_at,
            deletion_scheduled_for=orm_user.deletion_scheduled_for,
            deletion_requested_by=orm_user.deletion_requested_by,
            deletion_reason=orm_user.deletion_reason,
            status=orm_user.status if isinstance(orm_user.status, UserStatus) else UserStatus(orm_user.status),
        )

    async def create_profile(self, profile: DomainUserProfile) -> DomainUserProfile:
        """Insert a new user profile row and return the persisted record."""
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
            education_level=orm_profile.education_level
            if isinstance(orm_profile.education_level, EducationLevel)
            else EducationLevel(orm_profile.education_level),
            occupation=orm_profile.occupation,
            bio=orm_profile.bio,
            preferences=orm_profile.preferences,
        )

    async def complete_onboarding(self, user_id: uuid.UUID) -> bool:
        """Atomically mark onboarding as completed.

        Returns True if updated, False if already completed.
        """
        now = self._utcnow_naive()
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
        now = self._utcnow_naive()
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
        normalized_lockout_until = self._as_naive_utc(lockout_until)
        result = await self.db.execute(
            update(UserSecurity)
            .where(UserSecurity.user_id == user_id)
            .values(
                failed_login_attempts=UserSecurity.failed_login_attempts + 1,
                # Lock only when the new count first hits the threshold;
                # once locked, keep the existing locked_until unchanged.
                locked_until=case(
                    (UserSecurity.failed_login_attempts + 1 >= max_attempts, normalized_lockout_until),
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
        await self.db.execute(update(UserSecurity).where(UserSecurity.user_id == user_id).values(failed_login_attempts=0, locked_until=None))
        await self.db.commit()

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
    ) -> None:
        """Update last_login_at and increment login_count in one atomic statement.

        Keeps UserActivity current for audit trails and analytics without
        requiring a separate SELECT before the UPDATE.
        """
        now = self._utcnow_naive()
        self.db.add(
            UserLoginHistory(
                user_id=user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                browser=browser,
                os=os,
                device_type=device_type,
                city=city,
                region=region,
                country=country,
                successful=successful,
            )
        )
        await self.db.execute(
            update(UserActivity)
            .where(UserActivity.user_id == user_id)
            .values(
                last_login_at=now,
                login_count=UserActivity.login_count + 1,
            )
        )
        await self.db.commit()

    async def get_login_history(self, user_id: uuid.UUID, limit: int = 10) -> list[DomainUserLoginHistory]:
        """Return recent login history entries for the given user ordered newest first."""
        result = await self.db.execute(
            select(UserLoginHistory).where(UserLoginHistory.user_id == user_id).order_by(UserLoginHistory.created_at.desc()).limit(limit)
        )
        entries = result.scalars().all()

        return [
            DomainUserLoginHistory(
                id=entry.id,
                user_id=entry.user_id,
                ip_address=entry.ip_address,
                user_agent=entry.user_agent,
                browser=entry.browser,
                os=entry.os,
                device_type=entry.device_type,
                city=entry.city,
                region=entry.region,
                country=entry.country,
                successful=entry.successful,
                created_at=entry.created_at,
            )
            for entry in entries
        ]

    async def update_password(self, user_id: uuid.UUID, password_hash: str) -> bool:
        """Atomically replace the user's password hash and stamp the change time.

        Both the ``users.password`` column and ``user_security.password_change_at``
        are updated within a single database commit so they are always consistent.
        A single ``UPDATE … WHERE id = user_id`` on the users table guards against
        updating a non-existent account — if the row count is zero the method
        rolls back and returns ``False`` without touching the security record.

        Concurrency note:
            The ``UPDATE … WHERE id = :user_id`` is unconditional beyond the
            primary-key filter.  Concurrent reset requests are serialised by the
            Redis ``GETDEL`` in ``PasswordResetRepository.verify_and_consume``
            before reaching this method, so at most one request will ever arrive
            here for the same token.

        Args:
            user_id:       The target user's UUID.
            password_hash: The pre-hashed (bcrypt) new password to persist.

        Returns:
            ``True`` if the password was updated, ``False`` if no user with the
            given ID exists.
        """
        now = self._utcnow_naive()
        result = await self.db.execute(update(User).where(User.id == user_id).values(password=password_hash))
        if cast(CursorResult, result).rowcount == 0:
            await self.db.rollback()
            return False

        await self.db.execute(update(UserSecurity).where(UserSecurity.user_id == user_id).values(password_change_at=now))
        await self.db.commit()
        return True

    async def update_email_and_clear_verification(self, user_id: uuid.UUID, email: str) -> DomainUser | None:
        """Stage an administrative email change and reset verification metadata.

        The caller is responsible for acquiring the user-row lock through
        ``get_by_id_for_update`` before invoking this method and for committing
        or rolling back the surrounding transaction.
        """
        user = await self.db.get(User, user_id)
        if user is None:
            return None

        user.email = email
        result = await self.db.execute(select(UserSecurity).where(UserSecurity.user_id == user_id))
        security = result.scalar_one_or_none()

        if security is None:
            security = UserSecurity(user_id=user_id)
            self.db.add(security)

        security.email_verified = False
        security.email_verified_at = None
        await self.db.flush()

        return DomainUser(
            id=user.id,
            email=user.email,
            password=user.password,
            onboarding_completed=user.onboarding_completed,
            onboarding_completed_at=user.onboarding_completed_at,
            deletion_requested_at=user.deletion_requested_at,
            deletion_scheduled_for=user.deletion_scheduled_for,
            deletion_requested_by=user.deletion_requested_by,
            deletion_reason=user.deletion_reason,
            deleted_at=user.deleted_at,
            status=user.status if isinstance(user.status, UserStatus) else UserStatus(user.status),
        )

    async def schedule_account_deletion(
        self,
        user_id: uuid.UUID,
        *,
        requested_by: uuid.UUID,
        requested_at: datetime,
        scheduled_for: datetime,
        reason: str | None = None,
    ) -> DomainUser | None:
        """Atomically schedule a user's account for deletion after the grace period.

        A single conditional ``UPDATE`` is used so concurrent self-service and
        administrator requests cannot both schedule separate deletion windows.
        Only rows with no existing pending deletion are eligible; every other
        state produces ``None`` and lets the caller map the latest persisted
        state to a domain-specific error.
        """
        normalized_requested_at = self._as_naive_utc(requested_at)
        normalized_scheduled_for = self._as_naive_utc(scheduled_for)
        result = await self.db.execute(
            update(User)
            .where(
                User.id == user_id,
                User.deletion_requested_at.is_(None),
                User.status == UserStatus.ACTIVE,
            )
            .values(
                deletion_requested_at=normalized_requested_at,
                deletion_scheduled_for=normalized_scheduled_for,
                deletion_requested_by=requested_by,
                deletion_reason=reason,
            )
            .returning(
                User.id,
                User.email,
                User.password,
                User.onboarding_completed,
                User.onboarding_completed_at,
                User.status,
                User.deletion_requested_at,
                User.deletion_scheduled_for,
                User.deletion_requested_by,
                User.deletion_reason,
                User.deleted_at,
            )
        )
        row = result.one_or_none()
        await self.db.commit()
        if row is None:
            return None

        return DomainUser(
            id=row.id,
            email=row.email,
            password=row.password,
            onboarding_completed=row.onboarding_completed,
            onboarding_completed_at=row.onboarding_completed_at,
            status=row.status if isinstance(row.status, UserStatus) else UserStatus(row.status),
            deletion_requested_at=row.deletion_requested_at,
            deletion_scheduled_for=row.deletion_scheduled_for,
            deletion_requested_by=row.deletion_requested_by,
            deletion_reason=row.deletion_reason,
            deleted_at=row.deleted_at,
        )

    async def cancel_pending_account_deletion(self, user_id: uuid.UUID) -> bool:
        """Atomically cancel an in-flight account deletion request.

        Successful authentication is the only supported recovery path during the
        grace period.  The conditional ``UPDATE`` guarantees that concurrent
        login completions collapse into a single state transition while stale
        worker jobs later observe the cleared columns and no-op safely.
        """
        now = self._utcnow_naive()
        result = await self.db.execute(
            update(User)
            .where(
                User.id == user_id,
                User.deletion_requested_at.is_not(None),
                User.deletion_scheduled_for.is_not(None),
                User.deletion_scheduled_for > now,
                User.status == UserStatus.ACTIVE,
            )
            .values(
                deletion_requested_at=None,
                deletion_scheduled_for=None,
                deletion_requested_by=None,
                deletion_reason=None,
            )
        )
        await self.db.commit()
        return cast(CursorResult, result).rowcount > 0

    async def finalize_account_deletion(
        self,
        user_id: uuid.UUID,
        *,
        expected_requested_at: datetime,
        expected_scheduled_for: datetime,
    ) -> bool:
        """Finalize a previously scheduled account deletion exactly once.

        The ARQ worker passes back the request timestamp and scheduled deadline
        that were captured when the deletion was first enqueued.  Matching both
        values turns the finalization step into a compare-and-swap update: if
        the user logs in and clears the pending deletion, or an administrator
        later reschedules a different window, the worker's conditional update
        matches zero rows and becomes a safe no-op.
        """
        now = self._utcnow_naive()
        normalized_requested_at = self._as_naive_utc(expected_requested_at)
        normalized_scheduled_for = self._as_naive_utc(expected_scheduled_for)
        result = await self.db.execute(
            update(User)
            .where(
                User.id == user_id,
                User.status == UserStatus.ACTIVE,
                User.deletion_requested_at == normalized_requested_at,
                User.deletion_scheduled_for == normalized_scheduled_for,
                User.deletion_scheduled_for <= now,
            )
            .values(
                status=UserStatus.DELETED,
                deleted_at=now,
                deletion_requested_at=None,
                deletion_scheduled_for=None,
                deletion_requested_by=None,
                deletion_reason=None,
            )
        )
        await self.db.commit()
        return cast(CursorResult, result).rowcount > 0
