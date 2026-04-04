"""ARQ background jobs for email delivery.

Separating the job definition from the SMTP transport layer means the worker
can import this module without pulling in application-layer dependencies, and
the job can be unit-tested by mocking ``_send_smtp`` in isolation.
"""

import asyncio

from app.infrastructure.messaging.email import _send_smtp


async def send_email_job(ctx: dict, *, to: str, subject: str, html: str) -> None:
    """ARQ job that delivers a single HTML email via SMTP.

    Runs inside the ARQ worker process.  ``_send_smtp`` is synchronous, so it
    is offloaded to a thread to avoid blocking the worker event loop.

    ARQ will automatically retry this job up to ``max_tries`` times (configured
    on the worker) with exponential back-off if an exception is raised.

    Args:
        ctx:     ARQ worker context (injected by the framework, not used here).
        to:      Recipient email address.
        subject: Email subject line.
        html:    HTML body of the email.
    """
    await asyncio.to_thread(_send_smtp, to, subject, html)
