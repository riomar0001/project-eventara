import asyncio
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings
from app.infrastructure.messaging.templates import otp_email_html, verification_email_html

__all__ = ["send_email", "verification_email_html", "otp_email_html"]


async def send_email(to: str, subject: str, html: str) -> None:
    await asyncio.to_thread(_send_smtp, to, subject, html)


def _send_smtp(to: str, subject: str, html: str) -> None:
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
