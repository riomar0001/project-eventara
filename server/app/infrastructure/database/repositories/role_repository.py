import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import UserGrant as DomainUserGrant
from app.domain.entities.authorization_entities import UserRole as DomainUserRole
from app.infrastructure.database.models.user_models import (
    Feature,
    Role,
    User,
    UserGrant,
    UserRole,
)


class RoleRepository:
    """Data-access layer for user role assignments and per-user action grants.

    All write methods call ``flush()`` to stage changes within the current
    transaction boundary.  Callers are responsible for committing or rolling
    back the session.

    Concurrency strategy — SELECT … FOR UPDATE (pessimistic locking):
        ``get_active_assignment`` and ``get_existing_grants`` both acquire row-level
        locks via ``with_for_update()``.  This serializes the check-then-insert
        pattern at the database level: a second concurrent request for the same
        user+role or user+feature+action combination will block until the first
        transaction commits, then observe the committed row and raise the
        appropriate duplicate error in the use-case layer.  Pessimistic locking
        was chosen over optimistic locking because the conflict window is short
        (a single request), the probability of collision is non-zero for
        admin-driven bulk assignments, and retrying on version mismatch would add
        unnecessary complexity.
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _as_naive_utc(value: datetime | None) -> datetime | None:
        if value is None:
            return None
        return value.astimezone(UTC).replace(tzinfo=None) if value.tzinfo else value

    async def user_exists(self, user_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(User.id).where(User.id == user_id))
        return result.scalar_one_or_none() is not None

    async def role_exists(self, role_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(Role.id).where(Role.id == role_id))
        return result.scalar_one_or_none() is not None

    async def feature_exists(self, feature_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(Feature.id).where(Feature.id == feature_id))
        return result.scalar_one_or_none() is not None

    async def get_active_assignment(self, user_id: uuid.UUID, role_id: uuid.UUID) -> DomainUserRole | None:
        """Return the existing assignment for user + role, locking the row for update.

        The FOR UPDATE lock prevents a concurrent request from passing the
        duplicate check and inserting a second assignment for the same pair
        before this transaction commits.
        """
        result = await self.db.execute(select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id).with_for_update())
        orm = result.scalar_one_or_none()
        return self._to_domain_role(orm) if orm else None

    async def create_assignment(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        expires_at: datetime | None,
        assigned_by: uuid.UUID,
    ) -> DomainUserRole:
        orm = UserRole(
            user_id=user_id,
            role_id=role_id,
            expires_at=self._as_naive_utc(expires_at),
            assigned_by=assigned_by,
        )
        self.db.add(orm)
        await self.db.flush()
        return self._to_domain_role(orm)

    async def get_assignments_by_user(self, user_id: uuid.UUID) -> list[DomainUserRole]:
        result = await self.db.execute(select(UserRole).where(UserRole.user_id == user_id))
        return [self._to_domain_role(orm) for orm in result.scalars().all()]

    async def get_assignment_by_id(self, assignment_id: uuid.UUID) -> DomainUserRole | None:
        result = await self.db.execute(select(UserRole).where(UserRole.id == assignment_id))
        orm = result.scalar_one_or_none()
        return self._to_domain_role(orm) if orm else None

    async def update_assignment_expiry(self, assignment_id: uuid.UUID, expires_at: datetime | None) -> DomainUserRole | None:
        await self.db.execute(update(UserRole).where(UserRole.id == assignment_id).values(expires_at=self._as_naive_utc(expires_at)))
        await self.db.flush()
        result = await self.db.execute(select(UserRole).where(UserRole.id == assignment_id))
        orm = result.scalar_one_or_none()
        return self._to_domain_role(orm) if orm else None

    async def delete_assignment(self, assignment_id: uuid.UUID) -> bool:
        result = await self.db.execute(delete(UserRole).where(UserRole.id == assignment_id))
        await self.db.flush()
        return result.rowcount > 0

    async def get_existing_grants(
        self,
        user_id: uuid.UUID,
        feature_id: uuid.UUID,
        actions: list[RoleAction],
    ) -> list[DomainUserGrant]:
        """Return existing grants for user + feature + actions, locking rows for update.

        The FOR UPDATE lock prevents two concurrent grant-creation requests for
        overlapping action sets from both passing the duplicate check and
        inserting conflicting rows before either transaction commits.
        """
        result = await self.db.execute(
            select(UserGrant)
            .where(
                UserGrant.user_id == user_id,
                UserGrant.feature_id == feature_id,
                UserGrant.action.in_(actions),
            )
            .with_for_update()
        )
        return [self._to_domain_grant(orm) for orm in result.scalars().all()]

    async def create_grants(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        feature_id: uuid.UUID,
        actions: list[RoleAction],
        effect: GrantEffect,
        expires_at: datetime | None,
        reason: str | None,
        granted_by: uuid.UUID,
    ) -> list[DomainUserGrant]:
        orm_grants = [
            UserGrant(
                user_id=user_id,
                role_id=role_id,
                feature_id=feature_id,
                action=action,
                effect=effect,
                expires_at=self._as_naive_utc(expires_at),
                reason=reason,
                granted_by=granted_by,
            )
            for action in actions
        ]
        self.db.add_all(orm_grants)
        await self.db.flush()
        return [self._to_domain_grant(orm) for orm in orm_grants]

    async def get_grants_by_user(self, user_id: uuid.UUID) -> list[DomainUserGrant]:
        result = await self.db.execute(select(UserGrant).where(UserGrant.user_id == user_id))
        return [self._to_domain_grant(orm) for orm in result.scalars().all()]

    async def get_grant_by_id(self, grant_id: uuid.UUID) -> DomainUserGrant | None:
        result = await self.db.execute(select(UserGrant).where(UserGrant.id == grant_id))
        orm = result.scalar_one_or_none()
        return self._to_domain_grant(orm) if orm else None

    async def delete_grant(self, grant_id: uuid.UUID) -> bool:
        result = await self.db.execute(delete(UserGrant).where(UserGrant.id == grant_id))
        await self.db.flush()
        return result.rowcount > 0

    def _to_domain_role(self, orm: UserRole) -> DomainUserRole:
        return DomainUserRole(
            id=orm.id,
            user_id=orm.user_id,
            role_id=orm.role_id,
            expires_at=orm.expires_at,
            assigned_by=orm.assigned_by,
            assigned_at=orm.assigned_at,
        )

    def _to_domain_grant(self, orm: UserGrant) -> DomainUserGrant:
        return DomainUserGrant(
            id=orm.id,
            user_id=orm.user_id,
            feature_id=orm.feature_id,
            role_id=orm.role_id,
            action=RoleAction(orm.action),
            effect=GrantEffect(orm.effect),
            reason=orm.reason,
            expires_at=orm.expires_at,
            granted_by=orm.granted_by,
        )
