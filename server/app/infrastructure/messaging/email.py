import smtplib
import ssl
from datetime import timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from arq.connections import ArqRedis

from app.core.config import settings
from app.core.email_template import (
    email_verified_html,
    event_registration_qr_email_html,
    otp_email_html,
    verification_email_html,
)

__all__ = ["email_verified_html", "event_registration_qr_email_html", "otp_email_html", "send_email", "verification_email_html"]


async def send_email(arq: ArqRedis, to: str, subject: str, html: str) -> None:
    """Enqueue an email delivery job onto the ARQ Redis queue.

    Returns immediately after the job is enqueued — the actual SMTP send
    happens inside the ARQ worker process (``send_email_job``), decoupling
    email delivery from the HTTP request lifecycle.

    If the SMTP call fails inside the worker, ARQ will retry the job
    automatically according to the worker's ``max_tries`` setting.

    Args:
        arq:     The ARQ connection pool used to enqueue the job.
        to:      Recipient email address.
        subject: Email subject line.
        html:    HTML body of the email.
    """
    await arq.enqueue_job("send_email_job", to=to, subject=subject, html=html, _expires=timedelta(hours=3))


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
