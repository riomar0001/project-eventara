import uuid
from datetime import datetime, timezone
from typing import Literal

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domain.entities.token import TokenPayload
from app.domain.entities.user_entity import UserProfile
from app.infrastructure.database.models.user_models import Token as TokenORM
from app.infrastructure.repositories.refresh_token_repository import RefreshTokenRepository
from app.core.security.hashing import hash_string, verify_hash


def create_access_token(
    user_id: uuid.UUID,
    email: str,
    role_id: str | None = None,
    user: UserProfile | None = None,
) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.ACCESS_TOKEN_EXPIRATION,
    }

    # Optional fields
    if role_id:
        payload["role_id"] = role_id

    if user:
        payload.update({
            "first_name": user.first_name,
            "last_name": user.last_name,
            "age_group": user.age_group,
            "gender": user.gender,
            "education_level": user.education_level,
        })

    return jwt.encode(
        payload,
        settings.JWT_ACCESS_TOKEN_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

def verify_access_token(token: str) -> TokenPayload:
    payload = _decode(token, secret=settings.JWT_ACCESS_TOKEN_SECRET, expected_type="access")
    return TokenPayload(**payload)


async def create_refresh_token(user_id: uuid.UUID, db: AsyncSession) -> str:
    now = datetime.now(timezone.utc)
    token_id = uuid.uuid4()
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(token_id),
        "iat": now,
        "exp": now + settings.REFRESH_TOKEN_EXPIRATION,
    }

    refresh_token = jwt.encode(payload, settings.JWT_REFRESH_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)

    repo = RefreshTokenRepository(db)
    await repo.create(TokenORM(
        id=token_id,
        user_id=user_id,
        token_hash=hash_string(refresh_token),
        expires_at=payload["exp"],
    ))

    return refresh_token


async def verify_refresh_token(raw_token: str, db: AsyncSession) -> tuple[TokenPayload, TokenORM]:
    """Decode the JWT, fetch the matching active token from DB, verify the hash.

    Returns (payload, token_record) so the caller can revoke or update it.
    Raises ValueError if the token is invalid, expired, not found, or revoked.
    """
    payload = _decode(raw_token, secret=settings.JWT_REFRESH_TOKEN_SECRET, expected_type="refresh")

    token_id = uuid.UUID(payload["jti"])

    repo = RefreshTokenRepository(db)
    refresh_token = await repo.get_active_by_id(token_id)

    if not refresh_token:
        raise ValueError("Invalid refresh token or has been revoked")

    if not verify_hash(raw_token, refresh_token.token_hash):
        raise ValueError("Invalid refresh token")

    return TokenPayload(**payload), refresh_token


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
    payload = _decode(token, secret=settings.JWT_VERIFICATION_TOKEN_SECRET, expected_type="verification")
    return TokenPayload(**payload)


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
        raise ValueError(f"Expected {expected_type} token, got {payload.get('type')!r}")

    return payload
