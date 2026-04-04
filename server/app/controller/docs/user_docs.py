from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse


# POST /user/onboard
ONBOARDING_VALIDATION_ERROR = {
    422: {
        "description": "Validation error",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "alias"],
                            "msg": "Alias must not contain spaces",
                            "type": "value_error",
                        },
                        {
                            "loc": ["body", "first_name"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        },
                        {
                            "loc": ["body", "age_group"],
                            "msg": "Input should be one of the valid age group values",
                            "type": "enum",
                        },
                    ],
                }
            }
        },
    }
}

UNAUTHORIZED = {
    401: {
        "description": "Unauthorized",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Token has expired",
                }
            }
        },
    }
}

USER_NOT_FOUND = {
    404: {
        "description": "User not found",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "User not found",
                }
            }
        },
    }
}

EMAIL_NOT_VERIFIED = {
    403: {
        "description": "Email not verified",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Email must be verified before completing onboarding",
                }
            }
        },
    }
}

ONBOARDING_ALREADY_COMPLETED = {
    409: {
        "description": "Onboarding already completed",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Onboarding has already been completed",
                }
            }
        },
    }
}

ALIAS_CONFLICT = {
    409: {
        "description": "Alias already taken",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Alias 'johndoe' is already taken",
                }
            }
        },
    }
}
