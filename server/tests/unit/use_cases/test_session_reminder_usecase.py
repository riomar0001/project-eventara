"""Unit tests for SessionReminderUseCase."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from app.application.dto.session_reminder_dto import SessionReminder
from app.application.use_cases.session_reminder_usecase import SessionReminderUseCase
from app.core.email_template.event import session_reminder_email_html

NOW = datetime(2026, 11, 20, 2, 0, tzinfo=UTC)
EVENT_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


def _reminder(email: str = "ana@example.com") -> SessionReminder:
    return SessionReminder(
        participant_id=uuid.uuid4(),
        email=email,
        first_name="Ana",
        event_id=EVENT_ID,
        event_title="Davao DeFi Summit",
        session_title="Opening Keynote",
        session_start=datetime(2026, 11, 21, 1, 30, tzinfo=UTC),
        venue_name="SMX Convention Center",
        venue_address="Lanang, Davao City",
    )


def _make(reminders, sender=None):
    repo = AsyncMock()
    repo.claim_due_reminders = AsyncMock(return_value=reminders)
    repo.release_reminders = AsyncMock()
    sender = sender or AsyncMock()
    uc = SessionReminderUseCase(repo, AsyncMock(), site_url="https://eventara.example/", display_timezone="Asia/Manila", email_sender=sender)
    return uc, repo, sender


@pytest.mark.asyncio
async def test_claims_a_day_ahead_with_notice_window():
    """Claims registrations for sessions starting within 24h, skipping ones made in the last 2h."""
    uc, repo, _ = _make([])
    assert await uc.send_due_reminders(now=NOW) == 0
    repo.claim_due_reminders.assert_awaited_once_with(now=NOW, horizon=timedelta(hours=24), min_notice=timedelta(hours=2), limit=200)


@pytest.mark.asyncio
async def test_queues_one_email_per_claimed_registration():
    """Queues a reminder email per claim, with local time and an event link."""
    uc, repo, sender = _make([_reminder("a@example.com"), _reminder("b@example.com")])
    assert await uc.send_due_reminders(now=NOW) == 2
    assert [c.args[1] for c in sender.await_args_list] == ["a@example.com", "b@example.com"]
    _, _, subject, html = sender.await_args_list[0].args
    assert subject == "Reminder: Opening Keynote starts soon"
    assert "Sat, 21 Nov 2026 · 09:30 AM (Asia/Manila)" in html
    assert f"https://eventara.example/events/{EVENT_ID}" in html
    repo.release_reminders.assert_not_awaited()


@pytest.mark.asyncio
async def test_releases_claims_whose_email_could_not_be_queued():
    """A failed enqueue releases only that claim so the next run retries it."""
    ok, bad = _reminder("ok@example.com"), _reminder("bad@example.com")

    async def sender(_jobs, to, _subject, _html):
        if to == "bad@example.com":
            raise RuntimeError("sqs down")

    uc, repo, _ = _make([ok, bad], sender=sender)
    assert await uc.send_due_reminders(now=NOW) == 1
    repo.release_reminders.assert_awaited_once_with([bad.participant_id])


def test_invalid_timezone_is_rejected():
    with pytest.raises(Exception):
        SessionReminderUseCase(AsyncMock(), AsyncMock(), site_url="x", display_timezone="Mars/Olympus", email_sender=AsyncMock())


def test_reminder_template_escapes_user_text():
    payload = "<script>x</script>"
    html = session_reminder_email_html(
        first_name=payload,
        event_title=payload,
        session_title=payload,
        starts_at="t",
        venue_name=payload,
        venue_address=payload,
        event_url='https://e.example/events/1"><script>',
    )
    assert "<script>" not in html


def test_reminder_template_greets_without_a_name():
    html = session_reminder_email_html(
        first_name=None, event_title="E", session_title="S", starts_at="t", venue_name="V", venue_address="A", event_url="https://e/x"
    )
    assert html.startswith("<p>Hi,</p>")
