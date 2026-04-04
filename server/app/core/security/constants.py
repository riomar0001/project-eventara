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
# Login rate limiting (Redis)
# Two independent counters run in parallel — both must pass for a request to
# proceed.  Per-IP blocks mass scanning across many accounts; per-account
# blocks targeted brute-force from many IPs against a single account.
# ---------------------------------------------------------------------------

# Per-IP — network-level throttle, higher threshold because many users share
# an IP (offices, universities, NAT gateways).
LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS: int = 300
"""Maximum login requests allowed per IP within one rate-limit window."""

LOGIN_IP_RATE_LIMIT_WINDOW_SECONDS: int = 60
"""Length of the per-IP rate-limit window in seconds."""

# Per-account — protects an individual account regardless of which IP the
# requests come from.  Lower threshold than IP so targeted attacks are caught
# even when spread across many source addresses.
LOGIN_ACCOUNT_RATE_LIMIT_MAX_ATTEMPTS: int = 10
"""Maximum login requests allowed per email address within one rate-limit window."""

LOGIN_ACCOUNT_RATE_LIMIT_WINDOW_SECONDS: int = 60
"""Length of the per-account rate-limit window in seconds."""


# ---------------------------------------------------------------------------
# One-time passcodes (OTP)
# ---------------------------------------------------------------------------

OTP_TTL_MINUTES: int = 11
"""Minutes before a generated OTP expires and is no longer accepted."""
