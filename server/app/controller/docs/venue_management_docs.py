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
                    "message": "Role 'participant' does not have 'create' access to 'venues'.",
                }
            }
        },
    }
}

VENUE_NOT_FOUND = {
    404: {
        "description": "Venue not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Venue not found"}}},
    }
}

VENUE_CONFLICT = {
    409: {
        "description": "A venue with that name already exists in the same city",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {"success": False, "message": "Venue with this name already exists: Davao Convention Center"}
            }
        },
    }
}

VENUE_IN_USE = {
    409: {
        "description": "Venue is still referenced by one or more event sessions",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Venue cannot be deleted while event sessions still reference it.",
                }
            }
        },
    }
}

VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "capacity"],
                            "msg": "Input should be greater than 0",
                            "type": "greater_than",
                        }
                    ],
                }
            }
        },
    }
}
