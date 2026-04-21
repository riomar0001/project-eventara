from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

UNAUTHORIZED = {
    401: {
        "description": "Missing or invalid Bearer token",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Token has expired"}}},
    }
}

VENUE_NOT_FOUND = {
    404: {
        "description": "Venue not found",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Venue not found"}}},
    }
}

RATING_NOT_FOUND = {
    404: {
        "description": "Rating not found — the authenticated user has not rated this venue",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "venue_not_found": {
                        "summary": "Venue not found",
                        "value": {"success": False, "message": "Venue not found"},
                    },
                    "rating_not_found": {
                        "summary": "Rating not found",
                        "value": {"success": False, "message": "Venue rating not found"},
                    },
                }
            }
        },
    }
}

RATING_CONFLICT = {
    409: {
        "description": "The authenticated user has already submitted a rating for this venue",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "User has already rated this venue",
                }
            }
        },
    }
}

RATING_VALIDATION_ERROR = {
    422: {
        "description": "Request body failed schema validation",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "rating"],
                            "msg": "Input should be greater than or equal to 1",
                            "type": "greater_than_equal",
                        }
                    ],
                }
            }
        },
    }
}
