import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.user_dto import CompleteOnboardingInput
from app.application.use_cases.user_usecase import OnboardingUseCase
from app.controller.dependencies import get_current_user_id, get_onboarding_use_case
from app.controller.schemas.onboarding_schema import (
    CompleteOnboardingRequest,
    CompleteOnboardingResponse,
)
from app.controller.schemas.responses import (
    ALIAS_CONFLICT,
    EMAIL_NOT_VERIFIED,
    ONBOARDING_ALREADY_COMPLETED,
    UNAUTHORIZED,
    USER_NOT_FOUND,
    VALIDATION_ERROR,
)
from app.domain.exceptions.user_exceptions import (
    AliasAlreadyTakenError,
    EmailNotVerifiedError,
    OnboardingAlreadyCompletedError,
    UserNotFoundError,
)

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post(
    "/complete",
    response_model=CompleteOnboardingResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **USER_NOT_FOUND,
        **EMAIL_NOT_VERIFIED,
        **ONBOARDING_ALREADY_COMPLETED,
        **ALIAS_CONFLICT,
        **VALIDATION_ERROR,
    },
)
async def complete_onboarding(
    body: CompleteOnboardingRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    use_case: OnboardingUseCase = Depends(get_onboarding_use_case),
) -> CompleteOnboardingResponse:
    try:
        result = await use_case.complete_onboarding(
            CompleteOnboardingInput(
                user_id=user_id,
                alias=body.alias,
                first_name=body.first_name,
                last_name=body.last_name,
                age_group=body.age_group,
                gender=body.gender,
                education_level=body.education_level,
                occupation=body.occupation,
                bio=body.bio,
            )
        )
    except UserNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
    except EmailNotVerifiedError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(error))
    except OnboardingAlreadyCompletedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))
    except AliasAlreadyTakenError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))

    return CompleteOnboardingResponse(
        user_id=result.profile.user_id,
        alias=result.profile.alias,
        first_name=result.profile.first_name,
        last_name=result.profile.last_name,
    )
