from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse


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
                            "loc": ["body", "email"],
                            "msg": "value is not a valid email address",
                            "type": "value_error",
                        }
                    ],
                }
            }
        },
    }
}

EMAIL_CONFLICT = {
    409: {
        "description": "Email already taken",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Email 'user@example.com' is already registered",
                }
            }
        },
    }
}
