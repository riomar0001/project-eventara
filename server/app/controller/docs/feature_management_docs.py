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
                    "message": "Role 'participant' does not have 'update' access to 'features'.",
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

FEATURE_CONFLICT = {
    409: {
        "description": "Feature slug already exists",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Feature slug already exists: user-accounts"}}},
    }
}

FEATURE_IN_USE = {
    409: {
        "description": "Feature is still referenced by roles or grants",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Feature cannot be deleted while roles or user grants still reference it.",
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
