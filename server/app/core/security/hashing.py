import hashlib
import hmac
import secrets

import bcrypt


def hash_string(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


def verify_hash(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_token(value: str) -> str:
    """SHA-256 hash for tokens (e.g. refresh tokens).

    bcrypt is limited to 72 bytes and is intentionally slow — both are wrong
    for hashing JWTs. SHA-256 has no length limit and is fast enough for
    token lookups while still being a one-way function.
    """
    return hashlib.sha256(value.encode()).hexdigest()


def verify_token_hash(plain: str, hashed: str) -> bool:
    """Constant-time comparison to prevent timing attacks."""
    return hmac.compare_digest(hash_token(plain), hashed)


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP.

    Uses ``secrets.choice`` (backed by the OS CSPRNG) instead of ``random``
    so the output cannot be predicted from previous values.
    """
    return "".join(secrets.choice("0123456789") for _ in range(length))
