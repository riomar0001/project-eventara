import uuid
from collections.abc import Callable, Coroutine

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.controller.dependencies.auth_depends import _auth_detail
from app.core.security.token_service import verify_access_token
from app.domain.entities.authorization_entities import GrantEffect, RoleAction
from app.infrastructure.database.repositories.rbac_repository import RBACRepository
from app.infrastructure.database.session import get_db

_bearer = HTTPBearer()


def require_permission(
    feature_slug: str,
    action: RoleAction,
) -> Callable[..., Coroutine[None, None, uuid.UUID]]:
    """Dependency factory that enforces RBAC for a given feature and action.

    Resolves permissions in two steps:
    1. User-level grants (``user_grants`` table) are checked first and take
       precedence over role permissions.  A DENY grant blocks access even when
       the role would otherwise allow it; an ALLOW grant bypasses the role check.
    2. Role-level permissions (``role_permissions`` table) are checked when no
       user grant exists.  Access is denied if no matching ALLOW permission is
       found or if the permission effect is DENY.

    Args:
        feature_slug: The slug of the feature being accessed, as stored in the
            ``features.slug`` column (e.g. ``"audit-logs"``, ``"events"``,
            ``"tickets"``).
        action: The operation being performed — one of ``RoleAction.CREATE``,
            ``READ``, ``UPDATE``, or ``DELETE``.

    Returns:
        An async callable that FastAPI resolves as a dependency.  On success it
        returns the authenticated caller's ``user_id`` (``uuid.UUID``) so the
        route handler can use it without a second token decode.

    Raises:
        401 Unauthorized — missing, expired, or invalid Bearer token.
        403 Forbidden    — no role assigned, or role/user grant denies access.

    **Injecting the user ID into the handler**::

        @router.get("/events")
        async def list_events(
            user_id: uuid.UUID = Depends(require_permission("events", RoleAction.READ)),
        ):
            # user_id is the authenticated caller's UUID
            return await use_case.list_events(user_id)

    **Using as a silent guard (user ID not needed)**::

        @router.delete(
            "/events/{event_id}",
            dependencies=[Depends(require_permission("events", RoleAction.DELETE))],
        )
        async def delete_event(event_id: uuid.UUID):
            ...

    **Combining with other dependencies**::

        @router.post("/tickets")
        async def create_ticket(
            body: CreateTicketRequest,
            user_id: uuid.UUID = Depends(require_permission("tickets", RoleAction.CREATE)),
            use_case: TicketUseCase = Depends(get_ticket_use_case),
        ):
            ...

    **Multiple actions on the same router using different slugs**::

        @router.get("/reports", dependencies=[Depends(require_permission("reports", RoleAction.READ))])
        async def get_reports(): ...

        @router.post("/reports", dependencies=[Depends(require_permission("reports", RoleAction.CREATE))])
        async def create_report(): ...

        @router.delete("/reports/{id}", dependencies=[Depends(require_permission("reports", RoleAction.DELETE))])
        async def delete_report(id: uuid.UUID): ...

    **Stacking with onboarding guard**::

        @router.patch("/profile")
        async def update_profile(
            body: UpdateProfileRequest,
            user_id: uuid.UUID = Depends(require_completed_onboarding),
            _: uuid.UUID = Depends(require_permission("profile", RoleAction.UPDATE)),
        ):
            # require_completed_onboarding ensures onboarding is done;
            # require_permission ensures the role allows profile updates.
            ...
    """

    async def check(
        credentials: HTTPAuthorizationCredentials = Depends(_bearer),
        db: AsyncSession = Depends(get_db),
    ) -> uuid.UUID:
        try:
            payload = verify_access_token(credentials.credentials)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=_auth_detail(exc),
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = uuid.UUID(payload.sub)
        repo = RBACRepository(db)

        # User-level grant takes precedence over role permissions.
        user_grant = await repo.get_user_grant(user_id, feature_slug, action)
        if user_grant is not None:
            if user_grant.effect == GrantEffect.DENY:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access to '{feature_slug}' has been explicitly denied for this account.",
                )
            return user_id  # ALLOW grant — skip role check

        # Fall back to role-level permission.
        role_name = payload.role_id
        if not role_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No role assigned. Access to '{feature_slug}' is not permitted.",
            )

        permission = await repo.get_role_permission(role_name, feature_slug, action)
        if permission is None or permission.effect == GrantEffect.DENY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role_name}' does not have '{action}' access to '{feature_slug}'.",
            )

        return user_id

    return check
