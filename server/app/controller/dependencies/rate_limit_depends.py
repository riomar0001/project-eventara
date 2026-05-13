from fastapi import HTTPException, Request, status

from app.core.security.constants import (
    APP_FEEDBACK_IP_RATE_LIMIT_MAX_ATTEMPTS,
    APP_FEEDBACK_IP_RATE_LIMIT_WINDOW_SECONDS,
    LOGIN_ACCOUNT_RATE_LIMIT_MAX_ATTEMPTS,
    LOGIN_ACCOUNT_RATE_LIMIT_WINDOW_SECONDS,
    LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS,
    LOGIN_IP_RATE_LIMIT_WINDOW_SECONDS,
)
from app.infrastructure.cache.repositories.rate_limit_repository import RateLimitRepository


async def login_rate_limit(request: Request) -> None:
    """FastAPI dependency that enforces two independent Redis rate limits on login.

    Two fixed-window counters are checked in sequence:

    1. **Per-IP** (``rate_limit:login:ip:{ip}``) — catches mass scanning where
       one source address tries many different accounts.  Threshold is higher
       because legitimate users often share an IP (office NAT, university Wi-Fi).

    2. **Per-account** (``rate_limit:login:account:{email}``) — catches targeted
       brute-force against a single account spread across many source IPs.
       The email is read from the raw request body so the check runs before
       any framework validation; if the body is missing or malformed the
       per-account check is skipped and the route handler will return a 422.

    Both checks include a ``Retry-After`` header on 429 responses so clients
    know exactly how long to wait.  Counters expire automatically — no cleanup
    is needed on success.
    """
    repo = RateLimitRepository(request.app.state.redis)

    ip = request.client.host if request.client else "unknown"
    ip_count = await repo.hit(
        f"rate_limit:login:ip:{ip}",
        LOGIN_IP_RATE_LIMIT_WINDOW_SECONDS,
    )
    if ip_count > LOGIN_IP_RATE_LIMIT_MAX_ATTEMPTS:
        ttl = await repo.get_ttl(f"rate_limit:login:ip:{ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts from this network. Try again in {ttl} second(s).",
            headers={"Retry-After": str(ttl)},
        )

    try:
        body = await request.json()
        email = str(body.get("email", "")).lower().strip()
    except Exception:
        email = ""

    if email:
        account_count = await repo.hit(
            f"rate_limit:login:account:{email}",
            LOGIN_ACCOUNT_RATE_LIMIT_WINDOW_SECONDS,
        )
        if account_count > LOGIN_ACCOUNT_RATE_LIMIT_MAX_ATTEMPTS:
            ttl = await repo.get_ttl(f"rate_limit:login:account:{email}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts for this account. Try again in {ttl} second(s).",
                headers={"Retry-After": str(ttl)},
            )


async def app_feedback_rate_limit(request: Request) -> None:
    """FastAPI dependency that enforces a per-IP fixed-window rate limit on anonymous feedback.

    Uses a single Redis counter keyed by IP address.  The window is set only on
    the first hit of each window (``EXPIRE … NX``) so the clock is not reset by
    subsequent requests.  The ``Retry-After`` header on 429 responses tells clients
    the exact number of seconds remaining in the current window.
    """
    repo = RateLimitRepository(request.app.state.redis)
    ip = request.client.host if request.client else "unknown"

    count = await repo.hit(
        f"rate_limit:app_feedback:ip:{ip}",
        APP_FEEDBACK_IP_RATE_LIMIT_WINDOW_SECONDS,
    )
    if count > APP_FEEDBACK_IP_RATE_LIMIT_MAX_ATTEMPTS:
        ttl = await repo.get_ttl(f"rate_limit:app_feedback:ip:{ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many feedback submissions. Try again in {ttl} second(s).",
            headers={"Retry-After": str(ttl)},
        )
