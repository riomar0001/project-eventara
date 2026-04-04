"""Security policy constants.

All tunable security thresholds and durations live here so they can be
reviewed and adjusted in one place without touching business logic.
"""

from datetime import timedelta


# ---------------------------------------------------------------------------
# Brute-force / account lockout
# ---------------------------------------------------------------------------

MAX_FAILED_LOGIN_ATTEMPTS: int = 5
"""Number of consecutive wrong-password attempts before the account is locked."""

LOCKOUT_DURATION: timedelta = timedelta(minutes=15)
"""How long an account stays locked after hitting the failure threshold."""


# ---------------------------------------------------------------------------
# One-time passcodes (OTP)
# ---------------------------------------------------------------------------

OTP_TTL_MINUTES: int = 10
"""Minutes before a generated OTP expires and is no longer accepted."""
