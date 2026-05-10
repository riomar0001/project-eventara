from app.controller.schemas.auth_schema import ErrorResponse, ValidationErrorResponse

COMMUNITY_VENUE_CREATE_OPENAPI_EXTRA = {
    "requestBody": {
        "content": {
            "application/json": {
                "examples": {
                    "with_image": {
                        "summary": "Community venue with a previously uploaded image",
                        "value": {
                            "name": "Rizal Park",
                            "description": "Historic open-air park in Manila.",
                            "image_url": "https://cdn.example.com/venue-image/rizal-park.webp",
                            "address_line": "Roxas Blvd",
                            "city": "Manila",
                            "province": "Metro Manila",
                            "postal_code": "1000",
                            "region": "NCR",
                            "country": "Philippines",
                            "capacity": 5000,
                            "venue_type": "outdoor",
                            "amenities": ["Open Space", "Restroom"],
                            "contact_name": "Juan Dela Cruz",
                            "contact_phone": "09171234567",
                            "contact_email": "juan@example.com",
                        },
                    }
                }
            }
        }
    }
}

OFFICIAL_VENUE_CREATE_OPENAPI_EXTRA = {
    "requestBody": {
        "content": {
            "application/json": {
                "examples": {
                    "with_image": {
                        "summary": "Official venue with a previously uploaded image",
                        "value": {
                            "name": "Davao Convention Center",
                            "description": "Premier convention facility in Mindanao.",
                            "image_url": "https://cdn.example.com/venue-image/davao-convention-center.webp",
                            "address_line": "123 Quimpo Blvd",
                            "city": "Davao City",
                            "province": "Davao del Sur",
                            "postal_code": "8000",
                            "region": "Region XI",
                            "country": "Philippines",
                            "capacity": 2000,
                            "venue_type": "indoor",
                            "amenities": ["Wifi", "Parking"],
                            "contact_name": "Maria Santos",
                            "contact_phone": "09171234567",
                            "contact_email": "contact@davaocvb.ph",
                        },
                    }
                }
            }
        }
    }
}

VENUE_UPDATE_OPENAPI_EXTRA = {
    "requestBody": {
        "content": {
            "application/json": {
                "examples": {
                    "with_image": {
                        "summary": "Update venue details and image",
                        "value": {
                            "name": "Davao Convention Center",
                            "description": "Updated convention facility details.",
                            "image_url": "https://cdn.example.com/venue-image/davao-convention-center-updated.webp",
                            "address_line": "123 Quimpo Blvd",
                            "city": "Davao City",
                            "province": "Davao del Sur",
                            "postal_code": "8000",
                            "region": "Region XI",
                            "country": "Philippines",
                            "capacity": 2200,
                            "venue_type": "indoor",
                            "is_partner": True,
                            "amenities": ["Wifi", "Parking", "Restroom"],
                            "contact_name": "Maria Santos",
                            "contact_phone": "09171234567",
                            "contact_email": "contact@davaocvb.ph",
                        },
                    }
                }
            }
        }
    }
}

VENUE_IMAGE_UPLOAD_OPENAPI_EXTRA = {
    "requestBody": {
        "content": {
            "application/json": {
                "examples": {
                    "webp_image": {
                        "summary": "Generate a WebP venue image upload URL",
                        "value": {"content_type": "image/webp"},
                    }
                }
            }
        }
    }
}

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
        "content": {"application/json": {"example": {"success": False, "message": "Venue with this name already exists: Davao Convention Center"}}},
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

VENUE_IMAGE_STORAGE_UNAVAILABLE = {
    503: {
        "description": "Object storage is unavailable or not configured",
        "model": ErrorResponse,
        "content": {"application/json": {"example": {"success": False, "message": "Storage service is currently unavailable."}}},
    }
}
