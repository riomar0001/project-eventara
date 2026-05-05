"""Data-access layer for volunteers and volunteer custom roles.

All write methods flush changes within the current transaction boundary.
The use-case layer owns commit and rollback.

Concurrency strategy — pessimistic locking (SELECT … FOR UPDATE):
    ``get_volunteer_by_user_id`` accepts a ``for_update`` flag that acquires a
    row-level lock on the volunteer row.  This serialises concurrent requests that
    check whether a user is already a volunteer before inserting: the second
    request blocks on the lock, observes the committed row, and raises
    ``VolunteerAlreadyExistsError`` in the use-case layer.  A unique constraint on
    ``volunteers.user_id`` provides a secondary safety net.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.user_entity import User as UserEntity
from app.domain.entities.volunteer_entity import Volunteer as VolunteerEntity
from app.domain.entities.volunteer_entity import VolunteerRole as VolunteerRoleEntity
from app.domain.entities.volunteer_entity import VolunteerStatus
from app.infrastructure.database.models.user_models import Role, User
from app.infrastructure.database.models.volunteer_models import Volunteer, VolunteerRole


class VolunteerRepository:
    """Data-access layer for volunteer and volunteer custom role records."""

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
        result = await self.db.execute(
            select(VolunteerRole).where(func.lower(VolunteerRole.name) == name.lower())
        )
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
        return self._to_volunteer_role_entity(orm)

    async def get_user_by_id(self, user_id: uuid.UUID) -> UserEntity | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        orm = result.scalar_one_or_none()
        return self._to_user_entity(orm) if orm else None

    async def get_rbac_role_by_name(self, name: str) -> RoleEntity | None:
        result = await self.db.execute(select(Role).where(func.lower(Role.name) == name.lower()))
        orm = result.scalar_one_or_none()
        return self._to_rbac_role_entity(orm) if orm else None
