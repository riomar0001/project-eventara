"""Event-related email templates."""

from html import escape
from urllib.parse import quote


def check_in_receipt_email_html(
    *,
    event_title: str,
    session_title: str,
    checked_in_time: str,
    checked_in_by: str,
) -> str:
    """Build the check-in receipt email body for an attendee."""
    return (
        f"<p>Your check-in for <strong>{escape(event_title)}</strong> is confirmed.</p>"
        f"<p>Session: {escape(session_title)}</p>"
        f"<p>Checked in at: {escape(checked_in_time)}</p>"
        f"<p>Checked in by: {escape(checked_in_by)}</p>"
    )


def event_registration_qr_email_html(
    *,
    event_title: str,
    session_title: str,
    session_end_datetime: str,
    qr_token: str,
) -> str:
    """Build the registration confirmation email body with a QR code image.

    The email presents a QR image whose encoded content is the signed event QR
    JWT, plus a plaintext fallback token for scanners or clients that block
    remote images. The JWT expiration is shown to the attendee using the event
    session end datetime.
    """
    encoded_token = quote(qr_token, safe="")
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data={encoded_token}"
    return (
        f"<p>Your registration for <strong>{escape(event_title)}</strong> is confirmed.</p>"
        f"<p>Session: {escape(session_title)}</p>"
        f"<p>This QR code expires when the session ends: {escape(session_end_datetime)}</p>"
        f'<p><img src="{qr_url}" alt="Event check-in QR code" width="240" height="240" /></p>'
        f"<p>QR token: <code>{escape(qr_token)}</code></p>"
    )


def session_reminder_email_html(
    *,
    first_name: str | None,
    event_title: str,
    session_title: str,
    starts_at: str,
    venue_name: str,
    venue_address: str,
    event_url: str,
) -> str:
    """Build the reminder sent about a day before a registered session starts.

    Links to the event page, where the attendee's check-in QR code is shown,
    instead of embedding the admission token in the email again.
    """
    greeting = f"Hi {escape(first_name)}," if first_name else "Hi,"
    return (
        f"<p>{greeting}</p>"
        f"<p>This is a reminder that <strong>{escape(session_title)}</strong> "
        f"({escape(event_title)}) starts soon.</p>"
        f"<p><strong>When:</strong> {escape(starts_at)}<br />"
        f"<strong>Where:</strong> {escape(venue_name)}, {escape(venue_address)}</p>"
        f'<p><a href="{escape(event_url, quote=True)}">View the event and your check-in QR code</a></p>'
        "<p>Can no longer make it? Withdraw from the session on the event page so someone else can take your seat.</p>"
    )
