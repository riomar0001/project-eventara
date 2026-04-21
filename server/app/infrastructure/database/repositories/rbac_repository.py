import uuid
from datetime import UTC, datetime

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.infrastructure.database.models.user_models import (
    Feature,
    Role,
    RolePermission,
    UserGrant,
)


class RBACRepository:
    """Data-access layer for RBAC permission and grant lookups.

    Used exclusively by ``require_permission`` to resolve whether a given
    user/role is allowed to perform an action on a feature.  Both methods
    work with human-readable names and slugs rather than internal UUIDs so
    callers never need to pre-fetch IDs.

    Typical call sequence inside the dependency::

        repo = RBACRepository(db)

        # 1. Check for a user-level override first.
        grant = await repo.get_user_grant(user_id, "events", RoleAction.DELETE)
        if grant and grant.effect == GrantEffect.DENY:
            raise HTTPException(403, ...)

        # 2. Fall back to the role's permission table.
        perm = await repo.get_role_permission("editor", "events", RoleAction.DELETE)
        if not perm or perm.effect == GrantEffect.DENY:
            raise HTTPException(403, ...)
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    @staticmethod
    def _utcnow_naive() -> datetime:
        return datetime.now(UTC).replace(tzinfo=None)

    async def get_role_permission(
        self,
        role_name: str,
        feature_slug: str,
        action: RoleAction,
    ) -> RolePermission | None:
        """Return the RolePermission row for role + feature + action, or None.

        Joins through the Role and Feature tables so callers work with names/slugs
        rather than internal UUIDs.  Only considers enabled features.

        Args:
            role_name:    The role's ``name`` column value (e.g. ``"admin"``,
                ``"editor"``), not the UUID — this matches the ``role_id``
                string claim embedded in the access token.
            feature_slug: The feature's ``slug`` column value (e.g.
                ``"audit-logs"``, ``"events"``).
            action:       The operation to check (CREATE / READ / UPDATE / DELETE).

        Returns:
            The matching ``RolePermission`` ORM row, or ``None`` if no row
            exists for the combination (treat as implicit deny).

        Example::

            perm = await repo.get_role_permission("admin", "audit-logs", RoleAction.READ)
            if perm and perm.effect == GrantEffect.ALLOW:
                # admin can read audit-logs
                ...
        """
        result = await self.db.execute(
            select(RolePermission)
            .join(Role, RolePermission.role_id == Role.id)
            .join(Feature, RolePermission.feature_id == Feature.id)
            .where(
                Role.name == role_name,
                Feature.slug == feature_slug,
                Feature.is_enabled.is_(True),
                RolePermission.action == action,
            )
        )
        return result.scalar_one_or_none()

    async def get_user_grant(
        self,
        user_id: uuid.UUID,
        feature_slug: str,
        action: RoleAction,
    ) -> UserGrant | None:
        """Return the UserGrant row for user + feature + action, or None.

        User grants are per-account overrides that take precedence over role
        permissions.  Expired grants are automatically excluded so callers
        never need to filter on ``expires_at`` themselves.

        Args:
            user_id:      The authenticated user's UUID.
            feature_slug: The feature's ``slug`` column value (e.g. ``"events"``).
            action:       The operation to check (CREATE / READ / UPDATE / DELETE).

        Returns:
            The matching ``UserGrant`` ORM row, or ``None`` if no active grant
            exists.  When a row is returned, inspect ``row.effect``:
            ``GrantEffect.ALLOW`` means the user has been explicitly permitted;
            ``GrantEffect.DENY`` means the user has been explicitly blocked
            regardless of their role.

        Example — allow a specific user to delete events even without the role::

            grant = await repo.get_user_grant(user_id, "events", RoleAction.DELETE)
            if grant is None:
                # no personal override — fall back to role check
                ...
            elif grant.effect == GrantEffect.DENY:
                raise HTTPException(403, "Explicitly denied")
            else:
                pass  # ALLOW — skip role check entirely

        Example — block a specific user from reading reports despite their role::

            # In the database:
            #   user_grants(user_id=X, feature="reports", action=READ, effect=DENY)
            #
            # get_user_grant will return that row, and the dependency will raise 403
            # even if the user's role has READ permission on "reports".
        """
        now = self._utcnow_naive()
        result = await self.db.execute(
            select(UserGrant)
            .join(Feature, UserGrant.feature_id == Feature.id)
            .where(
                UserGrant.user_id == user_id,
                Feature.slug == feature_slug,
                Feature.is_enabled.is_(True),
                UserGrant.action == action,
                or_(UserGrant.starts_at.is_(None), UserGrant.starts_at <= now),
                or_(UserGrant.expires_at.is_(None), UserGrant.expires_at > now),
            )
        )
        return result.scalar_one_or_none()

    async def get_effective_permissions(
        self,
        user_id: uuid.UUID,
        role_name: str | None,
    ) -> dict[str, bool]:
        """Return a flat map of 'feature_slug:action' → allowed for the given user.

        User grants take precedence over role permissions. Two queries total.
        """
        now = self._utcnow_naive()

        # All active user-level grants
        grants_result = await self.db.execute(
            select(Feature.slug, UserGrant.action, UserGrant.effect)
            .join(Feature, UserGrant.feature_id == Feature.id)
            .where(
                UserGrant.user_id == user_id,
                Feature.is_enabled.is_(True),
                or_(UserGrant.starts_at.is_(None), UserGrant.starts_at <= now),
                or_(UserGrant.expires_at.is_(None), UserGrant.expires_at > now),
            )
        )
        grant_map: dict[str, GrantEffect] = {
            f"{slug}:{action}": effect for slug, action, effect in grants_result.all()
        }

        # All role-level permissions
        role_map: dict[str, GrantEffect] = {}
        if role_name:
            perms_result = await self.db.execute(
                select(Feature.slug, RolePermission.action, RolePermission.effect)
                .join(Role, RolePermission.role_id == Role.id)
                .join(Feature, RolePermission.feature_id == Feature.id)
                .where(
                    Role.name == role_name,
                    Feature.is_enabled.is_(True),
                )
            )
            role_map = {
                f"{slug}:{action}": effect for slug, action, effect in perms_result.all()
            }

        # Resolve: user grants win; role perms are fallback
        resolved: dict[str, bool] = {}
        for key in set(grant_map) | set(role_map):
            if key in grant_map:
                resolved[key] = grant_map[key] == GrantEffect.ALLOW
            else:
                resolved[key] = role_map[key] == GrantEffect.ALLOW

        return resolved
