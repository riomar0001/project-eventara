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
        f"<p>Your check-in for <strong>{event_title}</strong> is confirmed.</p>"
        f"<p>Session: {session_title}</p>"
        f"<p>Checked in at: {checked_in_time}</p>"
        f"<p>Checked in by: {checked_in_by}</p>"
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
