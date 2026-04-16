from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

FORBIDDEN = {
    403: {
        "description": "Insufficient permissions",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Role 'participant' does not have 'update' access to 'roles'.",
                }
            }
        },
    }
}

FEATURE_NOT_FOUND = {
    404: {
        "description": "Feature not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Feature not found"}}},
    }
}

ROLE_NOT_FOUND = {
    404: {
        "description": "Role not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Role not found"}}},
    }
}

ROLE_CONFLICT = {
    409: {
        "description": "Role name already exists",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Role name already exists: system_administrator"}}},
    }
}

ROLE_IN_USE = {
    409: {
        "description": "Role is still referenced by assignments or grants",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Role cannot be deleted while user assignments or grants still reference it.",
                }
            }
        },
    }
}

ROLE_PROTECTED = {
    409: {
        "description": "Protected role cannot be deleted",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "System Administrator role cannot be deleted",
                }
            }
        },
    }
}

VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "name"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        }
                    ],
                }
            }
        },
    }
}
