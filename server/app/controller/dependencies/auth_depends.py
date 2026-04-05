import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security.token_service import verify_access_token

_bearer = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> uuid.UUID:
    """FastAPI dependency that extracts and validates the caller's user ID.

    Decodes the Bearer token from the ``Authorization`` header and returns the
    ``sub`` claim as a ``UUID``.  Any ``ValueError`` raised by
    ``verify_access_token`` (expired, invalid signature, wrong type) is mapped
    to a 401 response with a ``WWW-Authenticate: Bearer`` header as required
    by RFC 6750.
    """
    try:
        payload = verify_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
    return uuid.UUID(payload.sub)


def require_completed_onboarding(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> uuid.UUID:
    """FastAPI dependency that enforces completed onboarding as a precondition.

    Validates the Bearer token exactly like ``get_current_user_id``, then
    additionally checks the ``done_onboarding`` claim.  Routes that require a
    fully set-up account should declare this dependency instead of
    ``get_current_user_id``.

    Returns the caller's user ID on success so it can be used directly in the
    route handler without a second token decode.

    Raises 401 if the token is invalid or expired, and 403 if the token is
    valid but onboarding has not been completed.
    """
    try:
        payload = verify_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not payload.done_onboarding:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Onboarding must be completed to access this resource.",
        )
    return uuid.UUID(payload.sub)
