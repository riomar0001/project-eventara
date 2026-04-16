import uuid
from datetime import UTC, datetime
from typing import cast as typing_cast

from pydantic import AwareDatetime
from sqlalchemy import CursorResult, cast, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto.admin_user_account_dto import RolePermissionSummary
from app.domain.entities.authorization_entities import Feature as FeatureEntity
from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.domain.entities.authorization_entities import Role as RoleEntity
from app.domain.entities.authorization_entities import UserGrant as DomainUserGrant
from app.domain.entities.authorization_entities import UserRole as DomainUserRole
from app.infrastructure.database.models.user_models import (
    Feature,
    Role,
    RolePermission,
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
    def _as_naive_utc(value: AwareDatetime | None) -> datetime | None:
        if value is None:
            return None
        return value.astimezone(UTC).replace(tzinfo=None) if value.tzinfo else value

    @staticmethod
    def _utcnow_naive() -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    async def user_exists(self, user_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(User.id).where(User.id == user_id))
        return result.scalar_one_or_none() is not None

    async def role_exists(self, role_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(Role.id).where(Role.id == role_id))
        return result.scalar_one_or_none() is not None

    async def get_feature_by_id(self, feature_id: uuid.UUID, for_update: bool = False) -> FeatureEntity | None:
        query = select(Feature).where(Feature.id == feature_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_domain_feature(orm) if orm else None

    async def get_feature_by_slug(self, slug: str) -> FeatureEntity | None:
        result = await self.db.execute(select(Feature).where(Feature.slug == slug))
        orm = result.scalar_one_or_none()
        return self._to_domain_feature(orm) if orm else None

    async def get_features_by_ids(self, feature_ids: list[uuid.UUID], for_update: bool = False) -> list[FeatureEntity]:
        if not feature_ids:
            return []
        query = select(Feature).where(Feature.id.in_(feature_ids))
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        return [self._to_domain_feature(orm) for orm in result.scalars().all()]

    async def list_all_features(self) -> list[FeatureEntity]:
        result = await self.db.execute(select(Feature).order_by(Feature.name.asc()))
        return [self._to_domain_feature(orm) for orm in result.scalars().all()]

    async def create_feature_definition(
        self,
        slug: str,
        name: str,
        description: str | None,
        is_enabled: bool,
    ) -> FeatureEntity:
        orm = Feature(slug=slug, name=name, description=description, is_enabled=is_enabled)
        self.db.add(orm)
        await self.db.flush()
        return self._to_domain_feature(orm)

    async def update_feature_definition(
        self,
        feature_id: uuid.UUID,
        slug: str,
        name: str,
        description: str | None,
        is_enabled: bool,
    ) -> FeatureEntity | None:
        await self.db.execute(
            update(Feature)
            .where(Feature.id == feature_id)
            .values(slug=slug, name=name, description=description, is_enabled=is_enabled)
        )
        await self.db.flush()
        return await self.get_feature_by_id(feature_id)

    async def get_feature_dependency_counts(self, feature_id: uuid.UUID) -> tuple[int, int]:
        role_permission_count = await self.db.scalar(select(func.count(RolePermission.id)).where(RolePermission.feature_id == feature_id))
        user_grant_count = await self.db.scalar(select(func.count(UserGrant.id)).where(UserGrant.feature_id == feature_id))
        return int(role_permission_count or 0), int(user_grant_count or 0)

    async def delete_feature_definition(self, feature_id: uuid.UUID) -> bool:
        result = typing_cast(CursorResult,await self.db.execute(delete(Feature).where(Feature.id == feature_id)))
        await self.db.flush()
        return result.rowcount > 0

    async def lock_user(self, user_id: uuid.UUID) -> bool:
        """Acquire a pessimistic lock on the target user row for role replacement flows.

        Locking the user row ensures two administrators cannot both observe an empty
        active-assignment set and create competing replacements for the same account.
        """
        result = await self.db.execute(select(User.id).where(User.id == user_id).with_for_update())
        return result.scalar_one_or_none() is not None

    async def get_role_by_id(self, role_id: uuid.UUID, for_update: bool = False) -> RoleEntity | None:
        """Return a single role definition by ID."""
        query = select(Role).where(Role.id == role_id)
        if for_update:
            query = query.with_for_update()
        result = await self.db.execute(query)
        orm = result.scalar_one_or_none()
        return self._to_domain_role_record(orm) if orm else None

    async def get_role_by_name(self, name: str) -> RoleEntity | None:
        result = await self.db.execute(select(Role).where(Role.name == name))
        orm = result.scalar_one_or_none()
        return self._to_domain_role_record(orm) if orm else None

    async def list_roles(self) -> list[RoleEntity]:
        """Return all assignable system roles ordered by name."""
        result = await self.db.execute(select(Role).order_by(Role.name.asc()))
        return [self._to_domain_role_record(orm) for orm in result.scalars().all()]

    async def create_role_definition(
        self,
        name: str,
        description: str | None,
        is_default: bool,
        is_system: bool,
    ) -> RoleEntity:
        orm = Role(name=name, description=description, is_default=is_default, is_system=is_system)
        self.db.add(orm)
        await self.db.flush()
        return self._to_domain_role_record(orm)

    async def update_role_definition(
        self,
        role_id: uuid.UUID,
        name: str,
        description: str | None,
        is_default: bool,
        is_system: bool,
    ) -> RoleEntity | None:
        await self.db.execute(
            update(Role)
            .where(Role.id == role_id)
            .values(name=name, description=description, is_default=is_default, is_system=is_system)
        )
        await self.db.flush()
        return await self.get_role_by_id(role_id)

    async def get_role_permissions(self, role_id: uuid.UUID) -> list[RolePermissionSummary]:
        """Return the enabled permissions attached to one role definition."""
        result = await self.db.execute(
            select(RolePermission.role_id, Feature.id, Feature.slug, Feature.name, RolePermission.action, RolePermission.effect)
            .join(Feature, RolePermission.feature_id == Feature.id)
            .where(RolePermission.role_id == role_id)
            .order_by(Feature.slug.asc(), RolePermission.action.asc())
        )
        return [
            RolePermissionSummary(
                feature_id=feature_id,
                feature_slug=feature_slug,
                feature_name=feature_name,
                action=RoleAction(action),
                effect=GrantEffect(effect),
            )
            for _, feature_id, feature_slug, feature_name, action, effect in result.all()
        ]

    async def list_role_permissions(self, role_ids: list[uuid.UUID]) -> dict[uuid.UUID, list[RolePermissionSummary]]:
        """Return enabled permissions grouped by role for the supplied role IDs."""
        if not role_ids:
            return {}

        result = await self.db.execute(
            select(RolePermission.role_id, Feature.id, Feature.slug, Feature.name, RolePermission.action, RolePermission.effect)
            .join(Feature, RolePermission.feature_id == Feature.id)
            .where(RolePermission.role_id.in_(role_ids))
            .order_by(RolePermission.role_id.asc(), Feature.slug.asc(), RolePermission.action.asc())
        )
        permissions_by_role: dict[uuid.UUID, list[RolePermissionSummary]] = {role_id: [] for role_id in role_ids}

        for role_id, feature_id, feature_slug, feature_name, action, effect in result.all():
            permissions_by_role.setdefault(role_id, []).append(
                RolePermissionSummary(
                    feature_id=feature_id,
                    feature_slug=feature_slug,
                    feature_name=feature_name,
                    action=RoleAction(action),
                    effect=GrantEffect(effect),
                )
            )

        return permissions_by_role

    async def replace_role_permissions(
        self,
        role_id: uuid.UUID,
        permissions: list[tuple[uuid.UUID, RoleAction, GrantEffect]],
    ) -> list[RolePermissionSummary]:
        await self.db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        if permissions:
            self.db.add_all(
                [
                    RolePermission(
                        role_id=role_id,
                        feature_id=feature_id,
                        action=action,
                        effect=effect,
                    )
                    for feature_id, action, effect in permissions
                ]
            )
        await self.db.flush()
        return await self.get_role_permissions(role_id)

    async def get_role_dependency_counts(self, role_id: uuid.UUID) -> tuple[int, int]:
        user_assignment_count = await self.db.scalar(select(func.count(UserRole.id)).where(UserRole.role_id == role_id))
        user_grant_count = await self.db.scalar(select(func.count(UserGrant.id)).where(UserGrant.role_id == role_id))
        return int(user_assignment_count or 0), int(user_grant_count or 0)

    async def delete_role_definition(self, role_id: uuid.UUID) -> bool:
        result = typing_cast(CursorResult,await self.db.execute(delete(Role).where(Role.id == role_id)))
        await self.db.flush()
        return result.rowcount > 0

    async def feature_exists(self, feature_id: uuid.UUID) -> bool:
        result = await self.db.execute(select(Feature.id).where(Feature.id == feature_id))
        return result.scalar_one_or_none() is not None

    async def list_features(self) -> list[FeatureEntity]:
        """Return enabled features that can receive per-user grants."""
        result = await self.db.execute(select(Feature).where(Feature.is_enabled.is_(True)).order_by(Feature.name.asc()))
        return [self._to_domain_feature(orm) for orm in result.scalars().all()]

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
        expires_at: AwareDatetime | None,
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

    async def get_active_assignments_for_user(self, user_id: uuid.UUID) -> list[DomainUserRole]:
        """Return active assignments for a user while holding row-level locks.

        The query locks every currently effective assignment row so a concurrent
        replacement cannot delete or create overlapping current-role state until
        the surrounding transaction commits or rolls back.
        """
        now = self._utcnow_naive()
        result = await self.db.execute(
            select(UserRole)
            .where(
                UserRole.user_id == user_id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
            .order_by(UserRole.assigned_at.desc())
            .with_for_update()
        )
        return [self._to_domain_role(orm) for orm in result.scalars().all()]

    async def get_assignment_by_id(self, assignment_id: uuid.UUID) -> DomainUserRole | None:
        result = await self.db.execute(select(UserRole).where(UserRole.id == assignment_id))
        orm = result.scalar_one_or_none()
        return self._to_domain_role(orm) if orm else None

    async def update_assignment_expiry(self, assignment_id: uuid.UUID, expires_at: AwareDatetime | None) -> DomainUserRole | None:
        await self.db.execute(update(UserRole).where(UserRole.id == assignment_id).values(expires_at=self._as_naive_utc(expires_at)))
        await self.db.flush()
        result = await self.db.execute(select(UserRole).where(UserRole.id == assignment_id))
        orm = result.scalar_one_or_none()
        return self._to_domain_role(orm) if orm else None

    async def delete_assignment(self, assignment_id: uuid.UUID) -> bool:
        result = typing_cast(CursorResult,await self.db.execute(delete(UserRole).where(UserRole.id == assignment_id)))
        await self.db.flush()
        return result.rowcount > 0

    async def replace_active_assignments(
        self,
        user_id: uuid.UUID,
        role_id: uuid.UUID,
        assigned_by: uuid.UUID,
    ) -> DomainUserRole:
        """Replace the user's current active assignments with a single new role.

        The caller is expected to have already acquired the user-row lock through
        ``lock_user`` and, if present, row locks on current assignments through
        ``get_active_assignments_for_user``. This method then performs the
        destructive replacement and staged insert in the same transaction.
        """
        now = self._utcnow_naive()
        await self.db.execute(
            delete(UserRole).where(
                UserRole.user_id == user_id,
                (UserRole.expires_at.is_(None) | (UserRole.expires_at > now)),
            )
        )
        assignment = UserRole(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by,
        )
        self.db.add(assignment)
        await self.db.flush()
        return self._to_domain_role(assignment)

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
                or_(UserGrant.expires_at.is_(None), UserGrant.expires_at > self._utcnow_naive()),
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
        starts_at: AwareDatetime | None,
        expires_at: AwareDatetime | None,
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
                starts_at=self._as_naive_utc(starts_at),
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
        result = await self.db.execute(
            select(UserGrant)
            .where(
                UserGrant.user_id == user_id,
                or_(UserGrant.expires_at.is_(None), UserGrant.expires_at > self._utcnow_naive()),
            )
            .order_by(UserGrant.starts_at.asc(), UserGrant.id.asc())
        )
        return [self._to_domain_grant(orm) for orm in result.scalars().all()]

    async def get_grant_by_id(self, grant_id: uuid.UUID) -> DomainUserGrant | None:
        result = await self.db.execute(select(UserGrant).where(UserGrant.id == grant_id))
        orm = result.scalar_one_or_none()
        return self._to_domain_grant(orm) if orm else None

    async def delete_grant(self, grant_id: uuid.UUID) -> bool:
        result  = typing_cast(CursorResult, await self.db.execute(delete(UserGrant).where(UserGrant.id == grant_id)))
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

    def _to_domain_role_record(self, orm: Role) -> RoleEntity:
        return RoleEntity(
            id=orm.id,
            name=orm.name,
            description=orm.description,
            is_default=orm.is_default,
            is_system=orm.is_system,
        )

    def _to_domain_feature(self, orm: Feature) -> FeatureEntity:
        return FeatureEntity(
            id=orm.id,
            slug=orm.slug,
            name=orm.name,
            description=orm.description,
            is_enabled=orm.is_enabled,
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
            starts_at=orm.starts_at,
            expires_at=orm.expires_at,
            granted_by=orm.granted_by,
        )
