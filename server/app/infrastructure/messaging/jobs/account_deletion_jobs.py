"""ARQ background jobs for deferred account-deletion finalization.

Scheduling deletion is intentionally split into two phases:
1. The request thread persists the pending deletion window immediately.
2. ARQ executes the irreversible finalization after the grace period elapses.

This keeps the API responsive while still giving the deletion lifecycle a
single serialized execution path in the worker layer.
"""

from app.application.use_cases.account_settings_usecase import FinalizeAccountDeletionUseCase
from app.infrastructure.database.repositories.user_repository import UserRepository
from app.infrastructure.database.session import AsyncSessionLocal


async def finalize_account_deletion_job(
    ctx: dict,
    user_id: str,
    requested_at: str,
    scheduled_for: str,
) -> None:
    """Finalize a pending account deletion if its original grace window is still active.

    Args:
        ctx: ARQ worker context injected by the framework; unused directly.
        user_id: Serialized UUID of the account being finalized.
        requested_at: Original request timestamp captured at scheduling time.
        scheduled_for: Original grace-period deadline captured at scheduling time.
    """
    async with AsyncSessionLocal() as session:
        use_case = FinalizeAccountDeletionUseCase(UserRepository(session))
        await use_case.execute(
            user_id=user_id,
            requested_at=requested_at,
            scheduled_for=scheduled_for,
        )
