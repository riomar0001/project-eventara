import uuid
from fastapi import APIRouter, Depends, status, HTTPException

from app.controller.dependencies import get_venue_use_case, get_current_user_id
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
from app.domain.entities.venue_entities import VenueType
from app.domain.exceptions import VenueNotFoundError

router = APIRouter(prefix="/venues", tags=["Venues"])


@router.post(
    "/",
    response_model=CreateVenueResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_venue(
    body: CreateVenueRequest,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    creator_id: uuid.UUID = Depends(get_current_user_id),
) -> CreateVenueResponse:
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


@router.post("/{venue_id}", response_model=UpdateVenueResponse)
async def update_venue(
    venue_id: uuid.UUID,
    body: UpdateVenueRequest,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    creator_id: uuid.UUID = Depends(get_current_user_id),
) -> UpdateVenueResponse:
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

@router.delete("/{venue_id}", response_model=DeleteVenueResponse)
async def delete_venue(
    venue_id: uuid.UUID,
    use_case: VenueUseCase = Depends(get_venue_use_case),
    creator_id: uuid.UUID = Depends(get_current_user_id),
) -> DeleteVenueResponse:
    try:
        result = await use_case.delete(venue_id, creator_id)
        return DeleteVenueResponse(venue_id=result.venue.id)
    except VenueNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    


@router.get("/{venue_id}", response_model=VenueResponse)
async def get_venue(
    venue_id: uuid.UUID,
    use_case: VenueUseCase = Depends(get_venue_use_case),
) -> VenueResponse:
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


@router.get("/creator/{creator_id}")
async def get_user_venues(
    creator_id: uuid.UUID,
    use_case: VenueUseCase = Depends(get_venue_use_case),
) -> list[VenueResponse]:
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