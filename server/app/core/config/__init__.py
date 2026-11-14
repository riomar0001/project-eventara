from datetime import timedelta

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_duration(value: str) -> timedelta:
    """Parse ``"15m"``, ``"3h"``, ``"7d"``, ``"30s"`` or bare minutes (``"60"``)."""
    units = {"s": "seconds", "m": "minutes", "h": "hours", "d": "days"}
    value = value.strip().lower()
    if not value:
        raise ValueError("Duration must not be empty")
    unit = units.get(value[-1], "minutes")
    number = value[:-1] if value[-1] in units else value
    if not number.isdigit():
        raise ValueError(f"Invalid duration {value!r}; expected e.g. '15m', '3h', '7d'")
    amount = int(number)
    if amount <= 0:
        raise ValueError(f"Duration must be positive, got {value!r}")
    return timedelta(**{unit: amount})


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
    ADMISSION_TOKEN_SECRET: str | None = None
    ACCESS_TOKEN_EXPIRATION: timedelta = timedelta(hours=3)
    REFRESH_TOKEN_EXPIRATION: timedelta = timedelta(days=7)
    VERIFICATION_TOKEN_EXPIRATION: timedelta = timedelta(hours=24)
    PASSWORD_RESET_TOKEN_EXPIRATION: timedelta = timedelta(hours=1)

    MAIL_HOST: str
    MAIL_PORT: int
    MAIL_SECURE: bool
    MAIL_USER: str
    MAIL_PASS: str

    CORS_ORIGIN: str
    # Comma-separated string in .env: https://a.com,https://b.com
    # Empty by default (no cross-origin access). "*" is only allowed with DEBUG on:
    # the API sends credentials, so Starlette would reflect any Origin back.
    ALLOWED_ORIGINS: str = ""

    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    STORAGE_ENDPOINT: str | None = None
    STORAGE_ACCESS_KEY_ID: str | None = None
    STORAGE_SECRET_ACCESS_KEY: str | None = None
    STORAGE_BUCKET_NAME: str | None = None
    STORAGE_PUBLIC_URL: str | None = None

    @field_validator(
        "ACCESS_TOKEN_EXPIRATION",
        "REFRESH_TOKEN_EXPIRATION",
        "VERIFICATION_TOKEN_EXPIRATION",
        "PASSWORD_RESET_TOKEN_EXPIRATION",
        mode="before",
    )
    @classmethod
    def parse_duration(cls, v: str) -> timedelta:
        if isinstance(v, timedelta):
            return v
        return _parse_duration(str(v))

    @model_validator(mode="after")
    def reject_wildcard_origin_outside_debug(self) -> Settings:
        if not self.DEBUG and "*" in self.allowed_origins_list:
            raise ValueError("ALLOWED_ORIGINS must list explicit origins when DEBUG is off; '*' is unsafe with credentialed CORS")
        return self

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()  # type: ignore[call-arg]
