"""JWT token creation and verification for all token types used by the API.

Three token types are in use:

- **access** — short-lived JWT sent in the ``Authorization: Bearer`` header to
  authenticate API requests.  Signed with ``JWT_ACCESS_TOKEN_SECRET``.
- **refresh** — long-lived JWT used to obtain new access tokens.  The hash of
  the plaintext token is persisted in the ``refresh_tokens`` table so it can
  be revoked server-side.  Signed with ``JWT_REFRESH_TOKEN_SECRET``.
- **verification** — one-time JWT emailed to users after registration to confirm
  ownership of the email address.  Signed with ``JWT_VERIFICATION_TOKEN_SECRET``.

All three types are decoded through the shared ``_decode`` helper, which
enforces signature, expiry, and the ``type`` claim in one place.
"""

import uuid
from datetime import UTC, datetime

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security.hashing import hash_string, verify_hash
from app.domain.entities.token_entities import TokenPayload
from app.domain.entities.user_entity import UserProfile
from app.infrastructure.database.models.user_models import Token as TokenORM
from app.infrastructure.database.repositories.refresh_token_repository import (
    RefreshTokenRepository,
)


def create_access_token(
    user_id: uuid.UUID,
    email: str,
    done_onboarding: bool,
    role_id: str | None = None,
    user: UserProfile | None = None,
) -> str:
    """Build and sign a short-lived access token for the given user.

    The token always includes ``sub``, ``email``, ``type``, ``jti``, ``iat``,
    and ``exp`` claims.  ``role_id`` and profile fields are embedded only when
    provided so the token payload stays compact for unenriched sessions.

    Args:
        user_id:  The user's UUID, stored in the ``sub`` claim.
        email:    The user's email address, embedded for convenience.
        done_onboarding:  Whether the user has completed the onboarding process.
        role_id:  Optional role identifier to include in the payload.
        user:     Optional full profile; when supplied, name and demographic
                  fields are embedded so clients avoid a separate profile fetch.

    Returns:
        A signed JWT string ready to be sent in the ``Authorization: Bearer`` header.
    """
    now = datetime.now(UTC)

    payload = {
        "sub": str(user_id),
        "email": email,
        "done_onboarding": done_onboarding,
        "type": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.ACCESS_TOKEN_EXPIRATION,
    }

    # Optional fields
    if role_id:
        payload["role_id"] = role_id

    if user:
        payload.update(
            {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "age_group": user.age_group,
                "gender": user.gender,
                "education_level": user.education_level,
            }
        )

    return jwt.encode(
        payload,
        settings.JWT_ACCESS_TOKEN_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def verify_access_token(token: str) -> TokenPayload:
    """Decode and validate an access token.

    Args:
        token: The raw JWT string from the ``Authorization: Bearer`` header.

    Returns:
        A ``TokenPayload`` with the claims from the verified token.

    Raises:
        ValueError: The token is expired, has an invalid signature, or is not
            of type ``access``.
    """
    payload = _decode(token, secret=settings.JWT_ACCESS_TOKEN_SECRET, expected_type="access")
    return TokenPayload(**payload)


async def create_refresh_token(user_id: uuid.UUID, db: AsyncSession) -> str:
    """Build, sign, and persist a long-lived refresh token.

    The plaintext token is returned to the caller (to be sent to the client)
    but only its bcrypt hash is stored in the database.  This means a database
    breach does not expose usable refresh tokens.

    Args:
        user_id: The user the token belongs to.
        db:      An active async database session used to persist the token record.

    Returns:
        The plaintext signed JWT to be delivered to the client.
    """
    now = datetime.now(UTC)
    token_id = uuid.uuid4()
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": str(token_id),
        "iat": now,
        "exp": now + settings.REFRESH_TOKEN_EXPIRATION,
    }

    refresh_token = jwt.encode(
        payload, settings.JWT_REFRESH_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM
    )

    repo = RefreshTokenRepository(db)
    await repo.create(
        TokenORM(
            id=token_id,
            user_id=user_id,
            token_hash=hash_string(refresh_token),
            expires_at=payload["exp"],
        )
    )

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
    """Build and sign a one-time email verification token.

    The token is sent to the user's email address after registration.
    It encodes the user's ID and email so the verification endpoint can
    look up and confirm the correct account without any additional state.

    Args:
        user_id: The registering user's UUID, stored in the ``sub`` claim.
        email:   The email address being verified, embedded for traceability.

    Returns:
        A signed JWT string to be included in the verification link.
    """
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "verification",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.VERIFICATION_TOKEN_EXPIRATION,
    }
    return jwt.encode(
        payload, settings.JWT_VERIFICATION_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM
    )


def verify_verification_token(token: str) -> TokenPayload:
    """Decode and validate an email verification token.

    Args:
        token: The raw JWT string extracted from the verification link.

    Returns:
        A ``TokenPayload`` containing the ``sub`` (user ID) and ``email`` claims.

    Raises:
        ValueError: The token is expired, has an invalid signature, or is not
            of type ``verification``.
    """
    payload = _decode(
        token, secret=settings.JWT_VERIFICATION_TOKEN_SECRET, expected_type="verification"
    )
    return TokenPayload(**payload)


def _decode(token: str, secret: str, expected_type: str) -> dict:
    """Decode a JWT and enforce signature, expiry, and token-type claims.

    Centralises all PyJWT error handling so every public verify function gets
    consistent ``ValueError`` messages regardless of which token type failed.

    Args:
        token:         The raw JWT string to decode.
        secret:        The HMAC secret that was used to sign the token.
        expected_type: The value the ``type`` claim must equal (e.g. ``"access"``).

    Returns:
        The decoded payload dictionary if all checks pass.

    Raises:
        ValueError: Raised for any of the following:
            - The token has expired (``jwt.ExpiredSignatureError``).
            - The signature or structure is invalid (``jwt.InvalidTokenError``).
            - The ``type`` claim does not match ``expected_type``.
    """
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
