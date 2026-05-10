"""File upload routes.

Provides a presigned URL endpoint so the frontend can upload files directly
to Cloudflare R2 without routing binary data through the API server.

Flow:
  1. Client POSTs resource_type + content_type → receives a presigned PUT URL.
  2. Client PUTs the file directly to that URL (R2).
  3. Client saves the returned object_key alongside the resource record.

Requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
          R2_PUBLIC_URL in server .env.  Returns 503 when R2 is not configured.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.controller.dependencies import get_current_user_id
from app.controller.dependencies.storage_depends import get_storage_service
from app.controller.schemas.upload_schema import PresignUploadData, PresignUploadRequest, PresignUploadResponse
from app.infrastructure.storage.storage_service import StorageService

upload_router = APIRouter(prefix="/uploads", tags=["Uploads"])


@upload_router.post(
    "/presign",
    response_model=PresignUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a presigned upload URL",
    description=(
        "Returns a short-lived presigned PUT URL targeting Cloudflare R2.  "
        "The client uploads the file directly to that URL, then saves the "
        "returned `object_key` on the relevant resource.\n\n"
        "**Requires** a valid Bearer token (any authenticated user)."
    ),
)
async def generate_presigned_url(
    body: PresignUploadRequest,
    _user_id: UUID = Depends(get_current_user_id),
    storage: StorageService = Depends(get_storage_service),
) -> PresignUploadResponse:
    try:
        upload_url, object_key, public_url, expires_in = storage.generate_presigned_upload(
            resource_type=body.resource_type,
            content_type=body.content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    return PresignUploadResponse(
        data=PresignUploadData(
            upload_url=upload_url,
            object_key=object_key,
            public_url=public_url,
            expires_in=expires_in,
        )
    )
