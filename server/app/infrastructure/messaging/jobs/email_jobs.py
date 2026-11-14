"""ARQ background jobs for email delivery.

Separating the job definition from the transport layer (SMTP or SES) means the worker
can import this module without pulling in application-layer dependencies, and
the job can be unit-tested by mocking ``deliver_email`` in isolation.
"""

import asyncio
import json
from datetime import timedelta

from app.infrastructure.messaging.email import deliver_email

_FAILURE_TTL = int(timedelta(days=7).total_seconds())


async def send_email_job(ctx: dict, *, to: str, subject: str, html: str) -> None:
    """ARQ job that delivers a single HTML email via the configured provider.

    Runs inside the ARQ worker process.  ``deliver_email`` is synchronous, so it
    is offloaded to a thread to avoid blocking the worker event loop.

    TTL policy:
    - Queue TTL:        3 hours  (job discarded if not picked up in time)
    - Success result:   12 hours (configured via ``func()`` in WorkerSettings)
    - Failure record:   7 days   (stored under ``email_failure:<job_id>`` in Redis)

    ARQ will automatically retry this job up to ``max_tries`` times (configured
    on the worker) with exponential back-off if an exception is raised.

    Args:
        ctx:     ARQ worker context (injected by the framework).
        to:      Recipient email address.
        subject: Email subject line.
        html:    HTML body of the email.
    """
    try:
        await asyncio.to_thread(deliver_email, to, subject, html)
    except Exception as exc:
        job_id = ctx.get("job_id", "unknown")
        job_try = ctx.get("job_try", 1)
        failure_key = f"email_failure:{job_id}"
        failure_data = json.dumps({"to": to, "subject": subject, "attempt": job_try, "error": repr(exc)})
        await ctx["redis"].set(failure_key, failure_data, ex=_FAILURE_TTL)
        raise
