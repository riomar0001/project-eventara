"""Admin-side venue management API routes.

Exposes CRUD endpoints for the venue catalog. All routes require an
authenticated caller with the appropriate RBAC permission on the ``venues``
feature:

  - ``read``   — GET endpoints (list, detail)
  - ``create`` — POST endpoint
  - ``update`` — PATCH endpoint
  - ``delete`` — DELETE endpoint

Error mapping summary:
  - 401  missing, expired, or invalid Bearer token
  - 403  RBAC denial
  - 404  venue not found
  - 409  name conflict within the same city, or venue still referenced by events
  - 422  request body failed schema validation
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.application.dto.venue_dto import CreateVenueInput, ListVenuesInput, UpdateVenueInput
from app.application.use_cases.audit_log_usecase import CreateAuditLogUseCase
from app.application.use_cases.venue_usecase import VenueManagementUseCase
from app.controller.api.audit_helpers import safe_audit_log, serialize_venue
from app.controller.dependencies import get_create_audit_log_use_case, require_permission
from app.controller.dependencies.use_cases_depends import get_venue_management_use_case
from app.controller.docs.venue_management_docs import (
    FORBIDDEN,
    UNAUTHORIZED,
    VALIDATION_ERROR,
    VENUE_CONFLICT,
    VENUE_IN_USE,
    VENUE_NOT_FOUND,
)
from app.controller.schemas.venue_management_schema import (
    VenueCreateRequest,
    VenueListResponse,
    VenuePaginationResponse,
    VenueRecordResponse,
    VenueResponse,
    VenueUpdateRequest,
)
from app.domain.entities.authorization_entities import RoleAction
from app.domain.entities.venue_entities import VenueType
from app.domain.exceptions.venue_exceptions import (
    VenueAlreadyExistsError,
    VenueInUseError,
    VenueNotFoundError,
)
from app.domain.entities.audit_log import ActionType, AuditLogStatus

venue_router = APIRouter(prefix="/venues", tags=["Venues"])


def _to_venue_response(venue) -> VenueRecordResponse:
    return VenueRecordResponse(
        id=venue.id,
        creator_id=venue.creator_id,
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


@venue_router.get(
    "",
    response_model=VenueListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN},
    summary="List venues",
    description=(
        "Return a paginated list of all venues. Supports optional text search "
        "across name and city, and filtering by venue type and partner status."
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
        pagination=VenuePaginationResponse(
            page=result.page,
            page_size=result.page_size,
            total_count=result.total_count,
            total_pages=result.total_pages,
            has_next=result.page < result.total_pages,
            has_previous=result.page > 1 and result.total_pages > 0,
        ),
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
    "",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_CONFLICT, **VALIDATION_ERROR},
    summary="Create a venue",
    description=(
        "Create a new venue record. Amenity names are automatically normalised to "
        "Title Case before storage (e.g. ``air conditioning`` → ``Air Conditioning``). "
        "Venue names must be unique within the same city."
    ),
)
async def create_venue(
    request: Request,
    body: VenueCreateRequest,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.CREATE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: CreateAuditLogUseCase = Depends(get_create_audit_log_use_case),
) -> VenueResponse:
    """Create a new venue.

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
                is_partner=body.is_partner,
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
    return VenueResponse(data=_to_venue_response(result.venue), message="Venue created successfully.")


@venue_router.patch(
    "/{venue_id}",
    response_model=VenueResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **VENUE_NOT_FOUND, **VENUE_CONFLICT, **VALIDATION_ERROR},
    summary="Update a venue",
    description=(
        "Update an existing venue record. All fields are replaced. Amenity names "
        "are normalised to Title Case. Name uniqueness is re-checked against the "
        "city value supplied in this request."
    ),
)
async def update_venue(
    request: Request,
    venue_id: uuid.UUID,
    body: VenueUpdateRequest,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.UPDATE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: CreateAuditLogUseCase = Depends(get_create_audit_log_use_case),
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
    description=(
        "Permanently delete a venue when no event sessions reference it. "
        "This action is irreversible."
    ),
)
async def delete_venue(
    request: Request,
    venue_id: uuid.UUID,
    caller_id: uuid.UUID = Depends(require_permission("venues", RoleAction.DELETE)),
    use_case: VenueManagementUseCase = Depends(get_venue_management_use_case),
    audit_use_case: CreateAuditLogUseCase = Depends(get_create_audit_log_use_case),
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
