"""
Seed: System Administrator
Creates the system admin user (from ADMIN_EMAIL / ADMIN_PASSWORD env vars),
marks their email as verified, and assigns the system_administrator role.
Idempotent — safe to run multiple times.

Usage (from server/):
    python -m seeds.system_admin
"""

import asyncio
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.config import settings
from app.core.security.hashing import hash_string
from app.domain.entities.user_entity import UserStatus
from app.infrastructure.database.models.user_models import (
    Role,
    User,
    UserActivity,
    UserRole,
    UserSecurity,
)
from app.infrastructure.database.session import AsyncSessionLocal

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _log(msg: str) -> None:
    print(f"  {msg}", flush=True)


async def _get_or_create_admin(session) -> UUID:
    """Upsert the admin User row. Returns the user id."""
    existing = await session.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    user = existing.scalar_one_or_none()

    if user:
        _log(f"Admin user already exists: {settings.ADMIN_EMAIL}")
        return user.id

    now = datetime.now(timezone.utc)
    stmt = (
        insert(User)
        .values(
            email=settings.ADMIN_EMAIL,
            password=hash_string(settings.ADMIN_PASSWORD),
            onboarding_completed=True,
            onboarding_completed_at=now,
            status=UserStatus.ACTIVE.value,
        )
        .on_conflict_do_nothing(index_elements=["email"])
        .returning(User.id)
    )
    result = await session.execute(stmt)
    row = result.fetchone()
    if row:
        _log(f"Created admin user: {settings.ADMIN_EMAIL}")
        return row[0]

    # Race condition — fetch the row that was already inserted
    existing = await session.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
    return existing.scalar_one().id


async def _ensure_security(session, user_id: UUID) -> None:
    """Upsert UserSecurity with email_verified=True."""
    now = datetime.now(timezone.utc)
    stmt = (
        insert(UserSecurity)
        .values(
            user_id=user_id,
            email_verified=True,
            email_verified_at=now,
        )
        .on_conflict_do_update(
            index_elements=["user_id"],
            set_={"email_verified": True, "email_verified_at": now},
        )
    )
    await session.execute(stmt)
    _log("UserSecurity: email_verified = True")


async def _ensure_activity(session, user_id: UUID) -> None:
    """Upsert UserActivity row."""
    stmt = (
        insert(UserActivity)
        .values(user_id=user_id)
        .on_conflict_do_nothing(index_elements=["user_id"])
    )
    await session.execute(stmt)
    _log("UserActivity: row ensured")


async def _assign_admin_role(session, user_id: UUID) -> None:
    """Assign system_administrator role to the admin user."""
    role_row = await session.execute(select(Role).where(Role.name == "system_administrator"))
    role = role_row.scalar_one_or_none()
    if not role:
        raise RuntimeError(
            "Role 'system_administrator' not found. Run seeds.rbac_user_management first."
        )

    existing = await session.execute(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role_id == role.id,
        )
    )
    if existing.scalar_one_or_none():
        _log("system_administrator role already assigned")
        return

    stmt = insert(UserRole).values(
        user_id=user_id,
        role_id=role.id,
        assigned_at=datetime.now(timezone.utc),
    )
    await session.execute(stmt)
    _log("Assigned role: system_administrator")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def run() -> None:
    print("\nRunning seed: System Administrator\n" + "-" * 40)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            user_id = await _get_or_create_admin(session)
            await _ensure_security(session, user_id)
            await _ensure_activity(session, user_id)
            await _assign_admin_role(session, user_id)

    print("-" * 40)
    print("Done.\n")


if __name__ == "__main__":
    asyncio.run(run())
