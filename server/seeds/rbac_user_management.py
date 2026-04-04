"""
Seed: RBAC - User Management
Populates features, roles, and role permissions for the user management domain.
Idempotent — safe to run multiple times.

Usage (from server/):
    python -m seeds.rbac_user_management
"""

import asyncio
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.database.models.user_models import Feature, Role, RolePermission
from app.domain.entities.authorization import GrantEffect, RoleAction


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

FEATURES: list[dict] = [
    {
        "slug": "user_management",
        "name": "User Management",
        "description": "Create, read, update, and delete user accounts.",
        "is_enabled": True,
    },
    {
        "slug": "user_profile_management",
        "name": "User Profile Management",
        "description": "Manage user profile data such as name, bio, and preferences.",
        "is_enabled": True,
    },
    {
        "slug": "user_role_management",
        "name": "User Role Management",
        "description": "Assign and revoke roles on user accounts.",
        "is_enabled": True,
    },
    {
        "slug": "user_grant_management",
        "name": "User Grant Management",
        "description": "Manage fine-grained per-user permission grants.",
        "is_enabled": True,
    },
]

ROLES: list[dict] = [
    {
        "name": "super_admin",
        "description": "Unrestricted system access. Owns all features and actions.",
        "is_default": False,
        "is_system": True,
    },
    {
        "name": "admin",
        "description": "Full user management access including account creation and role assignment.",
        "is_default": False,
        "is_system": True,
    },
    {
        "name": "moderator",
        "description": "Read and soft-edit access to users and profiles. Cannot manage roles or grants.",
        "is_default": False,
        "is_system": True,
    },
    {
        "name": "member",
        "description": "Default role assigned to every registered user.",
        "is_default": True,
        "is_system": True,
    },
]

# Permissions per role: { role_name: { feature_slug: [actions] } }
# Effect is ALLOW for all entries below; DENY grants are added as user-level
# overrides and are not seeded at the role level.
ROLE_PERMISSIONS: dict[str, dict[str, list[RoleAction]]] = {
    "super_admin": {
        "user_management":        [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
        "user_profile_management":[RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
        "user_role_management":   [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
        "user_grant_management":  [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
    },
    "admin": {
        "user_management":        [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
        "user_profile_management":[RoleAction.READ,   RoleAction.UPDATE],
        "user_role_management":   [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
        "user_grant_management":  [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
    },
    "moderator": {
        "user_management":        [RoleAction.READ, RoleAction.UPDATE],
        "user_profile_management":[RoleAction.READ, RoleAction.UPDATE],
        "user_role_management":   [RoleAction.READ],
        "user_grant_management":  [RoleAction.READ],
    },
    "member": {
        "user_management":        [RoleAction.READ],
        "user_profile_management":[RoleAction.READ, RoleAction.UPDATE],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _log(msg: str) -> None:
    print(f"  {msg}", flush=True)


async def _upsert_features(session) -> dict[str, UUID]:
    """Insert features, ignore conflicts on slug. Returns slug -> id map."""
    stmt = (
        insert(Feature.__table__)
        .values(FEATURES)
        .on_conflict_do_nothing(index_elements=["slug"])
    )
    await session.execute(stmt)

    rows = await session.execute(select(Feature.id, Feature.slug))
    return {slug: id_ for id_, slug in rows.all()}


async def _upsert_roles(session) -> dict[str, UUID]:
    """Insert roles, ignore conflicts on name. Returns name -> id map."""
    stmt = (
        insert(Role.__table__)
        .values(ROLES)
        .on_conflict_do_nothing(index_elements=["name"])
    )
    await session.execute(stmt)

    rows = await session.execute(select(Role.id, Role.name))
    return {name: id_ for id_, name in rows.all()}


async def _upsert_role_permissions(
    session,
    feature_ids: dict[str, UUID],
    role_ids: dict[str, UUID],
) -> int:
    """Insert missing role permissions. Returns count inserted."""
    # Build the full desired set as (role_id, feature_id, action) tuples
    desired: list[dict] = []
    for role_name, feature_map in ROLE_PERMISSIONS.items():
        role_id = role_ids[role_name]
        for feature_slug, actions in feature_map.items():
            feature_id = feature_ids[feature_slug]
            for action in actions:
                desired.append(
                    {
                        "role_id": role_id,
                        "feature_id": feature_id,
                        "action": action.value,
                        "effect": GrantEffect.ALLOW.value,
                    }
                )

    if not desired:
        return 0

    # Fetch already-existing (role_id, feature_id, action) combos
    existing_rows = await session.execute(
        select(RolePermission.role_id, RolePermission.feature_id, RolePermission.action)
    )
    existing: set[tuple] = {
        (str(r), str(f), a) for r, f, a in existing_rows.all()
    }

    new_records = [
        r for r in desired
        if (str(r["role_id"]), str(r["feature_id"]), r["action"]) not in existing
    ]

    if not new_records:
        return 0

    await session.execute(insert(RolePermission.__table__).values(new_records))
    return len(new_records)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def run() -> None:
    print("\nRunning seed: RBAC - User Management\n" + "-" * 40)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            _log("Seeding features...")
            feature_ids = await _upsert_features(session)
            for slug in feature_ids:
                _log(f"  feature: {slug}")

            _log("Seeding roles...")
            role_ids = await _upsert_roles(session)
            for name in role_ids:
                _log(f"  role: {name}")

            _log("Seeding role permissions...")
            count = await _upsert_role_permissions(session, feature_ids, role_ids)
            _log(f"  {count} new permission row(s) inserted")

    print("-" * 40)
    print("Done.\n")


if __name__ == "__main__":
    asyncio.run(run())
