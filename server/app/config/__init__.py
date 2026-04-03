from datetime import timedelta

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_duration(value: str) -> timedelta:
    units = {"s": "seconds", "m": "minutes", "h": "hours", "d": "days"}
    value = value.strip().lower()
    if value[-1] in units:
        return timedelta(**{units[value[-1]]: int(value[:-1])})
    return timedelta(minutes=int(value))


class Settings(BaseSettings):
    APP_NAME: str = "Eventara"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USERNAME: str = ""
    REDIS_PASSWORD: str = ""

    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_SECRET: str
    JWT_REFRESH_TOKEN_SECRET: str
    JWT_VERIFICATION_TOKEN_SECRET: str
    ACCESS_TOKEN_EXPIRATION: timedelta = timedelta(minutes=30)
    REFRESH_TOKEN_EXPIRATION: timedelta = timedelta(days=7)
    VERIFICATION_TOKEN_EXPIRATION: timedelta = timedelta(hours=24)

    MAIL_HOST: str
    MAIL_PORT: int
    MAIL_SECURE: bool
    MAIL_USER: str
    MAIL_PASS: str

    CORS_ORIGIN: str
    ALLOWED_ORIGINS: str = "*"

    @field_validator("ACCESS_TOKEN_EXPIRATION", "REFRESH_TOKEN_EXPIRATION","VERIFICATION_TOKEN_EXPIRATION", mode="before")
    @classmethod
    def parse_duration(cls, v: str) -> timedelta:
        if isinstance(v, timedelta):
            return v
        return _parse_duration(str(v))

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()  # type: ignore[call-arg]
