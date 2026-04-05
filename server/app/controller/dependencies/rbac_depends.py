import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security.token_service import verify_access_token

_bearer = HTTPBearer()


def require_admin_or_auditor_role(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> uuid.UUID:
    """FastAPI dependency enforcing Admin or Auditor role for audit log access.
    
    Validates the Bearer token and checks the role_id claim. Restricts access
    to users with 'admin' or 'auditor' roles only, as required for ISO 27001
    compliance. Returns the validated user ID for use in the route handler.
    
    Raises 401 if token is invalid/expired, 403 if user lacks required role.
    """
    try:
        payload = verify_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        )

    role_id = payload.role_id
    if role_id not in ("admin", "auditor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to audit logs requires Admin or Auditor role",
        )

    return uuid.UUID(payload.sub)
