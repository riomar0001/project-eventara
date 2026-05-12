"""JWT token creation and verification for all token types used by the API.

Four token types are in use:

- **access** — short-lived JWT sent in the ``Authorization: Bearer`` header to
  authenticate API requests.  Signed with ``JWT_ACCESS_TOKEN_SECRET``.
- **refresh** — long-lived JWT used to obtain new access tokens.  The hash of
  the plaintext token is persisted in the ``refresh_tokens`` table so it can
  be revoked server-side.  Signed with ``JWT_REFRESH_TOKEN_SECRET``.
- **verification** — one-time JWT emailed to users after registration to confirm
  ownership of the email address.  Signed with ``JWT_VERIFICATION_TOKEN_SECRET``.
- **otp** — short-lived JWT issued after successful credential validation in the
  OTP login flow.  It encodes the user's identity so the ``/login/verify``
  endpoint can resolve the user without exposing the user ID in the request body.
  Signed with ``JWT_VERIFICATION_TOKEN_SECRET`` (separate ``type`` claim prevents
  cross-use).  Expires in ``OTP_TTL_MINUTES`` minutes.
- **event_qr** — admission QR JWT emailed after event session registration and
  scanned at check-in. Signed with ``ADMISSION_TOKEN_SECRET`` and expires at the
  event session end datetime.

All types are decoded through the shared ``_decode`` helper, which enforces
signature, expiry, and the ``type`` claim in one place.
"""

import uuid
from datetime import UTC, datetime, timedelta

import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security.constants import OTP_TTL_MINUTES
from app.core.security.hashing import hash_token, verify_token_hash
from app.domain.entities.token_entities import TokenPayload
from app.domain.entities.user_entity import UserProfile
from app.infrastructure.database.models.user_models import Token as TokenORM
from app.infrastructure.database.repositories.refresh_token_repository import (
    RefreshTokenRepository,
)


def _public_image_url(image_file_id: str | None) -> str | None:
    if not image_file_id:
        return None
    if image_file_id.startswith(("http://", "https://")):
        return image_file_id

    public_base = (settings.STORAGE_PUBLIC_URL or "").rstrip("/")
    if not public_base:
        return image_file_id
    return f"{public_base}/{image_file_id.lstrip('/')}"


def create_access_token(
    user_id: uuid.UUID,
    email: str,
    done_onboarding: bool,
    role: str | None = None,
    user: UserProfile | None = None,
) -> str:
    """Build and sign a short-lived access token for the given user.

    The token always includes ``sub``, ``email``, ``type``, ``jti``, ``iat``,
    and ``exp`` claims.  ``role`` and profile fields are embedded only when
    provided so the token payload stays compact for unenriched sessions.

    Args:
        user_id:  The user's UUID, stored in the ``sub`` claim.
        email:    The user's email address, embedded for convenience.
        done_onboarding:  Whether the user has completed the onboarding process.
        role:     Optional role name to include in the payload.
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

    if role:
        payload["role"] = role

    if user:
        payload.update(
            {
                "alias": user.alias,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "age_group": user.age_group,
                "gender": user.gender,
                "education_level": user.education_level,
                "occupation": user.occupation,
                "bio": user.bio,
                "image": _public_image_url(user.image_file_id),
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

    refresh_token = jwt.encode(payload, settings.JWT_REFRESH_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)

    repo = RefreshTokenRepository(db)
    await repo.create(
        TokenORM(
            id=token_id,
            user_id=user_id,
            token_hash=hash_token(refresh_token),
            expires_at=payload["exp"].replace(tzinfo=None),
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

    if not verify_token_hash(raw_token, refresh_token.token_hash):
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
    return jwt.encode(payload, settings.JWT_VERIFICATION_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)


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
    payload = _decode(token, secret=settings.JWT_VERIFICATION_TOKEN_SECRET, expected_type="verification")
    return TokenPayload(**payload)


def create_otp_token(user_id: uuid.UUID, email: str) -> str:
    """Build and sign a short-lived OTP session token.

    This token is issued after the user passes credential validation in
    ``/auth/login/init``.  It acts as a tamper-proof, time-bounded claim
    of the user's identity so the second step (``/auth/login/verify``)
    can resolve the user without accepting a raw user ID in the request
    body.

    The token uses the same secret as the verification token but carries
    ``type: "otp"``; the ``_decode`` helper enforces the type claim so
    the two token types cannot be used interchangeably.

    Args:
        user_id: The authenticated user's UUID, stored in the ``sub`` claim.
        email:   The user's email address, embedded for audit traceability.

    Returns:
        A signed JWT string to be returned to the client and submitted
        alongside the OTP code at ``/auth/login/verify``.
    """
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "otp",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + timedelta(minutes=OTP_TTL_MINUTES),
    }
    return jwt.encode(
        payload,
        settings.JWT_VERIFICATION_TOKEN_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def verify_otp_token(token: str) -> TokenPayload:
    """Decode and validate an OTP session token.

    Args:
        token: The raw JWT string returned by ``/auth/login/init``.

    Returns:
        A ``TokenPayload`` containing the ``sub`` (user ID) and ``email`` claims.

    Raises:
        ValueError: The token is expired, has an invalid signature, or is
            not of type ``otp``.
    """
    payload = _decode(token, secret=settings.JWT_VERIFICATION_TOKEN_SECRET, expected_type="otp")
    return TokenPayload(**payload)


def create_password_reset_token(user_id: uuid.UUID, email: str) -> str:
    """Build and sign a short-lived password reset token.

    The token is signed with ``JWT_VERIFICATION_TOKEN_SECRET`` and carries a
    ``type: "password_reset"`` claim so it cannot be used interchangeably with
    verification or OTP tokens.  It is intended to be hashed and stored in
    Redis so it can be consumed exactly once.

    Args:
        user_id: The requesting user's UUID, stored in the ``sub`` claim.
        email:   The user's email address, embedded for audit traceability.

    Returns:
        A signed JWT string to be included in the password reset link emailed
        to the user.
    """
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "password_reset",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + settings.PASSWORD_RESET_TOKEN_EXPIRATION,
    }
    return jwt.encode(payload, settings.JWT_VERIFICATION_TOKEN_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_password_reset_token(token: str) -> TokenPayload:
    """Decode and validate a password reset token.

    Args:
        token: The raw JWT string extracted from the password reset link.

    Returns:
        A ``TokenPayload`` containing the ``sub`` (user ID) and ``email`` claims.

    Raises:
        ValueError: The token is expired, has an invalid signature, or is not
            of type ``password_reset``.
    """
    payload = _decode(token, secret=settings.JWT_VERIFICATION_TOKEN_SECRET, expected_type="password_reset")
    return TokenPayload(**payload)


def _admission_token_secret() -> str:
    """Return the configured admission-token signing secret.

    Returns:
        The configured ``ADMISSION_TOKEN_SECRET`` value.

    Raises:
        ValueError: The admission token secret is not configured.
    """
    if not settings.ADMISSION_TOKEN_SECRET:
        raise ValueError("Admission token secret is not configured")
    return settings.ADMISSION_TOKEN_SECRET


def create_event_qr_token(
    *,
    user_id: uuid.UUID,
    participant_id: uuid.UUID,
    event_id: uuid.UUID,
    event_name: str,
    event_session_id: uuid.UUID,
    event_session_name: str,
    expires_at: datetime,
) -> str:
    """Build and sign an event attendance QR token.

    The QR token is sent to a registered attendee after successful session
    registration. It embeds the attendee, participant record, event, and
    session identity so a scan can verify the token and resolve the exact
    registration to check in. Its ``exp`` claim is the event session end
    datetime, which makes the QR code unusable after the attendance window.

    Args:
        user_id: The attendee user's UUID, stored in the ``sub`` claim.
        participant_id: The event participant row that will be checked in.
        event_id: The parent event UUID.
        event_name: The parent event title.
        event_session_id: The event session UUID.
        event_session_name: The session title.
        expires_at: Session end datetime used as the JWT expiration.

    Returns:
        A signed JWT string suitable for encoding in a QR code.
    """
    now = datetime.now(UTC)
    exp = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=UTC)
    payload = {
        "sub": str(user_id),
        "participant_id": str(participant_id),
        "event_id": str(event_id),
        "event_name": event_name,
        "event_session_id": str(event_session_id),
        "event_session_name": event_session_name,
        "type": "event_qr",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": exp,
    }
    return jwt.encode(payload, _admission_token_secret(), algorithm=settings.JWT_ALGORITHM)


def verify_event_qr_token(token: str) -> dict:
    """Decode and validate an event attendance QR token.

    Args:
        token: The raw JWT string extracted from the attendee's QR code.

    Returns:
        The decoded QR token claims.

    Raises:
        ValueError: The token is expired, invalid, or not an ``event_qr`` token.
    """
    return _decode(token, secret=_admission_token_secret(), expected_type="event_qr")


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
        if settings.DEBUG:
            raise ValueError(f"Invalid token: {exc}")
        raise ValueError("Invalid token")

    if payload.get("type") != expected_type:
        if settings.DEBUG:
            raise ValueError(f"Expected {expected_type} token, got {payload.get('type')!r}")
        raise ValueError("Invalid token type")

    return payload
