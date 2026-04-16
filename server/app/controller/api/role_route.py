import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.application.dto.role_dto import (
    AssignRoleInput,
    CreateGrantsInput,
    UpdateAssignmentInput,
)
from app.application.dto.role_management_dto import (
    CreateRoleInput,
    RolePermissionInput,
    UpdateRoleInput,
)
from app.application.use_cases.role_usecase import RoleManagementUseCase, UserRoleUseCase
from app.controller.dependencies import get_role_use_case, require_permission
from app.controller.dependencies.use_cases_depends import get_role_management_use_case
from app.controller.docs.role_management_docs import (
    FEATURE_NOT_FOUND,
    ROLE_CONFLICT,
    ROLE_IN_USE,
    ROLE_PROTECTED,
    VALIDATION_ERROR,
)
from app.controller.docs.role_docs import (
    ASSIGN_ROLE_VALIDATION_ERROR,
    ASSIGNMENT_NOT_FOUND,
    CREATE_GRANTS_VALIDATION_ERROR,
    DUPLICATE_GRANT,
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
    GrantFeatureListResponse,
    GrantFeatureResponse,
    UpdateAssignmentRequest,
    UserGrantListResponse,
    UserGrantResponse,
    UserRoleAssignmentResponse,
    UserRoleListResponse,
)
from app.controller.schemas.role_management_schema import (
    RoleCreateRequest,
    RoleListResponse,
    RolePermissionRecordResponse,
    RoleRecordResponse,
    RoleResponse,
    RoleUpdateRequest,
)
from app.domain.entities.authorization_entities import RoleAction
from app.domain.exceptions.role_exceptions import (
    DuplicateUserGrantError,
    FeatureNotFoundError,
    ProtectedRoleDeletionError,
    RoleAlreadyExistsError,
    RoleAlreadyAssignedError,
    RoleAssignmentNotFoundError,
    RoleInUseError,
    RoleNotFoundError,
    UserGrantNotFoundError,
)
from app.domain.exceptions.user_exceptions import UserNotFoundError

role_management_router = APIRouter(prefix="/roles", tags=["RBAC Roles"])
role_router = APIRouter(prefix="/user-roles", tags=["User Role Management"])
grant_router = APIRouter(prefix="/user-grants", tags=["User Grant Management"])


def _as_aware_utc(value: datetime) -> datetime:
    """Normalize naive datetimes from the persistence layer into UTC-aware values."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _as_optional_aware_utc(value: datetime | None) -> datetime | None:
    """Normalize nullable datetimes from the persistence layer into UTC-aware values."""
    if value is None:
        return None
    return _as_aware_utc(value)


def _to_role_response(record) -> RoleRecordResponse:
    return RoleRecordResponse(
        id=record.id,
        name=record.name,
        description=record.description,
        is_default=record.is_default,
        is_system=record.is_system,
        permissions=[
            RolePermissionRecordResponse(
                feature_id=permission.feature_id,
                feature_slug=permission.feature_slug,
                feature_name=permission.feature_name,
                action=permission.action,
                effect=permission.effect,
            )
            for permission in record.permissions
        ],
    )


@role_management_router.get(
    "",
    response_model=RoleListResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN},
    summary="List RBAC roles",
    description="Return every role definition together with its attached feature permissions.",
)
async def list_roles(
    _: uuid.UUID = Depends(require_permission("roles", RoleAction.READ)),
    use_case: RoleManagementUseCase = Depends(get_role_management_use_case),
) -> RoleListResponse:
    """Return all RBAC role definitions and their resolved permissions.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``roles``.
    """
    result = await use_case.list_roles()
    return RoleListResponse(data=[_to_role_response(role) for role in result.roles])


@role_management_router.get(
    "/{role_id}",
    response_model=RoleResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **ROLE_NOT_FOUND},
    summary="Get one RBAC role",
    description="Return a single role definition together with its feature permissions.",
)
async def get_role(
    role_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("roles", RoleAction.READ)),
    use_case: RoleManagementUseCase = Depends(get_role_management_use_case),
) -> RoleResponse:
    """Return one RBAC role definition.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``roles``.
    - **404 Not Found** — no role exists for the supplied UUID.
    """
    try:
        result = await use_case.get_role(role_id)
    except RoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return RoleResponse(data=_to_role_response(result.role), message="Role loaded successfully.")


@role_management_router.post(
    "",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    responses={**UNAUTHORIZED, **FORBIDDEN, **ROLE_CONFLICT, **FEATURE_NOT_FOUND, **VALIDATION_ERROR},
    summary="Create an RBAC role",
    description="Create a role definition and atomically attach one or more feature permission sets to it.",
)
async def create_role(
    body: RoleCreateRequest,
    _: uuid.UUID = Depends(require_permission("roles", RoleAction.CREATE)),
    use_case: RoleManagementUseCase = Depends(get_role_management_use_case),
) -> RoleResponse:
    """Create a new RBAC role definition.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``create`` permission on ``roles``.
    - **404 Not Found** — one or more referenced features do not exist.
    - **409 Conflict** — another role already uses the requested name.
    - **422 Unprocessable Entity** — the request body failed schema validation.
    """
    try:
        result = await use_case.create_role(
            CreateRoleInput(
                name=body.name,
                description=body.description,
                is_default=body.is_default,
                is_system=body.is_system,
                permissions=[
                    RolePermissionInput(
                        feature_id=permission.feature_id,
                        actions=permission.actions,
                        effect=permission.effect,
                    )
                    for permission in body.permissions
                ],
            )
        )
    except FeatureNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except RoleAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return RoleResponse(data=_to_role_response(result.role), message="Role created successfully.")


@role_management_router.patch(
    "/{role_id}",
    response_model=RoleResponse,
    status_code=status.HTTP_200_OK,
    responses={**UNAUTHORIZED, **FORBIDDEN, **ROLE_NOT_FOUND, **ROLE_CONFLICT, **ROLE_IN_USE, **FEATURE_NOT_FOUND, **VALIDATION_ERROR},
    summary="Update an RBAC role",
    description="Update a role definition and replace its feature permission matrix in one serialized transaction.",
)
async def update_role(
    role_id: uuid.UUID,
    body: RoleUpdateRequest,
    _: uuid.UUID = Depends(require_permission("roles", RoleAction.UPDATE)),
    use_case: RoleManagementUseCase = Depends(get_role_management_use_case),
) -> RoleResponse:
    """Update a role definition and permission matrix safely.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``update`` permission on ``roles``.
    - **404 Not Found** — the role or one of its referenced features does not exist.
    - **409 Conflict** — the requested name already exists or the rename would invalidate active dependencies.
    - **422 Unprocessable Entity** — the path or request body is invalid.
    """
    try:
        result = await use_case.update_role(
            UpdateRoleInput(
                role_id=role_id,
                name=body.name,
                description=body.description,
                is_default=body.is_default,
                is_system=body.is_system,
                permissions=[
                    RolePermissionInput(
                        feature_id=permission.feature_id,
                        actions=permission.actions,
                        effect=permission.effect,
                    )
                    for permission in body.permissions
                ],
            )
        )
    except (FeatureNotFoundError, RoleNotFoundError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (RoleAlreadyExistsError, RoleInUseError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    return RoleResponse(data=_to_role_response(result.role), message="Role updated successfully.")


@role_management_router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={**UNAUTHORIZED, **FORBIDDEN, **ROLE_NOT_FOUND, **ROLE_IN_USE, **ROLE_PROTECTED},
    summary="Delete an RBAC role",
    description="Delete a role definition when no user assignments or user grants still reference it.",
)
async def delete_role(
    role_id: uuid.UUID,
    _: uuid.UUID = Depends(require_permission("roles", RoleAction.DELETE)),
    use_case: RoleManagementUseCase = Depends(get_role_management_use_case),
) -> None:
    """Delete an unused RBAC role definition.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``delete`` permission on ``roles``.
    - **404 Not Found** — no role exists for the supplied UUID.
    - **409 Conflict** — the role is protected or is still referenced by user assignments or grants.
    """
    try:
        await use_case.delete_role(role_id)
    except RoleNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except (ProtectedRoleDeletionError, RoleInUseError) as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


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
        expires_at=_as_optional_aware_utc(a.expires_at),
        assigned_by=a.assigned_by,
        assigned_at=_as_aware_utc(a.assigned_at),
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
        "Retrieve all role assignments for the specified user. The caller must hold a role with ``read`` permission on the ``user-roles`` feature."
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
            expires_at=_as_optional_aware_utc(a.expires_at),
            assigned_by=a.assigned_by,
            assigned_at=_as_aware_utc(a.assigned_at),
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
        "Retrieve a single role assignment by its UUID. The caller must hold a role with ``read`` permission on the ``user-roles`` feature."
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
        expires_at=_as_optional_aware_utc(assignment.expires_at),
        assigned_by=assignment.assigned_by,
        assigned_at=_as_aware_utc(assignment.assigned_at),
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
        expires_at=_as_optional_aware_utc(a.expires_at),
        assigned_by=a.assigned_by,
        assigned_at=_as_aware_utc(a.assigned_at),
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
        'The ``actions`` field accepts an array — e.g. ``["read", "create"]`` — and '
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
                starts_at=body.starts_at,
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
                starts_at=_as_optional_aware_utc(g.starts_at),
                expires_at=_as_optional_aware_utc(g.expires_at),
                granted_by=g.granted_by,
            )
            for g in result.grants
        ]
    )


@grant_router.get(
    "/features",
    response_model=GrantFeatureListResponse,
    status_code=status.HTTP_200_OK,
    responses={
        **UNAUTHORIZED,
        **FORBIDDEN,
    },
    summary="List grantable features",
    description=("Return the enabled feature catalog that administrators can target when creating special per-user permission grants."),
)
async def list_grant_features(
    _: uuid.UUID = Depends(require_permission("user-grants", RoleAction.READ)),
    use_case: UserRoleUseCase = Depends(get_role_use_case),
) -> GrantFeatureListResponse:
    """Return the feature catalog used by the special-permission dialog.

    # Error mapping
    - **401 Unauthorized** — missing, expired, or invalid Bearer token.
    - **403 Forbidden** — caller lacks ``read`` permission on ``user-grants``.
    """
    result = await use_case.list_grant_features()
    return GrantFeatureListResponse(
        data=[
            GrantFeatureResponse(
                id=feature.id,
                slug=feature.slug,
                name=feature.name,
                description=feature.description,
                is_enabled=feature.is_enabled,
            )
            for feature in result.features
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
            starts_at=_as_optional_aware_utc(g.starts_at),
            expires_at=_as_optional_aware_utc(g.expires_at),
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
