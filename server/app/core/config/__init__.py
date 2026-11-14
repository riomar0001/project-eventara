from datetime import timedelta
from typing import Literal

from pydantic import Field, field_validator, model_validator
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
    # Lambda runs one request per container, so it wants a tiny pool (1/0).
    DB_POOL_SIZE: int = Field(default=5, ge=1, le=50)
    DB_MAX_OVERFLOW: int = Field(default=10, ge=0, le=100)

    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_USERNAME: str = ""
    REDIS_PASSWORD: str = ""
    # ElastiCache with in-transit encryption requires TLS.
    REDIS_SSL: bool = False

    # True runs the arq worker inside the API process (local dev). On AWS the API
    # runs on Lambda, which freezes between requests, so a separate worker runs it.
    RUN_EMBEDDED_WORKER: bool = True

    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_SECRET: str
    JWT_REFRESH_TOKEN_SECRET: str
    JWT_VERIFICATION_TOKEN_SECRET: str
    ADMISSION_TOKEN_SECRET: str | None = None
    ACCESS_TOKEN_EXPIRATION: timedelta = timedelta(hours=3)
    REFRESH_TOKEN_EXPIRATION: timedelta = timedelta(days=7)
    VERIFICATION_TOKEN_EXPIRATION: timedelta = timedelta(hours=24)
    PASSWORD_RESET_TOKEN_EXPIRATION: timedelta = timedelta(hours=1)

    # "smtp" for local/dev mail servers, "ses" for Amazon SES via the IAM role.
    MAIL_PROVIDER: Literal["smtp", "ses"] = "smtp"
    # Sender address; falls back to MAIL_USER for SMTP setups that predate it.
    MAIL_FROM: str = ""
    MAIL_HOST: str = ""
    MAIL_PORT: int = 587
    MAIL_SECURE: bool = False
    MAIL_USER: str = ""
    MAIL_PASS: str = ""
    MAIL_TIMEOUT_SECONDS: float = Field(default=15, gt=0, le=120)
    SES_REGION: str | None = None

    CORS_ORIGIN: str
    # Comma-separated string in .env: https://a.com,https://b.com
    # Empty by default (no cross-origin access). "*" is only allowed with DEBUG on:
    # the API sends credentials, so Starlette would reflect any Origin back.
    ALLOWED_ORIGINS: str = ""

    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Leave ENDPOINT and the key pair empty on AWS: boto3 then talks to S3 with
    # the Lambda/ECS IAM role. Set them for S3-compatible stores (R2, MinIO).
    STORAGE_ENDPOINT: str | None = None
    STORAGE_REGION: str | None = None
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

    @property
    def mail_from(self) -> str:
        return self.MAIL_FROM or self.MAIL_USER

    @model_validator(mode="after")
    def require_mail_settings(self) -> Settings:
        if not self.mail_from:
            raise ValueError("MAIL_FROM (or MAIL_USER) must be set")
        if self.MAIL_PROVIDER == "smtp" and not (self.MAIL_HOST and self.MAIL_USER and self.MAIL_PASS):
            raise ValueError("MAIL_PROVIDER=smtp requires MAIL_HOST, MAIL_USER and MAIL_PASS")
        return self

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
