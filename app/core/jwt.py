import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

import jwt
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import hash_string, verify_hash
from app.infrastructure.database.models.token import Token
from app.infrastructure.database.repositories.refresh_token_respository import RefreshTokenRepository

from app.core.entities.user import UserProfile


class TokenPayload(BaseModel):
    sub: str          # user_id
    email: str | None = None
    role_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    age_group: str | None = None
    gender: str | None = None
    education_level: str | None = None
    type: Literal["access", "refresh", "verification"]
    jti: str          # unique token ID — used to match refresh token in DB
    exp: datetime
    iat: datetime


# Access token - contains user info, short-lived, no DB storage needed
def create_access_token(user_id: uuid.UUID, role_id: str, user: UserProfile) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": user.email,
        "role_id": role_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "age_group": user.age_group,
        "gender": user.gender,
        "education_level": user.education_level,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.ACCESS_TOKEN_EXPIRATION,
    }
    return jwt.encode(payload, settings.JWT_ACCESS_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_access_token(token: str) -> TokenPayload:
    payload = _decode(
        token, secret=settings.JWT_ACCESS_TOKEN_SECRET, expected_type="access")
    return TokenPayload(**payload)


# Refresh token - stored in DB with hashed value, only the raw token is sent to client
async def create_refresh_token(user_id: uuid.UUID, db: AsyncSession) -> str:
    """Returns a refresh token.

    Store the token ID as Token.id and the hashed token as Token.token_hash.
    Send the raw token to the client.
    """

    now = datetime.now(timezone.utc)
    token_id = uuid.uuid4()
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(token_id),
        "iat": now,
        "exp": now + settings.REFRESH_TOKEN_EXPIRATION,
    }

    refresh_token = jwt.encode(payload, settings.JWT_REFRESH_TOKEN_SECRET,
                               algorithm=settings.JWT_ALGORITHM)

    repo = RefreshTokenRepository(db)
    await repo.create(Token(
        id=token_id,
        user_id=user_id,
        token_hash=hash_string(refresh_token),
        expires_at=payload["exp"],
    ))

    return refresh_token


async def verify_refresh_token(raw_token: str, db: AsyncSession) -> tuple[TokenPayload, Token]:
    """Decode the JWT, fetch the matching active token from DB, verify the hash.

    Returns (payload, token_record) so the caller can revoke or update it.
    Raises ValueError if the token is invalid, expired, not found, or revoked.
    """
    payload = _decode(
        raw_token, secret=settings.JWT_REFRESH_TOKEN_SECRET, expected_type="refresh")

    token_id = uuid.UUID(payload["jti"])

    repo = RefreshTokenRepository(db)
    refresh_token = await repo.get_active_by_id(token_id)

    if not refresh_token:
        raise ValueError("Invalid refresh token or has been revoked")

    if not verify_hash(raw_token, refresh_token.token_hash):
        raise ValueError("Invalid refresh token")

    return TokenPayload(**payload), refresh_token


# Verification token (for email verification, password reset, etc.)
def verification_token(user_id: uuid.UUID, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "verification",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.VERIFICATION_TOKEN_EXPIRATION,
    }
    return jwt.encode(payload, settings.JWT_VERIFICATION_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_verification_token(token: str) -> TokenPayload:
    payload = _decode(
        token, secret=settings.JWT_VERIFICATION_TOKEN_SECRET, expected_type="verification")
    return TokenPayload(**payload)


# Internal function to decode and validate a token, used by both access and refresh token verification functions.
def _decode(token: str, secret: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as exc:
        raise ValueError(f"Invalid token: {exc}")

    if payload.get("type") != expected_type:
        raise ValueError(
            f"Expected {expected_type} token, got {payload.get('type')!r}")

    return payload
