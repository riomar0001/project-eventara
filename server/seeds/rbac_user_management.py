"""
Seed: RBAC
Populates features, roles, and role permissions for the current API surface.
Idempotent — safe to run multiple times.

Usage (from server/):
    python .\\seeds\\rbac_user_management.py
    python -m seeds.rbac_user_management
"""

# ruff: noqa: E402

import asyncio
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

try:
    from seeds._bootstrap import ensure_server_on_path
except ModuleNotFoundError:
    from _bootstrap import ensure_server_on_path

ensure_server_on_path()

from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.infrastructure.database.models.user_models import Feature, Role, RolePermission
from app.infrastructure.database.session import AsyncSessionLocal

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

ALL_ACTIONS = [
    RoleAction.CREATE,
    RoleAction.READ,
    RoleAction.UPDATE,
    RoleAction.DELETE,
]


FEATURES: list[dict] = [
    {
        "slug": "venues",
        "name": "Venues",
        "description": "Create, read, update, and delete venue records.",
        "is_enabled": True,
    },
    {
        "slug": "user-roles",
        "name": "User Roles",
        "description": "Assign, view, update, and revoke user role assignments.",
        "is_enabled": True,
    },
    {
        "slug": "user-grants",
        "name": "User Grants",
        "description": "Manage fine-grained per-user permission grants.",
        "is_enabled": True,
    },
    {
        "slug": "queues",
        "name": "Queues",
        "description": "Inspect and manage background job queues.",
        "is_enabled": True,
    },
    {
        "slug": "audit-logs",
        "name": "Audit Logs",
        "description": "View system audit log entries.",
        "is_enabled": True,
    },
    {
        "slug": "user-accounts",
        "name": "User Accounts",
        "description": "Manage account-level lifecycle operations such as administrative deletion scheduling.",
        "is_enabled": True,
    },
    {
        "slug": "features",
        "name": "Features",
        "description": "Manage RBAC feature definitions used by roles and user grants.",
        "is_enabled": True,
    },
    {
        "slug": "roles",
        "name": "Roles",
        "description": "Manage RBAC role definitions and their feature permission matrix.",
        "is_enabled": True,
    },
    {
        "slug": "events",
        "name": "Events",
        "description": "Create, read, update, and delete events and their sessions.",
        "is_enabled": True,
    },
    {
        "slug": "event-participants",
        "name": "Event Participants",
        "description": "Register, withdraw, check in, and manage event session participants.",
        "is_enabled": True,
    },
    {
        "slug": "event-feedback",
        "name": "Event Feedback",
        "description": "Submit and view post-event feedback from checked-in attendees.",
        "is_enabled": True,
    },
    {
        "slug": "event-volunteers",
        "name": "Event Volunteers",
        "description": "Apply for, assign, and manage volunteer rosters for events.",
        "is_enabled": True,
    },
    {
        "slug": "volunteers",
        "name": "Volunteers",
        "description": "Register and manage volunteer profiles and information.",
        "is_enabled": True,
    },
    {
        "slug": "volunteer-roles",
        "name": "Volunteer Roles",
        "description": "Create, read, update, and delete volunteer role definitions.",
        "is_enabled": True,
    },
    {
        "slug": "volunteer-applications",
        "name": "Volunteer Applications",
        "description": "Review and process volunteer applications.",
        "is_enabled": True,
    },
]

ROLES: list[dict] = [
    {
        "name": "participant",
        "description": "The baseline role for attendees. Can sign in/out, view their own profile, update/edit their own details, and delete their own account.",
        "is_default": True,
        "is_system": False,
    },
    {
        "name": "volunteer",
        "description": "Users who assist on the ground during events. Standard member permissions plus access to event onboarding/check-in features and limited participant data viewing.",
        "is_default": False,
        "is_system": False,
    },
    {
        "name": "event_organizer",
        "description": "Users responsible for planning and executing specific events. Can create/manage events, venues, and view complete attendance and demographic data for events they manage.",
        "is_default": False,
        "is_system": False,
    },
    {
        "name": "community_leader",
        "description": "The Davao DeFi Community PH management team. Read-only or read/write access across all events with access to consolidated data, reporting, analytics, and participant demographics.",
        "is_default": False,
        "is_system": True,
    },
    {
        "name": "system_administrator",
        "description": "The IT personnel maintaining Eventara. Complete CRUD access to all entities including user profiles/accounts, features, roles, and permissions.",
        "is_default": False,
        "is_system": True,
    },
]

# Permissions per role: { role_name: { feature_slug: [actions] } }
# Effect is ALLOW for all entries below; DENY grants are added as user-level
# overrides and are not seeded at the role level.
ROLE_PERMISSIONS: dict[str, dict[str, list[RoleAction]]] = {
    "participant": {
        "events": [RoleAction.READ],
        "event-participants": [RoleAction.CREATE, RoleAction.DELETE],
        "event-feedback": [RoleAction.CREATE],
    },
    "volunteer": {
        "events": [RoleAction.READ],
        "event-participants": [RoleAction.CREATE, RoleAction.DELETE],
        "event-feedback": [RoleAction.CREATE],
        "event-volunteers": [RoleAction.CREATE],
    },
    "event_organizer": {
        "venues": [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE],
        "events": ALL_ACTIONS,
        "event-participants": [RoleAction.READ, RoleAction.UPDATE],
        "event-feedback": [RoleAction.READ],
        "event-volunteers": ALL_ACTIONS,
        "volunteers": [RoleAction.READ],
        "volunteer-roles": ALL_ACTIONS,
        "volunteer-applications": [RoleAction.UPDATE],
    },
    "community_leader": {
        "venues": [RoleAction.READ],
        "user-roles": [RoleAction.READ],
        "user-grants": [RoleAction.READ],
        "features": [RoleAction.READ],
        "roles": [RoleAction.READ],
        "queues": [RoleAction.READ],
        "audit-logs": [RoleAction.READ],
        "events": [RoleAction.READ],
        "event-participants": [RoleAction.READ],
        "event-feedback": [RoleAction.READ],
        "event-volunteers": [RoleAction.READ],
        "volunteers": [RoleAction.READ],
        "volunteer-roles": [RoleAction.READ],
    },
    "system_administrator": {
        "venues": ALL_ACTIONS,
        "user-accounts": [RoleAction.READ, RoleAction.UPDATE, RoleAction.DELETE],
        "user-roles": ALL_ACTIONS,
        "user-grants": ALL_ACTIONS,
        "features": ALL_ACTIONS,
        "roles": ALL_ACTIONS,
        "queues": [RoleAction.READ, RoleAction.DELETE],
        "audit-logs": [RoleAction.READ],
        "events": ALL_ACTIONS,
        "event-participants": ALL_ACTIONS,
        "event-feedback": [RoleAction.READ],
        "event-volunteers": ALL_ACTIONS,
        "volunteers": [RoleAction.CREATE, RoleAction.READ, RoleAction.UPDATE],
        "volunteer-roles": ALL_ACTIONS,
        "volunteer-applications": [RoleAction.UPDATE],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _log(msg: str) -> None:
    print(f"  {msg}", flush=True)


async def _upsert_features(session) -> dict[str, UUID]:
    """Insert features, ignore conflicts on slug. Returns slug -> id map."""
    stmt = insert(Feature).values(FEATURES).on_conflict_do_nothing(index_elements=["slug"])
    await session.execute(stmt)

    rows = await session.execute(select(Feature.id, Feature.slug))
    return {slug: id_ for id_, slug in rows.all()}


async def _upsert_roles(session) -> dict[str, UUID]:
    """Insert roles, ignore conflicts on name. Returns name -> id map."""
    stmt = insert(Role).values(ROLES).on_conflict_do_nothing(index_elements=["name"])
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
    existing_rows = await session.execute(select(RolePermission.role_id, RolePermission.feature_id, RolePermission.action))
    existing: set[tuple] = {(str(r), str(f), a) for r, f, a in existing_rows.all()}

    new_records = [r for r in desired if (str(r["role_id"]), str(r["feature_id"]), r["action"]) not in existing]

    if not new_records:
        return 0

    await session.execute(insert(RolePermission).values(new_records))
    return len(new_records)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def run() -> None:
    print("\nRunning seed: RBAC\n" + "-" * 40)

    async with AsyncSessionLocal() as session, session.begin():
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
