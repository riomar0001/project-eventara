"""Data-access layer for volunteers, volunteer custom roles, and volunteer applications.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
    ``get_volunteer_by_user_id`` and ``get_active_application_by_user_id`` accept a
    ``for_update`` flag that acquires a row-level lock on the target row.  This
    serialises concurrent requests that perform a read-then-write sequence: the
    second request blocks on the lock, observes the committed row, and raises the
    appropriate domain exception in the use-case layer.  A unique constraint on
    ``volunteers.user_id`` provides a secondary safety net for volunteer creation.

    ``get_application_by_id`` similarly accepts ``for_update`` to serialise
    concurrent status transitions on the same application record.
"""

import uuid

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.user_entity import User as UserEntity
from app.domain.entities.volunteer_entity import ApplicationStatus, VolunteerStatus
from app.domain.entities.volunteer_entity import ApplicationSummary as ApplicationSummaryEntity
from app.domain.entities.volunteer_entity import PotentialVolunteer as PotentialVolunteerEntity
from app.domain.entities.volunteer_entity import Volunteer as VolunteerEntity
from app.domain.entities.volunteer_entity import VolunteerApplication as VolunteerApplicationEntity
from app.domain.entities.volunteer_entity import VolunteerRole as VolunteerRoleEntity
from app.domain.entities.volunteer_entity import VolunteerSummary as VolunteerSummaryEntity
from app.infrastructure.database.models.event_models import EventParticipant, EventSession
from app.infrastructure.database.models.user_models import Role, User, UserProfile
from app.infrastructure.database.models.volunteer_models import Volunteer, VolunteerRole
from app.infrastructure.database.models.volunteer_models import VolunteerApplication as VolunteerApplicationModel


class VolunteerRepository:
    """Data-access layer for volunteer, volunteer custom role, and volunteer application records."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _to_volunteer_entity(orm: Volunteer) -> VolunteerEntity:
        return VolunteerEntity(
            id=orm.id,
            user_id=orm.user_id,
            contact_phone=orm.contact_phone,
            volunteer_role_id=orm.volunteer_role_id,
            status=VolunteerStatus(orm.status),
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_volunteer_role_entity(orm: VolunteerRole) -> VolunteerRoleEntity:
        return VolunteerRoleEntity(
            id=orm.id,
            name=orm.name,
            description=orm.description,
            created_by=orm.created_by,
            is_active=orm.is_active,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_user_entity(orm: User) -> UserEntity:
        return UserEntity(
            id=orm.id,
            email=orm.email,
            password=orm.password,
            onboarding_completed=orm.onboarding_completed,
            status=orm.status,
        )

    @staticmethod
    def _to_rbac_role_entity(orm: Role) -> RoleEntity:
        return RoleEntity(
            id=orm.id,
            name=orm.name,
            description=orm.description,
            is_default=orm.is_default,
            is_system=orm.is_system,
        )

    async def get_volunteer_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerEntity | None:
        """Fetch a volunteer record by user ID, optionally acquiring a row lock."""
        query = select(Volunteer).where(Volunteer.user_id == user_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_volunteer_entity(orm) if orm else None

    async def create_volunteer(
        self,
        user_id: uuid.UUID,
        contact_phone: str,
        volunteer_role_id: uuid.UUID,
    ) -> VolunteerEntity:
        orm = Volunteer(
            user_id=user_id,
            contact_phone=contact_phone,
            volunteer_role_id=volunteer_role_id,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_volunteer_entity(orm)

    async def get_volunteer_role_by_id(
        self,
        role_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerRoleEntity | None:
        query = select(VolunteerRole).where(VolunteerRole.id == role_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_volunteer_role_entity(orm) if orm else None

    async def get_volunteer_role_by_name(self, name: str) -> VolunteerRoleEntity | None:
        result = await self.db.execute(select(VolunteerRole).where(func.lower(VolunteerRole.name) == name.lower()))
        orm = result.scalar_one_or_none()
        return self._to_volunteer_role_entity(orm) if orm else None

    async def create_volunteer_role(
        self,
        name: str,
        description: str | None,
        created_by: uuid.UUID,
    ) -> VolunteerRoleEntity:
        orm = VolunteerRole(
            name=name,
            description=description,
            created_by=created_by,
        )
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_volunteer_role_entity(orm)

    async def get_user_by_id(self, user_id: uuid.UUID) -> UserEntity | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        orm = result.scalar_one_or_none()
        return self._to_user_entity(orm) if orm else None

    async def get_rbac_role_by_name(self, name: str) -> RoleEntity | None:
        result = await self.db.execute(select(Role).where(func.lower(Role.name) == name.lower()))
        orm = result.scalar_one_or_none()
        return self._to_rbac_role_entity(orm) if orm else None

    @staticmethod
    def _to_application_entity(orm: VolunteerApplicationModel) -> VolunteerApplicationEntity:
        return VolunteerApplicationEntity(
            id=orm.id,
            user_id=orm.user_id,
            status=ApplicationStatus(orm.status),
            application_data=orm.application_data,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
        )

    @staticmethod
    def _to_application_summary_entity(row) -> ApplicationSummaryEntity:
        app = row[0]  # first element is the VolunteerApplicationModel ORM instance
        return ApplicationSummaryEntity(
            id=app.id,
            user_id=app.user_id,
            status=ApplicationStatus(app.status),
            application_data=app.application_data,
            first_name=row.first_name,
            last_name=row.last_name,
            alias=row.alias,
            email=row.email,
            created_at=app.created_at,
            updated_at=app.updated_at,
        )

    async def get_application_by_id(
        self,
        application_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerApplicationEntity | None:
        """Fetch a volunteer application by ID, optionally acquiring a row lock."""
        query = select(VolunteerApplicationModel).where(VolunteerApplicationModel.id == application_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_application_entity(orm) if orm else None

    async def get_active_application_by_user_id(
        self,
        user_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerApplicationEntity | None:
        """Fetch the user's active (PENDING or APPROVED) application, optionally acquiring a row lock."""
        query = select(VolunteerApplicationModel).where(
            VolunteerApplicationModel.user_id == user_id,
            VolunteerApplicationModel.status.in_([ApplicationStatus.PENDING, ApplicationStatus.APPROVED]),
        )
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_application_entity(orm) if orm else None

    async def create_application(
        self,
        user_id: uuid.UUID,
        application_data: dict | None,
    ) -> VolunteerApplicationEntity:
        orm = VolunteerApplicationModel(user_id=user_id, application_data=application_data)
        self.db.add(orm)
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_application_entity(orm)

    async def update_application_status(
        self,
        application_id: uuid.UUID,
        new_status: ApplicationStatus,
    ) -> VolunteerApplicationEntity | None:
        """Update the status of a volunteer application and flush within the current transaction."""
        result = await self.db.execute(select(VolunteerApplicationModel).where(VolunteerApplicationModel.id == application_id))
        orm = result.scalar_one_or_none()
        if not orm:
            return None
        orm.status = new_status
        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_application_entity(orm)

    @staticmethod
    def _to_volunteer_summary_entity(row) -> VolunteerSummaryEntity:
        v = row[0]  # first element is the Volunteer ORM instance
        return VolunteerSummaryEntity(
            id=v.id,
            user_id=v.user_id,
            contact_phone=v.contact_phone,
            volunteer_role_id=v.volunteer_role_id,
            status=VolunteerStatus(v.status),
            first_name=row.first_name,
            last_name=row.last_name,
            alias=row.alias,
            email=row.email,
            role_name=row.role_name,
            created_at=v.created_at,
            updated_at=v.updated_at,
        )

    async def get_all_volunteers(
        self,
        status: VolunteerStatus | None,
        role_id: uuid.UUID | None,
        page: int,
        page_size: int,
    ) -> tuple[list[VolunteerSummaryEntity], int]:
        """Fetch a paginated slice of volunteers joined with user profile and role name.

        Performs a LEFT OUTER JOIN to user_profiles so volunteers whose users have
        not yet completed onboarding still appear in the result with null name fields.
        The volunteer_custom_roles table is inner-joined because every volunteer row
        must reference a valid role.
        """
        base_query = (
            select(
                Volunteer,
                User.email,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                VolunteerRole.name.label("role_name"),
            )
            .join(User, Volunteer.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
            .join(VolunteerRole, Volunteer.volunteer_role_id == VolunteerRole.id)
        )
        count_query = (
            select(func.count())
            .select_from(Volunteer)
            .join(User, Volunteer.user_id == User.id)
            .join(VolunteerRole, Volunteer.volunteer_role_id == VolunteerRole.id)
        )

        if status is not None:
            base_query = base_query.where(Volunteer.status == status)
            count_query = count_query.where(Volunteer.status == status)

        if role_id is not None:
            base_query = base_query.where(Volunteer.volunteer_role_id == role_id)
            count_query = count_query.where(Volunteer.volunteer_role_id == role_id)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        paginated = base_query.order_by(Volunteer.created_at.desc()).offset(offset).limit(page_size)
        rows_result = await self.db.execute(paginated)
        rows = rows_result.all()
        return [self._to_volunteer_summary_entity(row) for row in rows], total

    async def get_all_volunteer_roles(
        self,
        search: str | None,
        is_active: bool | None,
        page: int,
        page_size: int,
    ) -> tuple[list[VolunteerRoleEntity], int]:
        """Fetch a paginated slice of volunteer roles with optional name search and status filter."""
        base_query = select(VolunteerRole)
        count_query = select(func.count()).select_from(VolunteerRole)

        if search:
            like_expr = VolunteerRole.name.ilike(f"%{search}%")
            base_query = base_query.where(like_expr)
            count_query = count_query.where(like_expr)

        if is_active is not None:
            base_query = base_query.where(VolunteerRole.is_active == is_active)
            count_query = count_query.where(VolunteerRole.is_active == is_active)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        paginated = base_query.order_by(VolunteerRole.created_at.desc()).offset(offset).limit(page_size)
        rows_result = await self.db.execute(paginated)
        rows = rows_result.scalars().all()
        return [self._to_volunteer_role_entity(row) for row in rows], total

    async def update_volunteer_role(
        self,
        role_id: uuid.UUID,
        name: str | None,
        description: object,
        is_active: bool | None,
        *,
        for_update: bool = False,
    ) -> VolunteerRoleEntity | None:
        """Apply a partial update to a volunteer role and flush within the current transaction.

        Fields whose value is ``None`` (for ``name`` and ``is_active``) or the
        sentinel ``_UNSET`` (for ``description``) are left unchanged.
        """
        from app.application.dto.volunteer_dto import _UNSET

        query = select(VolunteerRole).where(VolunteerRole.id == role_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        if not orm:
            return None

        if name is not None:
            orm.name = name
        if description is not _UNSET:
            orm.description = description if description else None
        if is_active is not None:
            orm.is_active = is_active

        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_volunteer_role_entity(orm)

    async def delete_volunteers_by_role_id(self, role_id: uuid.UUID) -> int:
        """Delete all volunteer records assigned to a given role and return the count removed."""
        count_result = await self.db.execute(select(func.count()).select_from(Volunteer).where(Volunteer.volunteer_role_id == role_id))
        count = count_result.scalar_one()
        await self.db.execute(sql_delete(Volunteer).where(Volunteer.volunteer_role_id == role_id))
        await self.db.flush()
        return count

    async def delete_volunteer_role_by_id(self, role_id: uuid.UUID) -> None:
        """Delete a volunteer role record by ID and flush within the current transaction."""
        await self.db.execute(sql_delete(VolunteerRole).where(VolunteerRole.id == role_id))
        await self.db.flush()

    async def list_applications(
        self,
        status: ApplicationStatus | None,
        page: int,
        page_size: int,
        search: str | None = None,
    ) -> tuple[list[ApplicationSummaryEntity], int]:
        """Fetch a paginated slice of volunteer applications with optional status and search filter."""
        joined = (
            VolunteerApplicationModel.__table__
            .join(User.__table__, VolunteerApplicationModel.user_id == User.id)
            .outerjoin(UserProfile.__table__, User.id == UserProfile.user_id)
        )
        base_query = (
            select(
                VolunteerApplicationModel,
                User.email,
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
            )
            .join(User, VolunteerApplicationModel.user_id == User.id)
            .outerjoin(UserProfile, User.id == UserProfile.user_id)
        )
        count_query = (
            select(func.count())
            .select_from(joined)
        )

        if status is not None:
            base_query = base_query.where(VolunteerApplicationModel.status == status)
            count_query = count_query.where(VolunteerApplicationModel.status == status)

        if search:
            term = f"%{search}%"
            search_filter = or_(
                UserProfile.first_name.ilike(term),
                UserProfile.last_name.ilike(term),
                UserProfile.alias.ilike(term),
                User.email.ilike(term),
                VolunteerApplicationModel.application_data["preferred_role"].astext.ilike(term),
            )
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        paginated = base_query.order_by(VolunteerApplicationModel.created_at.desc()).offset(offset).limit(page_size)
        rows_result = await self.db.execute(paginated)
        rows = rows_result.all()
        return [self._to_application_summary_entity(row) for row in rows], total

    async def get_latest_application_by_user_id(self, user_id: uuid.UUID) -> VolunteerApplicationEntity | None:
        """Fetch the most recently submitted application for a user regardless of status."""
        result = await self.db.execute(
            select(VolunteerApplicationModel)
            .where(VolunteerApplicationModel.user_id == user_id)
            .order_by(VolunteerApplicationModel.created_at.desc())
            .limit(1)
        )
        orm = result.scalar_one_or_none()
        return self._to_application_entity(orm) if orm else None

    async def get_volunteer_by_id(
        self,
        volunteer_id: uuid.UUID,
        *,
        for_update: bool = False,
    ) -> VolunteerEntity | None:
        """Fetch a volunteer record by volunteer ID, optionally acquiring a row lock."""
        query = select(Volunteer).where(Volunteer.id == volunteer_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_volunteer_entity(orm) if orm else None

    async def update_volunteer(
        self,
        volunteer_id: uuid.UUID,
        contact_phone: str | None,
        volunteer_role_id: uuid.UUID | None,
        status: VolunteerStatus | None,
    ) -> VolunteerEntity | None:
        """Apply a partial update to a volunteer record and flush within the current transaction.

        Fields whose value is ``None`` are left unchanged.
        """
        result = await self.db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
        orm = result.scalar_one_or_none()
        if not orm:
            return None

        if contact_phone is not None:
            orm.contact_phone = contact_phone
        if volunteer_role_id is not None:
            orm.volunteer_role_id = volunteer_role_id
        if status is not None:
            orm.status = status

        await self.db.flush()
        await self.db.refresh(orm)
        return self._to_volunteer_entity(orm)

    @staticmethod
    def _to_potential_volunteer_entity(row) -> PotentialVolunteerEntity:
        return PotentialVolunteerEntity(
            user_id=row.user_id,
            first_name=row.first_name,
            last_name=row.last_name,
            alias=row.alias,
            email=row.email,
            events_count=row.events_count,
        )

    async def get_potential_volunteers(
        self,
        page: int,
        page_size: int,
        min_events: int,
        search: str | None,
    ) -> tuple[list[PotentialVolunteerEntity], int]:
        """Fetch users ranked by event participation count who are not yet volunteers.

        Performs a four-way join: ``users`` → ``user_profiles`` (inner) →
        ``event_participants`` (inner) → ``event_sessions`` (inner) with a
        ``LEFT OUTER JOIN`` on ``volunteers`` filtered to ``WHERE volunteers.user_id
        IS NULL``.  Events are de-duplicated via ``COUNT(DISTINCT event_sessions.event_id)``
        so a user who attended multiple sessions of the same event is counted once.
        The ``HAVING`` clause applies the minimum-event threshold after aggregation.
        """
        events_count_expr = func.count(func.distinct(EventSession.event_id))

        conditions = [Volunteer.user_id.is_(None)]
        if search:
            search_term = f"%{search}%"
            conditions.append(
                or_(
                    func.concat(UserProfile.first_name, " ", UserProfile.last_name).ilike(search_term),
                    UserProfile.alias.ilike(search_term),
                    User.email.ilike(search_term),
                )
            )

        base_query = (
            select(
                User.id.label("user_id"),
                UserProfile.first_name,
                UserProfile.last_name,
                UserProfile.alias,
                User.email,
                events_count_expr.label("events_count"),
            )
            .join(UserProfile, User.id == UserProfile.user_id)
            .join(EventParticipant, User.id == EventParticipant.user_id)
            .join(EventSession, EventParticipant.event_session_id == EventSession.id)
            .outerjoin(Volunteer, User.id == Volunteer.user_id)
            .where(*conditions)
            .group_by(User.id, UserProfile.first_name, UserProfile.last_name, UserProfile.alias, User.email)
            .having(events_count_expr >= min_events)
        )

        count_sq = base_query.subquery()
        total_result = await self.db.execute(select(func.count()).select_from(count_sq))
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        paginated = base_query.order_by(events_count_expr.desc()).offset(offset).limit(page_size)
        rows_result = await self.db.execute(paginated)
        rows = rows_result.all()
        return [self._to_potential_volunteer_entity(row) for row in rows], total
