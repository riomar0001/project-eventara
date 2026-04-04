import asyncio
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.infrastructure.messaging.auth_email_templates import otp_email_html, verification_email_html

__all__ = ["send_email", "verification_email_html", "otp_email_html"]


async def send_email(to: str, subject: str, html: str) -> None:
    """Send an HTML email without blocking the async event loop.

    ``smtplib`` is synchronous, so the call is offloaded to a thread via
    ``asyncio.to_thread`` to avoid stalling the event loop during the SMTP
    handshake and data transfer.
    """
    await asyncio.to_thread(_send_smtp, to, subject, html)


def _send_smtp(to: str, subject: str, html: str) -> None:
    """Perform the blocking SMTP send.

    Supports two transport modes controlled by ``settings.MAIL_SECURE``:
    - ``True``  — connects with SMTP_SSL (implicit TLS on port 465).
    - ``False`` — connects with plain SMTP then upgrades via STARTTLS (port 587).
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.MAIL_USER
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()

    if settings.MAIL_SECURE:
        with smtplib.SMTP_SSL(settings.MAIL_HOST, settings.MAIL_PORT, context=context) as server:
            server.login(settings.MAIL_USER, settings.MAIL_PASS)
            server.sendmail(settings.MAIL_USER, to, msg.as_string())
    else:
        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.MAIL_USER, settings.MAIL_PASS)
            server.sendmail(settings.MAIL_USER, to, msg.as_string())
