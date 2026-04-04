import secrets

import bcrypt


def hash_string(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


def verify_hash(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP.

    Uses ``secrets.choice`` (backed by the OS CSPRNG) instead of ``random``
    so the output cannot be predicted from previous values.
    """
    return "".join(secrets.choice("0123456789") for _ in range(length))
