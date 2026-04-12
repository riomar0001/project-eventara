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
        "description": (
            "Forbidden — account is inactive/deleted, or email has not been verified. Check the `message` field to distinguish the two cases."
        ),
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "email_not_verified": {
                        "summary": "Email not verified",
                        "value": {
                            "success": False,
                            "message": "Email must be verified before completing onboarding",
                        },
                    },
                    "account_inactive": {
                        "summary": "Account inactive or deleted",
                        "value": {
                            "success": False,
                            "message": "Account is inactive or has been deleted",
                        },
                    },
                }
            }
        },
    }
}

ONBOARDING_CONFLICT = {
    409: {
        "description": (
            "Conflict — onboarding already completed, or the chosen alias is already taken. Check the `message` field to distinguish the two cases."
        ),
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "examples": {
                    "already_completed": {
                        "summary": "Onboarding already completed",
                        "value": {
                            "success": False,
                            "message": "Onboarding has already been completed",
                        },
                    },
                    "alias_taken": {
                        "summary": "Alias already taken",
                        "value": {
                            "success": False,
                            "message": "Alias 'johndoe' is already taken",
                        },
                    },
                }
            }
        },
    }
}


# GET /user/check-alias
ALIAS_CHECK_UNAUTHORIZED = {
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

# POST /user/change-password
CHANGE_PASSWORD_VALIDATION_ERROR = {
    422: {
        "description": "Validation error — current_password is empty or new_password is shorter than 8 characters",
        "model": ValidationErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "detail": [
                        {
                            "loc": ["body", "current_password"],
                            "msg": "String should have at least 1 character",
                            "type": "string_too_short",
                        },
                        {
                            "loc": ["body", "new_password"],
                            "msg": "String should have at least 8 characters",
                            "type": "string_too_short",
                        },
                    ],
                }
            }
        },
    }
}

INVALID_CURRENT_PASSWORD = {
    401: {
        "description": "Current password is incorrect",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "Invalid email or password",
                }
            }
        },
    }
}

SAME_PASSWORD_ERROR = {
    400: {
        "description": "New password is identical to the current password",
        "model": ErrorResponse,
        "content": {
            "application/json": {
                "example": {
                    "success": False,
                    "message": "New password must be different from the current password",
                }
            }
        },
    }
}
