import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dto.role_dto import (
    AssignRoleInput,
    CreateGrantsInput,
    UpdateAssignmentInput,
)
from app.application.use_cases.role_usecase import UserRoleUseCase
from app.controller.dependencies import get_role_use_case, require_permission
from app.controller.docs.role_docs import (
    ASSIGN_ROLE_VALIDATION_ERROR,
    ASSIGNMENT_NOT_FOUND,
    CREATE_GRANTS_VALIDATION_ERROR,
    DUPLICATE_GRANT,
    FEATURE_NOT_FOUND,
    FORBIDDEN,
    GRANT_NOT_FOUND,
    ROLE_ALREADY_ASSIGNED,
    ROLE_NOT_FOUND,
    UNAUTHORIZED,
    USER_NOT_FOUND,
)
from app.controller.schemas.role_schema import (
    AssignRoleRequest,
    CreateGrantsRequest,
    CreateGrantsResponse,
    UpdateAssignmentRequest,
    UserGrantListResponse,
    UserGrantResponse,
    UserRoleAssignmentResponse,
    UserRoleListResponse,
)
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.role_exceptions import (
    DuplicateUserGrantError,
    FeatureNotFoundError,
    RoleAlreadyAssignedError,
    RoleAssignmentNotFoundError,
    RoleNotFoundError,
    UserGrantNotFoundError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError

role_router = APIRouter(prefix="/user-roles", tags=["User Role Management"])
grant_router = APIRouter(prefix="/user-grants", tags=["User Grant Management"])


@role_router.post(
    "",
    response_model=UserRoleAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **USER_NOT_FOUND,
        **ROLE_NOT_FOUND,
        **ROLE_ALREADY_ASSIGNED,
        **ASSIGN_ROLE_VALIDATION_ERROR,
    },
    summary="Assign a role to a user",
    description=(
        "Assign an existing system role to a user account. "
        "The caller must hold a role with ``create`` permission on the ``user-roles`` feature. "
        "A role can only be assigned once per user — attempting a duplicate assignment returns **409**. "
        "An optional ``expires_at`` date can be provided to grant time-limited access; "
        "omit it (or pass ``null``) for a permanent assignment."
    ),
)
async def assign_role(
    body: AssignRoleRequest,
    caller_id: uuid.UUID = Depends(require_permission("user-roles", RoleAction.CREATE)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> UserRoleAssignmentResponse:
    """Assign a role to a user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``user-roles``.
    - **404 Not Found** — target user or role does not exist.
    - **409 Conflict** — the role is already assigned to the user.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.assign_role(
            AssignRoleInput(
                user_id=body.user_id,
                role_id=body.role_id,
                expires_at=body.expires_at,
                assigned_by=caller_id,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RoleAlreadyAssignedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    a = result.assignment
    return UserRoleAssignmentResponse(
        id=a.id,
        user_id=a.user_id,
        role_id=a.role_id,
        expires_at=a.expires_at,
        assigned_by=a.assigned_by,
        assigned_at=a.assigned_at,
    )


@role_router.get(
    "",
    response_model=UserRoleListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **USER_NOT_FOUND,
    },
    summary="List role assignments for a user",
    description=(
        "Retrieve all role assignments for the specified user. "
        "The caller must hold a role with ``read`` permission on the ``user-roles`` feature."
    ),
)
async def list_user_roles(
    user_id: uuid.UUID = Query(..., description="UUID of the user whose roles to retrieve"),
    _: uuid.UUID = Depends(require_permission("user-roles", RoleAction.READ)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> UserRoleListResponse:
    """List all role assignments for a user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-roles``.
    - **404 Not Found** — the specified user does not exist.
    """
    try:
        result = await use_case.get_user_roles(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    data = [
        UserRoleAssignmentResponse(
            id=a.id,
            user_id=a.user_id,
            role_id=a.role_id,
            expires_at=a.expires_at,
            assigned_by=a.assigned_by,
            assigned_at=a.assigned_at,
        )
        for a in result.assignments
    ]
    return UserRoleListResponse(data=data, total=len(data))


@role_router.get(
    "/{assignment_id}",
    response_model=UserRoleAssignmentResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **ASSIGNMENT_NOT_FOUND,
    },
    summary="Get a specific role assignment",
    description=(
        "Retrieve a single role assignment by its UUID. "
        "The caller must hold a role with ``read`` permission on the ``user-roles`` feature."
    ),
)
async def get_assignment(
    assignment_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("user-roles", RoleAction.READ)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> UserRoleAssignmentResponse:
    """Retrieve a single role assignment.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-roles``.
    - **404 Not Found** — no assignment found for the given ID.
    """
    try:
        assignment = await use_case.get_assignment(assignment_id)
    except RoleAssignmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return UserRoleAssignmentResponse(
        id=assignment.id,
        user_id=assignment.user_id,
        role_id=assignment.role_id,
        expires_at=assignment.expires_at,
        assigned_by=assignment.assigned_by,
        assigned_at=assignment.assigned_at,
    )


@role_router.patch(
    "/{assignment_id}",
    response_model=UserRoleAssignmentResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **ASSIGNMENT_NOT_FOUND,
        **ASSIGN_ROLE_VALIDATION_ERROR,
    },
    summary="Update a role assignment's expiry",
    description=(
        "Update the ``expires_at`` field of an existing role assignment. "
        "Pass ``null`` to make the assignment permanent. "
        "The caller must hold a role with ``update`` permission on the ``user-roles`` feature."
    ),
)
async def update_assignment(
    assignment_id: uuid.UUID,
    body: UpdateAssignmentRequest,
    _: uuid.UUID = Depends(require_permission("user-roles", RoleAction.UPDATE)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> UserRoleAssignmentResponse:
    """Update the expiry date of a role assignment.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``user-roles``.
    - **404 Not Found** — no assignment found for the given ID.
    - **422 Unprocessable Entity** — request body failed schema validation.
    """
    try:
        result = await use_case.update_assignment(
            UpdateAssignmentInput(
                assignment_id=assignment_id,
                expires_at=body.expires_at,
            )
        )
    except RoleAssignmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    a = result.assignment
    return UserRoleAssignmentResponse(
        id=a.id,
        user_id=a.user_id,
        role_id=a.role_id,
        expires_at=a.expires_at,
        assigned_by=a.assigned_by,
        assigned_at=a.assigned_at,
    )


@role_router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **ASSIGNMENT_NOT_FOUND,
    },
    summary="Revoke a role assignment",
    description=(
        "Permanently remove a role assignment from a user. "
        "This action is irreversible — to re-grant the role, a new assignment must be created. "
        "The caller must hold a role with ``delete`` permission on the ``user-roles`` feature."
    ),
)
async def revoke_assignment(
    assignment_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("user-roles", RoleAction.DELETE)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> None:
    """Revoke a role assignment permanently.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``user-roles``.
    - **404 Not Found** — no assignment found for the given ID.
    """
    try:
        await use_case.revoke_assignment(assignment_id)
    except RoleAssignmentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@grant_router.post(
    "",
    response_model=CreateGrantsResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **USER_NOT_FOUND,
        **ROLE_NOT_FOUND,
        **FEATURE_NOT_FOUND,
        **DUPLICATE_GRANT,
        **CREATE_GRANTS_VALIDATION_ERROR,
    },
    summary="Create per-user action grants",
    description=(
        "Grant one or more role actions on a specific feature to a user, bypassing or "
        "supplementing their role-level permissions. "
        "The ``actions`` field accepts an array — e.g. ``[\"read\", \"create\"]`` — and "
        "one ``user_grants`` row is created per action in a single atomic transaction. "
        "If any action in the array already has an active grant for the same user and feature, "
        "the entire request is rejected with **409** to prevent partial state. "
        "The caller must hold a role with ``create`` permission on the ``user-grants`` feature."
    ),
)
async def create_grants(
    body: CreateGrantsRequest,
    caller_id: uuid.UUID = Depends(require_permission("user-grants", RoleAction.CREATE)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> CreateGrantsResponse:
    """Create per-user action grants for a feature.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``user-grants``.
    - **404 Not Found** — target user, role, or feature does not exist.
    - **409 Conflict** — one or more actions already have an active grant for
      the same user and feature.
    - **422 Unprocessable Entity** — request body failed schema validation or
      ``actions`` array is empty.
    """
    try:
        result = await use_case.create_grants(
            CreateGrantsInput(
                user_id=body.user_id,
                role_id=body.role_id,
                feature_id=body.feature_id,
                actions=list(set(body.actions)),
                effect=body.effect,
                expires_at=body.expires_at,
                reason=body.reason,
                granted_by=caller_id,
            )
        )
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except FeatureNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DuplicateUserGrantError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    return CreateGrantsResponse(
        data=[
            UserGrantResponse(
                id=g.id,
                user_id=g.user_id,
                feature_id=g.feature_id,
                role_id=g.role_id,
                action=g.action,
                effect=g.effect,
                reason=g.reason,
                expires_at=g.expires_at,
                granted_by=g.granted_by,
            )
            for g in result.grants
        ]
    )


@grant_router.get(
    "",
    response_model=UserGrantListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **USER_NOT_FOUND,
    },
    summary="List grants for a user",
    description=(
        "Retrieve all active per-user action grants for the specified user. "
        "The caller must hold a role with ``read`` permission on the ``user-grants`` feature."
    ),
)
async def list_user_grants(
    user_id: uuid.UUID = Query(..., description="UUID of the user whose grants to retrieve"),
    _: uuid.UUID = Depends(require_permission("user-grants", RoleAction.READ)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> UserGrantListResponse:
    """List all grants for a user.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-grants``.
    - **404 Not Found** — the specified user does not exist.
    """
    try:
        result = await use_case.get_user_grants(user_id)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    data = [
        UserGrantResponse(
            id=g.id,
            user_id=g.user_id,
            feature_id=g.feature_id,
            role_id=g.role_id,
            action=g.action,
            effect=g.effect,
            reason=g.reason,
            expires_at=g.expires_at,
            granted_by=g.granted_by,
        )
        for g in result.grants
    ]
    return UserGrantListResponse(data=data, total=len(data))


@grant_router.delete(
    "/{grant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
        **GRANT_NOT_FOUND,
    },
    summary="Revoke a user grant",
    description=(
        "Permanently remove a per-user action grant. "
        "After revocation the user falls back to their role-level permissions for the affected feature. "
        "The caller must hold a role with ``delete`` permission on the ``user-grants`` feature."
    ),
)
async def revoke_grant(
    grant_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("user-grants", RoleAction.DELETE)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> None:
    """Revoke a user grant permanently.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``user-grants``.
    - **404 Not Found** — no grant found for the given ID.
    """
    try:
        await use_case.revoke_grant(grant_id)
    except UserGrantNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
