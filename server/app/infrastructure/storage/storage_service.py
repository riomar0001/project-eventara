import uuid

import boto3
from botocore.config import Config

from app.core.config import settings

_ALLOWED_RESOURCE_TYPES = frozenset(["event-cover-banner", "registration-uploads", "user-profile"])

_ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}

PRESIGN_EXPIRES_IN = 3600


def _require_storage_settings() -> None:
    missing = [
        name
        for name, value in [
            ("STORAGE_ENDPOINT", settings.STORAGE_ENDPOINT),
            ("STORAGE_ACCESS_KEY_ID", settings.STORAGE_ACCESS_KEY_ID),
            ("STORAGE_SECRET_ACCESS_KEY", settings.STORAGE_SECRET_ACCESS_KEY),
            ("STORAGE_BUCKET_NAME", settings.STORAGE_BUCKET_NAME),
            ("STORAGE_PUBLIC_URL", settings.STORAGE_PUBLIC_URL),
        ]
        if not value
    ]
    if missing:
        raise RuntimeError(f"Object storage is not fully configured. Missing: {', '.join(missing)}.")


class StorageService:
    def generate_presigned_upload(self, resource_type: str, content_type: str) -> tuple[str, str, str, int]:
        """Return (upload_url, object_key, public_url, expires_in).

        Raises ValueError for unsupported inputs, RuntimeError if any storage env var is missing.
        """
        if resource_type not in _ALLOWED_RESOURCE_TYPES:
            raise ValueError(f"Unknown resource type '{resource_type}'. Allowed: {', '.join(sorted(_ALLOWED_RESOURCE_TYPES))}.")

        ext = _ALLOWED_CONTENT_TYPES.get(content_type)
        if not ext:
            raise ValueError(f"Unsupported content type '{content_type}'. Allowed: {', '.join(_ALLOWED_CONTENT_TYPES)}.")

        _require_storage_settings()

        client = boto3.client(
            "s3",
            endpoint_url=settings.STORAGE_ENDPOINT,
            aws_access_key_id=settings.STORAGE_ACCESS_KEY_ID,
            aws_secret_access_key=settings.STORAGE_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

        object_key = f"{resource_type}/{uuid.uuid4()}.{ext}"

        upload_url: str = client.generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.STORAGE_BUCKET_NAME, "Key": object_key, "ContentType": content_type},
            ExpiresIn=PRESIGN_EXPIRES_IN,
        )

        public_url = f"{settings.STORAGE_PUBLIC_URL.rstrip('/')}/{object_key}"  # type: ignore[union-attr]

        return upload_url, object_key, public_url, PRESIGN_EXPIRES_IN
