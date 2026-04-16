import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.application.dto.feature_management_dto import (
    CreateFeatureInput,
    UpdateFeatureInput,
)
from app.application.use_cases.feature_usecase import FeatureManagementUseCase
from app.controller.dependencies import require_permission
from app.controller.dependencies.use_cases_depends import get_feature_management_use_case
from app.controller.docs.feature_management_docs import (
    FEATURE_CONFLICT,
    FEATURE_IN_USE,
    FEATURE_NOT_FOUND,
    FORBIDDEN,
    UNAUTHORIZED,
    VALIDATION_ERROR,
)
from app.controller.schemas.feature_management_schema import (
    FeatureCreateRequest,
    FeatureListResponse,
    FeatureRecordResponse,
    FeatureResponse,
    FeatureUpdateRequest,
)
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.role_exceptions import (
    FeatureAlreadyExistsError,
    FeatureInUseError,
    FeatureNotFoundError,
)

feature_router = APIRouter(prefix="/features", tags=["RBAC Features"])


def _to_feature_response(record) -> FeatureRecordResponse:
    return FeatureRecordResponse(
        id=record.id,
        slug=record.slug,
        name=record.name,
        description=record.description,
        is_enabled=record.is_enabled,
    )


@feature_router.get(
    "",
    response_model=FeatureListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN},
    summary="List RBAC features",
    description="Return the complete RBAC feature catalog used by the management console, including disabled feature definitions.",
)
async def list_features(
    _: uuid.UUID = Depends(require_permission("features", RoleAction.READ)),
    use_case: FeatureManagementUseCase = Depends(get_feature_management_use_case),
) -> FeatureListResponse:
    """Return the full RBAC feature catalog.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``features``.
    """
    result = await use_case.list_features()
    return FeatureListResponse(data=[_to_feature_response(feature) for feature in result.features])


@feature_router.get(
    "/{feature_id}",
    response_model=FeatureResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **FEATURE_NOT_FOUND},
    summary="Get one RBAC feature",
    description="Return a single RBAC feature definition by its UUID.",
)
async def get_feature(
    feature_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("features", RoleAction.READ)),
    use_case: FeatureManagementUseCase = Depends(get_feature_management_use_case),
) -> FeatureResponse:
    """Return one RBAC feature record.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``features``.
    - **404 Not Found** — no feature exists for the supplied UUID.
    """
    try:
        result = await use_case.get_feature(feature_id)
    except FeatureNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return FeatureResponse(data=_to_feature_response(result.feature), message="Feature loaded successfully.")


@feature_router.post(
    "",
    response_model=FeatureResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **FEATURE_CONFLICT, **VALIDATION_ERROR},
    summary="Create an RBAC feature",
    description="Create a feature definition that can later be attached to roles or targeted by user grants.",
)
async def create_feature(
    body: FeatureCreateRequest,
    _: uuid.UUID = Depends(require_permission("features", RoleAction.CREATE)),
    use_case: FeatureManagementUseCase = Depends(get_feature_management_use_case),
) -> FeatureResponse:
    """Create a new RBAC feature definition.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``features``.
    - **409 Conflict** — another feature already uses the requested slug.
    - **422 Unprocessable Entity** — the request body failed schema validation.
    """
    try:
        result = await use_case.create_feature(
            CreateFeatureInput(
                slug=body.slug,
                name=body.name,
                description=body.description,
                is_enabled=body.is_enabled,
            )
        )
    except FeatureAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return FeatureResponse(data=_to_feature_response(result.feature), message="Feature created successfully.")


@feature_router.patch(
    "/{feature_id}",
    response_model=FeatureResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **FEATURE_NOT_FOUND, **FEATURE_CONFLICT, **FEATURE_IN_USE, **VALIDATION_ERROR},
    summary="Update an RBAC feature",
    description="Update a feature definition. Slug changes are blocked while roles or user grants still depend on the feature.",
)
async def update_feature(
    feature_id: uuid.UUID,
    body: FeatureUpdateRequest,
    _: uuid.UUID = Depends(require_permission("features", RoleAction.UPDATE)),
    use_case: FeatureManagementUseCase = Depends(get_feature_management_use_case),
) -> FeatureResponse:
    """Update an RBAC feature definition safely under concurrent traffic.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``features``.
    - **404 Not Found** — no feature exists for the supplied UUID.
    - **409 Conflict** — the slug already exists or the feature slug is in active use.
    - **422 Unprocessable Entity** — the path or request body is invalid.
    """
    try:
        result = await use_case.update_feature(
            UpdateFeatureInput(
                feature_id=feature_id,
                slug=body.slug,
                name=body.name,
                description=body.description,
                is_enabled=body.is_enabled,
            )
        )
    except FeatureNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (FeatureAlreadyExistsError, FeatureInUseError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return FeatureResponse(data=_to_feature_response(result.feature), message="Feature updated successfully.")


@feature_router.delete(
    "/{feature_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**UNAUTHORIZED, **FORBIDDEN, **FEATURE_NOT_FOUND, **FEATURE_IN_USE},
    summary="Delete an RBAC feature",
    description="Delete a feature definition when no role permissions or user grants still reference it.",
)
async def delete_feature(
    feature_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("features", RoleAction.DELETE)),
    use_case: FeatureManagementUseCase = Depends(get_feature_management_use_case),
) -> None:
    """Delete an unused RBAC feature definition.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``features``.
    - **404 Not Found** — no feature exists for the supplied UUID.
    - **409 Conflict** — the feature is still referenced by roles or user grants.
    """
    try:
        await use_case.delete_feature(feature_id)
    except FeatureNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except FeatureInUseError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
