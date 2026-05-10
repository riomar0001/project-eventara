"""Venue management and rating API routes.

Admin CRUD endpoints require an authenticated caller with the appropriate RBAC
permission on the ``venues`` feature.  Rating endpoints only require a valid
access token — no feature permission is needed.

Error mapping summary:
  - 401  missing, expired, or invalid Bearer token
  - 403  RBAC denial (admin endpoints only)
  - 404  venue or rating not found
  - 409  name conflict (admin), or duplicate rating (user)
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.venue_dto import CreateVenueInput, ListVenuesInput, UpdateVenueImageInput, UpdateVenueInput
from app.application.dto.venue_rating_dto import (
    CreateVenueRatingInput,
    ListVenueRatingsInput,
    UpdateVenueRatingInput,
)
from app.application.use_cases.audit_log_usecase import AuditLogUseCase
from app.application.use_cases.venue_rating_usecase import VenueRatingUseCase
from app.application.use_cases.venue_usecase import VenueManagementUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_venue, serialize_venue_rating
from app.controller.dependencies import get_audit_log_use_case, get_current_user_id, require_permission
from app.controller.dependencies.storage_depends import get_storage_service
from app.controller.dependencies.use_cases_depends import get_venue_management_use_case, get_venue_rating_use_case
from app.controller.docs.venue_management_docs import (
    COMMUNITY_VENUE_CREATE_OPENAPI_EXTRA,
    FORBIDDEN,
    OFFICIAL_VENUE_CREATE_OPENAPI_EXTRA,
    UNAUTHORIZED,
    VALIDATION_ERROR,
    VENUE_CONFLICT,
    VENUE_IMAGE_UPLOAD_OPENAPI_EXTRA,
    VENUE_IMAGE_STORAGE_UNAVAILABLE,
    VENUE_IN_USE,
    VENUE_NOT_FOUND,
    VENUE_UPDATE_OPENAPI_EXTRA,
)
from app.controller.docs.venue_rating_docs import (
    RATING_CONFLICT,
    RATING_NOT_FOUND,
    RATING_VALIDATION_ERROR,
)
from app.controller.docs.venue_rating_docs import (
    UNAUTHORIZED as RATING_UNAUTHORIZED,
)
from app.controller.schemas.venue_management_schema import (
    CommunityVenueCreateRequest,
    OfficialVenueCreateRequest,
    PublicVenueListResponse,
    PublicVenueRecordResponse,
    PublicVenueResponse,
    VenueImageUploadData,
    VenueImageUploadRequest,
    VenueImageUploadResponse,
    VenueListResponse,
    VenuePaginationResponse,
    VenueRecordResponse,
    VenueResponse,
    VenueUpdateRequest,
)
from app.controller.schemas.venue_rating_schema import (
    VenueRatingAverageData,
    VenueRatingAverageResponse,
    VenueRatingCreateRequest,
    VenueRatingDeleteResponse,
    VenueRatingListResponse,
    VenueRatingPaginationResponse,
    VenueRatingRecordResponse,
    VenueRatingResponse,
    VenueRatingUpdateRequest,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus
from app.domain.entities.authorization_entities import RoleAction
from app.domain.entities.venue_entities import VenueType
from app.domain.exceptions.venue_exceptions import (
    UnauthorizedVenueOperationError,
    VenueAlreadyExistsError,
    VenueInUseError,
    VenueNotFoundError,
)
from app.domain.exceptions.venue_rating_exceptions import (
    VenueRatingAlreadyExistsError,
    VenueRatingNotFoundError,
)
from app.infrastructure.storage.storage_service import StorageService

venue_router = APIRouter(prefix="/venues", tags=["Venues"])


def _to_venue_response(venue) -> VenueRecordResponse:
    return VenueRecordResponse(
        id=venue.id,
        creator_id=venue.creator_id,
        image_url=StorageService.public_url_for_object_key(venue.image_url),
        name=venue.name,
        description=venue.description,
        address_line=venue.address_line,
        city=venue.city,
        province=venue.province,
        postal_code=venue.postal_code,
        region=venue.region,
        country=venue.country,
        capacity=venue.capacity,
        venue_type=venue.venue_type,
        popularity_count=venue.popularity_count,
        usage_count=venue.usage_count,
        is_partner=venue.is_partner,
        amenities=venue.amenities,
        contact_name=venue.contact_name,
        contact_phone=venue.contact_phone,
        contact_email=venue.contact_email,
        created_at=venue.created_at,
        updated_at=venue.updated_at,
    )


def _to_public_venue_response(venue) -> PublicVenueRecordResponse:
    return PublicVenueRecordResponse(
        id=venue.id,
        image_url=StorageService.public_url_for_object_key(venue.image_url),
        name=venue.name,
        description=venue.description,
        address_line=venue.address_line,
        city=venue.city,
        province=venue.province,
        postal_code=venue.postal_code,
        region=venue.region,
        country=venue.country,
        capacity=venue.capacity,
        venue_type=venue.venue_type,
        popularity_count=venue.popularity_count,
        usage_count=venue.usage_count,
        is_partner=venue.is_partner,
        amenities=venue.amenities,
        created_at=venue.created_at,
        updated_at=venue.updated_at,
    )


def _build_pagination(result) -> VenuePaginationResponse:
    return VenuePaginationResponse(
        page=result.page,
        page_size=result.page_size,
        total_count=result.total_count,
        total_pages=result.total_pages,
        has_next=result.page < result.total_pages,
        has_previous=result.page > 1 and result.total_pages > 0,
    )


# ─── Public endpoints (no authentication required) ────────────────────────────


@venue_router.get(
    "/public/partners",
    response_model=PublicVenueListResponse,
    status_code=status.HTTP_200_OK,
    summary="List partner venues (public)",
    description=("Return a paginated list of partner venues visible to the public. Contact information is excluded from all records."),
)
async def list_partner_venues(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    venue_type: VenueType | None = Query(default=None),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
) -> PublicVenueListResponse:
    """Return one paginated page of partner venue records without contact details.

    This endpoint is public and requires no authentication.
    """
    result = await use_case.list_venues(ListVenuesInput(page=page, page_size=page_size, search=search, venue_type=venue_type, is_partner=True))
    return PublicVenueListResponse(
        data=[_to_public_venue_response(v) for v in result.venues],
        pagination=_build_pagination(result),
    )


@venue_router.get(
    "/public/partners/{venue_id}",
    response_model=PublicVenueResponse,
    status_code=status.HTTP_200_OK,
    responses={**VENUE_NOT_FOUND},
    summary="Get one partner venue (public)",
    description=(
        "Return a single partner venue by UUID. Returns 404 when the venue does not exist or is not a partner. Contact information is excluded."
    ),
)
async def get_partner_venue(
    venue_id: uuid.UUID,
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
) -> PublicVenueResponse:
    """Return a single partner venue record without contact details.

    This endpoint is public and requires no authentication.

    # Error mapping
    - **404 Not Found** — no venue exists for the UUID, or the venue is not a partner.
    """
    try:
        result = await use_case.get_venue(venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    if not result.venue.is_partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")

    return PublicVenueResponse(data=_to_public_venue_response(result.venue))


@venue_router.get(
    "/public/community",
    response_model=PublicVenueListResponse,
    status_code=status.HTTP_200_OK,
    summary="List community suggested venues (public)",
    description=("Return a paginated list of community suggested venues visible to the public. Contact information is excluded from all records."),
)
async def list_community_venues(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    venue_type: VenueType | None = Query(default=None),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
) -> PublicVenueListResponse:
    """Return one paginated page of community suggested venue records without contact details.

    This endpoint is public and requires no authentication.
    """
    result = await use_case.list_venues(ListVenuesInput(page=page, page_size=page_size, search=search, venue_type=venue_type, is_partner=False))
    return PublicVenueListResponse(
        data=[_to_public_venue_response(v) for v in result.venues],
        pagination=_build_pagination(result),
    )


@venue_router.get(
    "/public/community/{venue_id}",
    response_model=PublicVenueResponse,
    status_code=status.HTTP_200_OK,
    responses={**VENUE_NOT_FOUND},
    summary="Get one community suggested venue (public)",
    description=(
        "Return a single community suggested venue by UUID. Returns 404 when the venue "
        "does not exist or is a partner venue. Contact information is excluded."
    ),
)
async def get_community_venue(
    venue_id: uuid.UUID,
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
) -> PublicVenueResponse:
    """Return a single community suggested venue record without contact details.

    This endpoint is public and requires no authentication.

    # Error mapping
    - **404 Not Found** — no venue exists for the UUID, or the venue is a partner venue.
    """
    try:
        result = await use_case.get_venue(venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    if result.venue.is_partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")

    return PublicVenueResponse(data=_to_public_venue_response(result.venue))


# ─── Admin endpoints (authentication + RBAC required) ─────────────────────────


@venue_router.get(
    "",
    response_model=VenueListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN},
    summary="List venues",
    description=(
        "Return a paginated list of all venues. Supports optional text search across name and city, and filtering by venue type and partner status."
    ),
)
async def list_venues(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None, max_length=200),
    venue_type: VenueType | None = Query(default=None),
    is_partner: bool | None = Query(default=None),
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.READ)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
) -> VenueListResponse:
    """Return one paginated page of venue records.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``venues``.
    """
    result = await use_case.list_venues(
        ListVenuesInput(
            page=page,
            page_size=page_size,
            search=search,
            venue_type=venue_type,
            is_partner=is_partner,
        )
    )
    return VenueListResponse(
        data=[_to_venue_response(v) for v in result.venues],
        pagination=_build_pagination(result),
    )


@venue_router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_NOT_FOUND},
    summary="Get one venue",
    description="Return the full record for a single venue by its UUID.",
)
async def get_venue(
    venue_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.READ)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
) -> VenueResponse:
    """Return a single venue record.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``venues``.
    - **404 Not Found** — no venue exists for the supplied UUID.
    """
    try:
        result = await use_case.get_venue(venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return VenueResponse(data=_to_venue_response(result.venue), message="Venue loaded successfully.")


@venue_router.post(
    "/community",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_CONFLICT, **VALIDATION_ERROR},
    summary="Add a community venue suggestion",
    description=(
        "Add a venue suggested by the community. Contact information is optional. "
        "The venue is automatically marked as non-partner (``is_partner=false``). "
        "An optional ``image_url`` may be supplied when the venue image has already been uploaded through the feature-specific image endpoint. "
        "Amenity names are normalised to Title Case. Venue names must be unique within the same city."
    ),
    openapi_extra=COMMUNITY_VENUE_CREATE_OPENAPI_EXTRA,
)
async def create_community_venue(
    request: Request,
    body: CommunityVenueCreateRequest,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.CREATE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VenueResponse:
    """Add a community-suggested venue.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``venues``.
    - **409 Conflict** — a venue with the same name already exists in the same city.
    - **422 Unprocessable Entity** — the request body failed schema validation.
    """
    try:
        result = await use_case.create_venue(
            CreateVenueInput(
                creator_id=caller_id,
                name=body.name,
                description=body.description,
                address_line=body.address_line,
                city=body.city,
                province=body.province,
                postal_code=body.postal_code,
                region=body.region,
                country=body.country,
                capacity=body.capacity,
                venue_type=body.venue_type,
                image_url=StorageService.object_key_from_public_url(body.image_url),
                is_partner=False,
                amenities=body.amenities,
                contact_name=body.contact_name,
                contact_phone=body.contact_phone,
                contact_email=body.contact_email,
            )
        )
    except VenueAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.CREATE,
        resource_type="venues",
        resource_id=str(result.venue.id),
        status=AuditLogStatus.SUCCESS,
        new_values=serialize_venue(result.venue),
    )
    return VenueResponse(data=_to_venue_response(result.venue), message="Community venue suggestion added successfully.")


@venue_router.post(
    "/official",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_CONFLICT, **VALIDATION_ERROR},
    summary="Add an official venue",
    description=(
        "Add an officially managed venue. Contact information is required. "
        "The venue is automatically marked as a partner (``is_partner=true``). "
        "An optional ``image_url`` may be supplied when the venue image has already been uploaded through the feature-specific image endpoint. "
        "Amenity names are normalised to Title Case. Venue names must be unique within the same city."
    ),
    openapi_extra=OFFICIAL_VENUE_CREATE_OPENAPI_EXTRA,
)
async def create_official_venue(
    request: Request,
    body: OfficialVenueCreateRequest,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.CREATE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VenueResponse:
    """Add an official partner venue.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``venues``.
    - **409 Conflict** — a venue with the same name already exists in the same city.
    - **422 Unprocessable Entity** — the request body failed schema validation.
    """
    try:
        result = await use_case.create_venue(
            CreateVenueInput(
                creator_id=caller_id,
                name=body.name,
                description=body.description,
                address_line=body.address_line,
                city=body.city,
                province=body.province,
                postal_code=body.postal_code,
                region=body.region,
                country=body.country,
                capacity=body.capacity,
                venue_type=body.venue_type,
                image_url=StorageService.object_key_from_public_url(body.image_url),
                is_partner=True,
                amenities=body.amenities,
                contact_name=body.contact_name,
                contact_phone=body.contact_phone,
                contact_email=body.contact_email,
            )
        )
    except VenueAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.CREATE,
        resource_type="venues",
        resource_id=str(result.venue.id),
        status=AuditLogStatus.SUCCESS,
        new_values=serialize_venue(result.venue),
    )
    return VenueResponse(data=_to_venue_response(result.venue), message="Official venue created successfully.")


@venue_router.patch(
    "/{venue_id}",
    response_model=VenueResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_NOT_FOUND, **VENUE_CONFLICT, **VALIDATION_ERROR},
    summary="Update a venue",
    description=(
        "Update an existing venue record, including its optional image object key. All fields are replaced. Amenity names "
        "are normalised to Title Case. Name uniqueness is re-checked against the "
        "city value supplied in this request."
    ),
    openapi_extra=VENUE_UPDATE_OPENAPI_EXTRA,
)
async def update_venue(
    request: Request,
    venue_id: uuid.UUID,
    body: VenueUpdateRequest,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.UPDATE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VenueResponse:
    """Update a venue's details.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``venues``.
    - **404 Not Found** — no venue exists for the supplied UUID.
    - **409 Conflict** — the new name conflicts with an existing venue in the same city.
    - **422 Unprocessable Entity** — the path or request body is invalid.
    """
    try:
        existing = await use_case.get_venue(venue_id)
        result = await use_case.update_venue(
            UpdateVenueInput(
                venue_id=venue_id,
                name=body.name,
                description=body.description,
                address_line=body.address_line,
                city=body.city,
                province=body.province,
                postal_code=body.postal_code,
                region=body.region,
                country=body.country,
                capacity=body.capacity,
                venue_type=body.venue_type,
                image_url=StorageService.object_key_from_public_url(body.image_url),
                is_partner=body.is_partner,
                amenities=body.amenities,
                contact_name=body.contact_name,
                contact_phone=body.contact_phone,
                contact_email=body.contact_email,
            )
        )
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VenueAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.UPDATE,
        resource_type="venues",
        resource_id=str(result.venue.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_venue(existing.venue),
        new_values=serialize_venue(result.venue),
    )
    return VenueResponse(data=_to_venue_response(result.venue), message="Venue updated successfully.")


@venue_router.delete(
    "/{venue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_NOT_FOUND, **VENUE_IN_USE},
    summary="Delete a venue",
    description=("Permanently delete a venue when no event sessions reference it. This action is irreversible."),
)
async def delete_venue(
    request: Request,
    venue_id: uuid.UUID,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.DELETE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> None:
    """Delete an unused venue record.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``venues``.
    - **404 Not Found** — no venue exists for the supplied UUID.
    - **409 Conflict** — one or more event sessions still reference this venue.
    """
    try:
        existing = await use_case.get_venue(venue_id)
        await use_case.delete_venue(venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VenueInUseError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.DELETE,
        resource_type="venues",
        resource_id=str(venue_id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_venue(existing.venue),
    )


@venue_router.post(
    "/{venue_id}/image",
    response_model=VenueImageUploadResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **VENUE_NOT_FOUND,
        **VALIDATION_ERROR,
        **VENUE_IMAGE_STORAGE_UNAVAILABLE,
    },
    summary="Upload a venue image",
    description=(
        "Generate a presigned upload URL for the venue's cover image. "
        "The caller must be the venue creator. "
        "PUT the image binary directly to ``upload_url`` within the expiry window (3600 s). "
        "Allowed content types: ``image/jpeg``, ``image/png``, ``image/webp``, ``image/gif``."
    ),
    openapi_extra=VENUE_IMAGE_UPLOAD_OPENAPI_EXTRA,
)
async def upload_venue_image(
    request: Request,
    venue_id: uuid.UUID,
    body: VenueImageUploadRequest,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.UPDATE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
    storage: StorageService = Depends(get_storage_service),
) -> VenueImageUploadResponse:
    """Generate a presigned venue image upload URL and persist the resulting object key on the venue."""
    try:
        upload_url, object_key, public_url, expires_in = storage.generate_presigned_upload(
            resource_type="venue-image",
            content_type=body.content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    try:
        result = await use_case.update_venue_image(
            UpdateVenueImageInput(
                venue_id=venue_id,
                updated_by=caller_id,
                image_url=object_key,
            )
        )
    except UnauthorizedVenueOperationError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=caller_id,
        action_type=ActionType.UPDATE,
        resource_type="venues",
        resource_id=str(venue_id),
        status=AuditLogStatus.SUCCESS,
        old_values={"image_file_id": result.old_image_url},
        new_values={"image_file_id": object_key},
        additional_context={"public_url": public_url},
    )

    return VenueImageUploadResponse(
        data=_to_venue_response(result.venue),
        upload=VenueImageUploadData(
            upload_url=upload_url,
            object_key=object_key,
            public_url=public_url,
            expires_in=expires_in,
        ),
    )


def _to_rating_response(rating) -> VenueRatingRecordResponse:
    return VenueRatingRecordResponse(
        id=rating.id,
        user_id=rating.user_id,
        venue_id=rating.venue_id,
        rating=rating.rating,
        comment=rating.comment,
        created_at=rating.created_at,
        updated_at=rating.updated_at,
    )


def _build_rating_pagination(output) -> VenueRatingPaginationResponse:
    return VenueRatingPaginationResponse(
        page=output.page,
        page_size=output.page_size,
        total_count=output.total_count,
        total_pages=output.total_pages,
        has_next=output.page < output.total_pages,
        has_previous=output.page > 1 and output.total_pages > 0,
    )


@venue_router.post(
    "/{venue_id}/ratings",
    response_model=VenueRatingResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **RATING_UNAUTHORIZED,
        **VENUE_NOT_FOUND,
        **RATING_CONFLICT,
        **RATING_VALIDATION_ERROR,
    },
    summary="Submit a rating for a venue",
    description=(
        "Submit a 1–5 star rating with an optional comment for the specified venue. "
        "Each authenticated user may rate a venue only once. "
        "The venue's popularity count is incremented automatically on success."
    ),
)
async def create_venue_rating(
    request: Request,
    venue_id: uuid.UUID,
    body: VenueRatingCreateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VenueRatingResponse:
    """Submit a new venue rating for the authenticated user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **404 Not Found** — no venue exists for ``venue_id``.
    - **409 Conflict** — the user has already rated this venue.
    - **422 Unprocessable Entity** — rating value out of range or body invalid.
    """
    try:
        result = await use_case.create_rating(
            CreateVenueRatingInput(
                user_id=user_id,
                venue_id=venue_id,
                rating=body.rating,
                comment=body.comment,
            )
        )
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VenueRatingAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.CREATE,
        resource_type="venue-ratings",
        resource_id=str(result.rating.id),
        status=AuditLogStatus.SUCCESS,
        new_values=serialize_venue_rating(result.rating),
    )
    return VenueRatingResponse(data=_to_rating_response(result.rating))


@venue_router.get(
    "/{venue_id}/ratings",
    response_model=VenueRatingListResponse,
    status_code=status.HTTP_200_OK,
    responses={**VENUE_NOT_FOUND},
    summary="List all ratings for a venue",
    description="Return a paginated list of ratings for the specified venue, newest first. No authentication required.",
)
async def list_venue_ratings(
    venue_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> VenueRatingListResponse:
    """Return paginated ratings for a venue.

    # Error mapping
    - **404 Not Found** — no venue exists for ``venue_id``.
    - **422 Unprocessable Entity** — pagination query params are invalid.
    """
    try:
        result = await use_case.list_ratings(ListVenueRatingsInput(venue_id=venue_id, page=page, page_size=page_size))
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return VenueRatingListResponse(
        data=[_to_rating_response(r) for r in result.ratings],
        pagination=_build_rating_pagination(result),
    )


@venue_router.get(
    "/{venue_id}/ratings/average",
    response_model=VenueRatingAverageResponse,
    status_code=status.HTTP_200_OK,
    responses={**VENUE_NOT_FOUND},
    summary="Get the average rating for a venue",
    description=(
        "Return the mean star rating and total submission count for the specified venue. "
        "``average`` is ``null`` when the venue has not yet received any ratings. "
        "No authentication required."
    ),
)
async def get_venue_rating_average(
    venue_id: uuid.UUID,
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> VenueRatingAverageResponse:
    """Return the computed average rating for a venue.

    # Error mapping
    - **404 Not Found** — no venue exists for ``venue_id``.
    """
    try:
        result = await use_case.get_average_rating(venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return VenueRatingAverageResponse(
        data=VenueRatingAverageData(
            venue_id=result.venue_id,
            average=result.average,
            count=result.count,
        )
    )


@venue_router.get(
    "/{venue_id}/ratings/me",
    response_model=VenueRatingResponse,
    status_code=status.HTTP_200_OK,
    responses={**RATING_UNAUTHORIZED, **RATING_NOT_FOUND},
    summary="Get the authenticated user's rating for a venue",
    description="Return the rating the authenticated user has submitted for the specified venue.",
)
async def get_my_venue_rating(
    venue_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> VenueRatingResponse:
    """Return the authenticated user's own rating for a venue.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **404 Not Found** — venue not found, or the user has not rated this venue.
    """
    try:
        result = await use_case.get_my_rating(user_id, venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VenueRatingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return VenueRatingResponse(data=_to_rating_response(result.rating))


@venue_router.patch(
    "/{venue_id}/ratings/me",
    response_model=VenueRatingResponse,
    status_code=status.HTTP_200_OK,
    responses={**RATING_UNAUTHORIZED, **RATING_NOT_FOUND, **RATING_VALIDATION_ERROR},
    summary="Update the authenticated user's rating for a venue",
    description="Replace the rating value and/or comment for the authenticated user's existing venue rating.",
)
async def update_my_venue_rating(
    request: Request,
    venue_id: uuid.UUID,
    body: VenueRatingUpdateRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VenueRatingResponse:
    """Update the authenticated user's venue rating.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **404 Not Found** — venue not found, or the user has not rated this venue.
    - **422 Unprocessable Entity** — rating value out of range or body invalid.
    """
    try:
        previous = await use_case.get_my_rating(user_id, venue_id)
        result = await use_case.update_rating(
            UpdateVenueRatingInput(
                user_id=user_id,
                venue_id=venue_id,
                rating=body.rating,
                comment=body.comment,
            )
        )
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VenueRatingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.UPDATE,
        resource_type="venue-ratings",
        resource_id=str(result.rating.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_venue_rating(previous.rating),
        new_values=serialize_venue_rating(result.rating),
    )
    return VenueRatingResponse(
        data=_to_rating_response(result.rating),
        message="Rating updated successfully.",
    )


@venue_router.delete(
    "/{venue_id}/ratings/me",
    response_model=VenueRatingDeleteResponse,
    status_code=status.HTTP_200_OK,
    responses={**RATING_UNAUTHORIZED, **RATING_NOT_FOUND},
    summary="Delete the authenticated user's rating for a venue",
    description=(
        "Remove the authenticated user's rating from the specified venue. The venue's popularity count is decremented automatically on success."
    ),
)
async def delete_my_venue_rating(
    request: Request,
    venue_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
    audit_use_case: AuditLogUseCase = Depends(get_audit_log_use_case),
) -> VenueRatingDeleteResponse:
    """Remove the authenticated user's venue rating.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **404 Not Found** — venue not found, or the user has not rated this venue.
    """
    try:
        existing = await use_case.get_my_rating(user_id, venue_id)
        await use_case.delete_rating(user_id, venue_id)
    except VenueNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except VenueRatingNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    await safe_audit_log(
        audit_use_case,
        request,
        user_id=user_id,
        action_type=ActionType.DELETE,
        resource_type="venue-ratings",
        resource_id=str(existing.rating.id),
        status=AuditLogStatus.SUCCESS,
        old_values=serialize_venue_rating(existing.rating),
    )
    return VenueRatingDeleteResponse()
