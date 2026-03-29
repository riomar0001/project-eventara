import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from pydantic import BaseModel

from app.config import settings
from app.core.security import hash_string, verify_hash


class TokenPayload(BaseModel):
    sub: str          # user_id
    role: str
    type: Literal["access", "refresh"]
    jti: str          # unique token ID — used to match refresh token in DB
    exp: datetime
    iat: datetime



# Access token
def create_access_token(user_id: uuid.UUID, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    }
    return jwt.encode(payload, settings.JWT_ACCESS_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_access_token(token: str) -> TokenPayload:
    payload = _decode(token, secret=settings.JWT_ACCESS_TOKEN_SECRET, expected_type="access")
    return TokenPayload(**payload)



# Refresh token
def create_refresh_token(user_id: uuid.UUID, role: str) -> tuple[str, str]:
    """Returns (raw_token, hashed_token).

    Store `hashed_token` in the DB (Token.token_hash).
    Send `raw_token` to the client.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.REFRESH_TOKEN_EXPIRE_MINUTES,
    }
    raw = jwt.encode(payload, settings.JWT_REFRESH_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)
    return raw, hash_string(raw)


def verify_refresh_token(raw_token: str, token_hash: str) -> TokenPayload:
    """Verifies the JWT signature/expiry AND that it matches the hash stored in DB."""
    if not verify_hash(raw_token, token_hash):
        raise ValueError("Refresh token does not match stored hash")
    payload = _decode(raw_token, secret=settings.JWT_REFRESH_TOKEN_SECRET, expected_type="refresh")
    return TokenPayload(**payload)


def rotate_refresh_token(
    raw_token: str, token_hash: str, role: str
) -> tuple[str, str, str]:
    """Verify old refresh token, then issue a new access + refresh token pair.

    Returns (new_access_token, new_raw_refresh_token, new_hashed_refresh_token).
    Caller is responsible for revoking the old Token record and saving the new hash.
    """
    payload = verify_refresh_token(raw_token, token_hash)
    user_id = uuid.UUID(payload.sub)
    new_access = create_access_token(user_id, role)
    new_raw_refresh, new_hash = create_refresh_token(user_id, role)
    return new_access, new_raw_refresh, new_hash



# Internal
def _decode(token: str, secret: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Invalid token: {exc}")

    if payload.get("type") != expected_type:
        raise ValueError(f"Expected {expected_type} token, got {payload.get('type')!r}")

    return payload
