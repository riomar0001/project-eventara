"""Scheduled job that queues pre-session reminder emails (every 15 minutes)."""

import logging

from app.application.use_cases.session_reminder_usecase import SessionReminderUseCase
from app.core.config import settings
from app.infrastructure.database.repositories.event_participant_repository import EventParticipantRepository
from app.infrastructure.database.session import AsyncSessionLocal
from app.infrastructure.messaging.email import send_email

logger = logging.getLogger(__name__)


async def send_session_reminders_job(ctx: dict) -> None:
    """Queue one reminder email per registration whose session starts within a day."""
    jobs = ctx.get("jobs")
    if jobs is None:
        raise RuntimeError("send_session_reminders_job needs a job queue in its context")

    async with AsyncSessionLocal() as session:
        use_case = SessionReminderUseCase(
            EventParticipantRepository(session),
            jobs,
            site_url=settings.CORS_ORIGIN,
            display_timezone=settings.DISPLAY_TIMEZONE,
            email_sender=send_email,
        )
        queued = await use_case.send_due_reminders()
    if queued:
        logger.info("Queued %d session reminder email(s)", queued)
