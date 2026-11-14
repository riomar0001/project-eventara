import smtplib
import ssl
from datetime import timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import lru_cache

import boto3
from arq.connections import ArqRedis
from botocore.config import Config

from app.core.config import settings
from app.core.email_template import (
    email_verified_html,
    event_registration_qr_email_html,
    otp_email_html,
    verification_email_html,
)

__all__ = ["deliver_email", "email_verified_html", "event_registration_qr_email_html", "otp_email_html", "send_email", "verification_email_html"]


async def send_email(arq: ArqRedis, to: str, subject: str, html: str) -> None:
    """Enqueue an email delivery job onto the ARQ Redis queue.

    Returns immediately after the job is enqueued — the actual send
    happens inside the ARQ worker process (``send_email_job``), decoupling
    email delivery from the HTTP request lifecycle.

    If delivery fails inside the worker, ARQ will retry the job
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
    msg["From"] = settings.mail_from
    msg["To"] = to
    msg.attach(MIMEText(html, "html"))

    context = ssl.create_default_context()
    timeout = settings.MAIL_TIMEOUT_SECONDS

    if settings.MAIL_SECURE:
        with smtplib.SMTP_SSL(settings.MAIL_HOST, settings.MAIL_PORT, context=context, timeout=timeout) as server:
            server.login(settings.MAIL_USER, settings.MAIL_PASS)
            server.sendmail(settings.mail_from, to, msg.as_string())
    else:
        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT, timeout=timeout) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.MAIL_USER, settings.MAIL_PASS)
            server.sendmail(settings.mail_from, to, msg.as_string())


@lru_cache(maxsize=1)
def _ses_client():
    timeout = settings.MAIL_TIMEOUT_SECONDS
    config = Config(connect_timeout=timeout, read_timeout=timeout, retries={"max_attempts": 3, "mode": "standard"})
    return boto3.client("sesv2", region_name=settings.SES_REGION or None, config=config)


def _send_ses(to: str, subject: str, html: str) -> None:
    """Send through Amazon SES using the worker's IAM role."""
    _ses_client().send_email(
        FromEmailAddress=settings.mail_from,
        Destination={"ToAddresses": [to]},
        Content={
            "Simple": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html, "Charset": "UTF-8"}},
            }
        },
    )


def deliver_email(to: str, subject: str, html: str) -> None:
    """Blocking send through the configured provider (``MAIL_PROVIDER``)."""
    match settings.MAIL_PROVIDER:
        case "ses":
            _send_ses(to, subject, html)
        case "smtp":
            _send_smtp(to, subject, html)
        case unknown:
            raise RuntimeError(f"Unsupported MAIL_PROVIDER {unknown!r}")
