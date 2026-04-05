"""ARQ background jobs for refresh token lifecycle management.

Keeping token jobs in a dedicated module separates scheduling concerns from
the repository layer and makes it straightforward to add further token
maintenance tasks (e.g. purging old revoked records) without touching the
email jobs module.
"""

from app.infrastructure.database.repositories.refresh_token_repository import (
    RefreshTokenRepository,
)
from app.infrastructure.database.session import AsyncSessionLocal


async def revoke_expired_tokens_job(ctx: dict) -> None:
    """ARQ cron job that revokes all active refresh tokens past their expiry.

    Runs once every 24 hours (scheduled via ``WorkerSettings.cron_jobs``).
    Opening its own database session keeps this job self-contained and
    independent of any request lifecycle.

    Concurrency note:
        The underlying ``revoke_expired`` repository method issues a single
        bulk ``UPDATE … WHERE is_active = TRUE AND expires_at < now``.  If
        two worker instances execute the job simultaneously (e.g. during a
        rolling deployment), the second will find zero matching rows and
        commit a no-op — no duplicate revocations or data corruption can occur.

    Args:
        ctx: ARQ worker context injected by the framework; not used directly.
    """
    async with AsyncSessionLocal() as session:
        repo = RefreshTokenRepository(session)
        await repo.revoke_expired()
