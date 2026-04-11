import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.use_cases.venue_rating_usecase import (
    CreateVenueRatingInput,
    UpdateVenueRatingInput,
    VenueRatingUseCase,
)
from app.controller.dependencies import get_current_user_id, get_venue_rating_use_case
from app.controller.schemas.venue_rating_schema import (
    CreateVenueRatingRequest,
    CreateVenueRatingResponse,
    DeleteVenueRatingResponse,
    UpdateVenueRatingRequest,
    UpdateVenueRatingResponse,
    VenueRatingResponse,
)
from app.domain.exceptions import (
    InvalidRatingError,
    RatingAlreadyExistsError,
    VenueRatingNotFoundError,
)

router = APIRouter(prefix="/venues/{venue_id}/ratings", tags=["Venue Ratings"])


@router.post(
    "/",
    response_model=CreateVenueRatingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_venue_rating(
    venue_id: uuid.UUID,
    body: CreateVenueRatingRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> CreateVenueRatingResponse:
    try:
        result = await use_case.create(
            CreateVenueRatingInput(
                user_id=user_id,
                venue_id=venue_id,
                rating=body.rating,
            )
        )

        if result.rating.venue_id != venue_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found for this venue")

        return CreateVenueRatingResponse(
            rating_id=result.rating.id,
            rating=result.rating.rating,
        )
    except RatingAlreadyExistsError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except InvalidRatingError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))


@router.get("/{rating_id}", response_model=VenueRatingResponse)
async def get_venue_rating(
    venue_id: uuid.UUID,
    rating_id: uuid.UUID,
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> VenueRatingResponse:
    try:
        result = await use_case.get_by_id(rating_id)

        if result.rating.venue_id != venue_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found for this venue")

        return VenueRatingResponse(
            id=result.rating.id,
            user_id=result.rating.user_id,
            venue_id=result.rating.venue_id,
            rating=result.rating.rating,
            created_at=result.rating.created_at,
        )
    except VenueRatingNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


@router.get("/")
async def get_venue_ratings(
    venue_id: uuid.UUID,
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> list[VenueRatingResponse]:
    ratings = await use_case.get_by_venue(venue_id)

    if ratings.rating.venue_id != venue_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found for this venue")

    return [
        VenueRatingResponse(
            id=r.id,
            user_id=r.user_id,
            venue_id=r.venue_id,
            rating=r.rating,
            created_at=r.created_at,
        )
        for r in ratings
    ]


@router.put("/{rating_id}", response_model=UpdateVenueRatingResponse)
async def update_venue_rating(
    venue_id: uuid.UUID,
    rating_id: uuid.UUID,
    body: UpdateVenueRatingRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> UpdateVenueRatingResponse:
    try:
        result = await use_case.update(
            UpdateVenueRatingInput(
                rating_id=rating_id,
                user_id=user_id,
                rating=body.rating,
            )
        )

        if result.rating.venue_id != venue_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found for this venue")

        return UpdateVenueRatingResponse(
            rating_id=result.rating.id,
            rating=result.rating.rating,
        )
    except VenueRatingNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except InvalidRatingError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))


@router.delete("/{rating_id}", response_model=DeleteVenueRatingResponse)
async def delete_venue_rating(
    venue_id: uuid.UUID,
    rating_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: VenueRatingUseCase = Depends(get_venue_rating_use_case),
) -> DeleteVenueRatingResponse:
    try:
        existing = await use_case.get_by_id(rating_id)
        if existing.rating.venue_id != venue_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found for this venue")

        await use_case.delete(rating_id, user_id)
        return DeleteVenueRatingResponse(rating_id=rating_id)
    except VenueRatingNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
