from passlib.context import CryptContext

_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_string(value: str) -> str:
    return _ctx.hash(value)


def verify_hash(plain: str, hashed: str) -> bool:
    return _ctx.verify(plain, hashed)
