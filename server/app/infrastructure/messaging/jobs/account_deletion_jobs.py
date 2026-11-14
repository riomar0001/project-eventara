"""Scheduled job that finalizes account deletions after their grace period.

Scheduling deletion is split into two phases:
1. The request persists the pending deletion window immediately.
2. This job, run every 5 minutes by the scheduler, deletes every account whose
   window has elapsed. SQS cannot delay a message for the 30-day grace period,
   so the database row, not a deferred message, is the source of truth.
"""

from app.application.use_cases.account_settings_usecase import AccountSettingsUseCase
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import AsyncSessionLocal


async def finalize_due_account_deletions_job(ctx: dict) -> None:
    """Finalize all account deletions whose grace period has elapsed."""
    async with AsyncSessionLocal() as session:
        await AccountSettingsUseCase(UserRepository(session)).finalize_due_account_deletions()
