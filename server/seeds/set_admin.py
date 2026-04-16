"""
Seed: Set Admin Role
Assigns the system_administrator role to an existing user by user id.
Idempotent — safe to run multiple times for the same user.

Usage (from server/):
    python .\\seeds\\set_admin.py -id fd15698a-f8ca-4481-9e2e-5e63da4bc000
    python -m seeds.set_admin --id fd15698a-f8ca-4481-9e2e-5e63da4bc000
"""

from __future__ import annotations

import argparse
import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

try:
    from seeds._bootstrap import ensure_server_on_path
except ModuleNotFoundError:
    from _bootstrap import ensure_server_on_path

ensure_server_on_path()

from app.domain.entities.authorization_entities import GrantEffect
from app.infrastructure.database.models.user_models import Feature, Role, RolePermission, User, UserGrant, UserRole
from app.infrastructure.database.session import AsyncSessionLocal
from seeds.rbac_user_management import _upsert_features, _upsert_role_permissions, _upsert_roles


def _log(message: str) -> None:
    print(f"  {message}", flush=True)


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assign the system_administrator role to an existing user.",
    )
    parser.add_argument(
        "-id",
        "--id",
        dest="user_id",
        type=UUID,
        required=True,
        help="The user UUID to promote.",
    )
    return parser.parse_args()


async def _get_user(session, user_id: UUID) -> User:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise RuntimeError(f"User not found: {user_id}")
    return user


async def _get_admin_role(session) -> Role:
    result = await session.execute(select(Role).where(Role.name == "system_administrator"))
    role = result.scalar_one_or_none()
    if role is None:
        raise RuntimeError("Role 'system_administrator' not found. Run seeds.rbac_user_management first.")
    return role


async def _ensure_rbac_seeded(session) -> None:
    feature_ids = await _upsert_features(session)
    role_ids = await _upsert_roles(session)
    await _upsert_role_permissions(session, feature_ids, role_ids)


async def _assign_admin_role(session, user_id: UUID, role_id: UUID) -> bool:
    existing = await session.execute(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id,
        )
    )
    if existing.scalar_one_or_none():
        return False

    stmt = insert(UserRole).values(
        user_id=user_id,
        role_id=role_id,
        assigned_at=_utcnow_naive(),
    )
    await session.execute(stmt)
    return True


async def _assign_admin_grants(session, user_id: UUID, role_id: UUID) -> int:
    permissions_result = await session.execute(
        select(RolePermission.feature_id, RolePermission.action, RolePermission.effect).where(RolePermission.role_id == role_id)
    )
    permissions = permissions_result.all()
    if not permissions:
        return 0

    existing_result = await session.execute(
        select(UserGrant.feature_id, UserGrant.action).where(
            UserGrant.user_id == user_id,
            UserGrant.role_id == role_id,
        )
    )
    existing = {(feature_id, action) for feature_id, action in existing_result.all()}

    new_grants = [
        {
            "user_id": user_id,
            "role_id": role_id,
            "feature_id": feature_id,
            "action": action,
            "effect": effect if isinstance(effect, GrantEffect) else GrantEffect(effect),
        }
        for feature_id, action, effect in permissions
        if (feature_id, action) not in existing
    ]

    if not new_grants:
        return 0

    await session.execute(insert(UserGrant).values(new_grants))
    return len(new_grants)


async def run(user_id: UUID) -> None:
    print("\nRunning seed: Set Admin Role\n" + "-" * 40)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            await _ensure_rbac_seeded(session)
            user = await _get_user(session, user_id)
            role = await _get_admin_role(session)
            created = await _assign_admin_role(session, user.id, role.id)
            grant_count = await _assign_admin_grants(session, user.id, role.id)

            _log(f"User found: {user.email} ({user.id})")
            if created:
                _log("Assigned role: system_administrator")
            else:
                _log("system_administrator role already assigned")
            _log(f"Ensured {grant_count} user grant(s)")

    print("-" * 40)
    print("Done.\n")


if __name__ == "__main__":
    args = parse_args()
    asyncio.run(run(args.user_id))
