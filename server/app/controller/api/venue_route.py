import uuid
from fastapi import APIRouter, Depends, status, HTTPException

from app.controller.dependencies import get_venue_use_case, get_current_user_id, require_permission
from app.controller.docs.venue_docs import (
    CREATE_VENUE_VALIDATION_ERROR,
    UNAUTHORIZED,
    FORBIDDEN,
    VENUE_ALREADY_EXISTS,
    VENUE_VALIDATION_ERROR,
    INVALID_VENUE_TYPE,
    VENUE_NOT_FOUND,
    UNAUTHORIZED_VENUE_OPERATION,
    UPDATE_VENUE_VALIDATION_ERROR,
)
from app.controller.schemas.venue_schema import (
    CreateVenueRequest,
    CreateVenueResponse,
    DeleteVenueResponse,
    DeleteVenueResponse,
    UpdateVenueRequest,
    UpdateVenueResponse,
    VenueResponse,
)
from app.application.use_cases.venue_usecase import UpdateVenueInput, VenueUseCase, CreateVenueInput
from app.domain.entities.authorization_entities import RoleAction
from app.domain.entities.venue_entities import VenueType
from app.domain.exceptions import (
    VenueNotFoundError,
    UnauthorizedVenueOperationError,
    VenueValidationError,
    VenueAlreadyExistsError,
    VenueInvalidTypeError,
)

router = APIRouter(prefix="/venues", tags=["Venues"])


@router.post(
    "/",
    response_model=CreateVenueResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **VENUE_ALREADY_EXISTS,
        **VENUE_VALIDATION_ERROR,
        **INVALID_VENUE_TYPE,
        **CREATE_VENUE_VALIDATION_ERROR,
    },
    summary="Create a new venue",
    description=(
        "Create a new event venue with location details, contact information, and capacity. "
        "The authenticated user becomes the creator and owner of the venue. "
        "Requires ``create`` permission on the ``venues`` feature."
    ),
)
async def create_venue(
    body: CreateVenueRequest,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    creator_id: uuid.UUID = Depends(get_current_user_id),
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.CREATE)),
) -> CreateVenueResponse:
    """Create a new event venue.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``venues``.
    - **400 Bad Request** — venue validation failed or invalid venue type.
    - **409 Conflict** — a venue with this name already exists.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.create(
            CreateVenueInput(
                creator_id=creator_id,
                name=body.name,
                description=body.description,
                address_line=body.address_line,
                city=body.city,
                province=body.province,
                postal_code=body.postal_code,
                country=body.country,
                capacity=body.capacity,
                venue_type=VenueType(body.venue_type),
                contact_name=body.contact_name,
                contact_phone=body.contact_phone,
                contact_email=body.contact_email,
            )
        )
        return CreateVenueResponse(venue_id=result.venue.id, name=result.venue.name)
    except VenueInvalidTypeError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except VenueValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except VenueAlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create venue")


@router.patch(
    "/{venue_id}",
    response_model=UpdateVenueResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **VENUE_NOT_FOUND,
        **UNAUTHORIZED_VENUE_OPERATION,
        **VENUE_ALREADY_EXISTS,
        **VENUE_VALIDATION_ERROR,
        **INVALID_VENUE_TYPE,
        **UPDATE_VENUE_VALIDATION_ERROR,
    },
    summary="Update an existing venue",
    description=(
        "Update one or more fields of an existing venue. "
        "Only the venue creator can update venue details. "
        "All fields are optional — only provide fields you wish to change. "
        "Requires ``update`` permission on the ``venues`` feature."
    ),
)
async def update_venue(
    venue_id: uuid.UUID,
    body: UpdateVenueRequest,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    creator_id: uuid.UUID = Depends(get_current_user_id),    
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.UPDATE)),
) -> UpdateVenueResponse:
    """Update an existing event venue.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``venues``, or is not the venue creator.
    - **400 Bad Request** — venue validation failed or invalid venue type.
    - **404 Not Found** — venue does not exist.
    - **409 Conflict** — the updated name already exists for another venue.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.update(
            UpdateVenueInput(
                id=venue_id,
                creator_id=creator_id,
                name=body.name,
                description=body.description,
                address_line=body.address_line,
                city=body.city,
                province=body.province,
                postal_code=body.postal_code,
                country=body.country,
                capacity=body.capacity,
                venue_type=VenueType(body.venue_type) if body.venue_type else None,
                contact_name=body.contact_name,
                contact_phone=body.contact_phone,
                contact_email=body.contact_email,
            )
        )
        return UpdateVenueResponse(venue_id=result.venue.id, name=result.venue.name)
    except VenueNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except UnauthorizedVenueOperationError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except VenueInvalidTypeError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except VenueValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except VenueAlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update venue")

@router.delete(
    "/{venue_id}",
    response_model=DeleteVenueResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **VENUE_NOT_FOUND,
        **UNAUTHORIZED_VENUE_OPERATION,
        **VENUE_VALIDATION_ERROR,
    },
    summary="Delete a venue",
    description=(
        "Permanently delete a venue and all associated event data. "
        "This action is irreversible. "
        "Only the venue creator can delete the venue. "
        "Requires ``delete`` permission on the ``venues`` feature."
    ),
)
async def delete_venue(
    venue_id: uuid.UUID,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    creator_id: uuid.UUID = Depends(get_current_user_id),
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.DELETE)),
) -> DeleteVenueResponse:
    """Delete a venue permanently.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``venues``, or is not the venue creator.
    - **400 Bad Request** — venue validation failed.
    - **404 Not Found** — venue does not exist.
    """
    try:
        result = await use_case.delete(venue_id, creator_id)
        return DeleteVenueResponse(venue_id=result.venue.id)
    except VenueNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except UnauthorizedVenueOperationError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except VenueValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete venue")
    


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **VENUE_NOT_FOUND,
    },
    summary="Get venue details",
    description=(
        "Retrieve detailed information about a specific venue including location, "
        "contact details, capacity, and type. "
        "Requires ``read`` permission on the ``venues`` feature."
    ),
)
async def get_venue(
    venue_id: uuid.UUID,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.READ)),
) -> VenueResponse:
    """Retrieve a single venue by ID.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``venues``.
    - **404 Not Found** — venue does not exist.
    """
    try:
        result = await use_case.get_by_id(venue_id)
        return VenueResponse(
            id=result.venue.id,
            name=result.venue.name,
            description=result.venue.description,
            address_line=result.venue.address_line,
            city=result.venue.city,
            province=result.venue.province,
            postal_code=result.venue.postal_code,
            country=result.venue.country,
            capacity=result.venue.capacity,
            venue_type=result.venue.venue_type,
            contact_name=result.venue.contact_name,
            contact_phone=result.venue.contact_phone,
            contact_email=result.venue.contact_email,
            created_at=result.venue.created_at,
        )
    except VenueNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve venue")


@router.get(
    "/creator/{creator_id}",
    response_model=list[VenueResponse],
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **VENUE_VALIDATION_ERROR,
    },
    summary="List venues by creator",
    description=(
        "Retrieve all venues created by a specific user. "
        "Returns an empty list if the user has no venues. "
        "Requires ``read`` permission on the ``venues`` feature."
    ),
)
async def get_user_venues(
    creator_id: uuid.UUID,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    _: uuid.UUID = Depends(require_permission("venues", RoleAction.READ)),
) -> list[VenueResponse]:
    """List all venues created by a user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``venues``.
    - **400 Bad Request** — venue validation failed.
    """
    try:
        venues = await use_case.get_by_creator(creator_id)
        return [
            VenueResponse(
                id=v.id,
                name=v.name,
                description=v.description,
                address_line=v.address_line,
                city=v.city,
                province=v.province,
                postal_code=v.postal_code,
                country=v.country,
                capacity=v.capacity,
                venue_type=v.venue_type,
                contact_name=v.contact_name,
                contact_phone=v.contact_phone,
                contact_email=v.contact_email,
                created_at=v.created_at,
            )
            for v in venues
        ]
    except UnauthorizedVenueOperationError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except VenueValidationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve user venues")