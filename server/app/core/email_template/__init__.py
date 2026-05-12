from app.core.email_template.auth import (
    account_locked_email_html,
    email_verified_html,
    otp_email_html,
    reset_password_email_html,
    verification_email_html,
)
from app.core.email_template.event import check_in_receipt_email_html, event_registration_qr_email_html

__all__ = [
    "account_locked_email_html",
    "check_in_receipt_email_html",
    "email_verified_html",
    "event_registration_qr_email_html",
    "otp_email_html",
    "reset_password_email_html",
    "verification_email_html",
]
