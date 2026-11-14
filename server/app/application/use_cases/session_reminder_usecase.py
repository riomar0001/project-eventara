"""Queue reminder emails for sessions starting within the next day."""

import logging
import uuid
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Protocol
from zoneinfo import ZoneInfo

from app.application.dto.session_reminder_dto import SessionReminder
from app.application.interfaces.job_queue_interface import IJobQueue
from app.core.email_template.event import session_reminder_email_html

logger = logging.getLogger(__name__)

EmailSender = Callable[[IJobQueue, str, str, str], Awaitable[None]]


class ISessionReminderRepository(Protocol):
    async def claim_due_reminders(self, *, now: datetime, horizon: timedelta, min_notice: timedelta, limit: int) -> list[SessionReminder]: ...

    async def release_reminders(self, participant_ids: list[uuid.UUID]) -> None: ...


class SessionReminderUseCase:
    """Send each registered attendee one reminder about a day before their session.

    Rows are claimed (``reminder_sent_at`` set) before emails are queued, so
    overlapping runs never double-send. If queueing an email fails, its claim
    is released and the next run retries it.
    """

    HORIZON = timedelta(hours=24)
    # Registrations newer than this just received the confirmation email.
    MIN_NOTICE = timedelta(hours=2)
    BATCH_SIZE = 200

    def __init__(
        self,
        repo: ISessionReminderRepository,
        jobs: IJobQueue,
        *,
        site_url: str,
        display_timezone: str,
        email_sender: EmailSender,
    ) -> None:
        self.repo = repo
        self.jobs = jobs
        self.site_url = site_url.rstrip("/")
        self.timezone = ZoneInfo(display_timezone)
        self.email_sender = email_sender

    def _format_start(self, start: datetime) -> str:
        local = (start if start.tzinfo else start.replace(tzinfo=UTC)).astimezone(self.timezone)
        return f"{local:%a, %d %b %Y · %I:%M %p} ({self.timezone.key})"

    async def send_due_reminders(self, now: datetime | None = None) -> int:
        """Claim due registrations, queue their emails, and return how many were queued."""
        now = now or datetime.now(UTC)
        reminders = await self.repo.claim_due_reminders(now=now, horizon=self.HORIZON, min_notice=self.MIN_NOTICE, limit=self.BATCH_SIZE)

        failed: list[uuid.UUID] = []
        for reminder in reminders:
            html = session_reminder_email_html(
                first_name=reminder.first_name,
                event_title=reminder.event_title,
                session_title=reminder.session_title,
                starts_at=self._format_start(reminder.session_start),
                venue_name=reminder.venue_name,
                venue_address=reminder.venue_address,
                event_url=f"{self.site_url}/events/{reminder.event_id}",
            )
            try:
                await self.email_sender(self.jobs, reminder.email, f"Reminder: {reminder.session_title} starts soon", html)
            except Exception:
                logger.exception("Could not queue reminder for participant %s", reminder.participant_id)
                failed.append(reminder.participant_id)

        if failed:
            await self.repo.release_reminders(failed)
        return len(reminders) - len(failed)
