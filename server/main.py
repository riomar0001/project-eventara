import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.controller.router import router
from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.security.headers import SecurityHeadersMiddleware

logger = logging.getLogger(__name__)

_OPENAPI_TAGS = [
    {
        "name": "Auth",
        "description": "Registration, login, email verification, password reset, and session management.",
    },
    {
        "name": "Profile",
        "description": "Authenticated user's own profile — read and update personal info, onboarding, and account preferences.",
    },
    {
        "name": "Users",
        "description": "Admin-level management of user accounts — list, search, change roles, update emails, and trigger password resets.",
    },
    {
        "name": "Features",
        "description": "RBAC feature definitions — create, update, enable/disable, and delete the permission features used across roles and grants.",
    },
    {
        "name": "Roles",
        "description": "RBAC roles, user role assignments, and per-user permission grants — full lifecycle management for access control.",
    },
    {
        "name": "Queue",
        "description": "Background job queue monitoring — inspect live stats, list failed jobs, retry or discard dead-letter entries.",
    },
    {
        "name": "Account Settings",
        "description": "User-facing account settings — notification preferences, security options, and connected integrations.",
    },
    {
        "name": "Audit Logs",
        "description": "Immutable audit trail — query who did what, when, and on which resource across the platform.",
    },
    {
        "name": "Venues",
        "description": "Venue catalog — create, update, search, and delete venues with amenity normalisation and event-session cascade protection.",
    },
    {
        "name": "Volunteers",
        "description": "Volunteer management — registration, role assignments, availability, and event participation tracking.",
    },
    {
        "name": "Event Volunteers",
        "description": "Event volunteer roster — assign volunteers to events, manage acceptance/rejection lifecycle, and list the roster.",
    },
    {
        "name": "Event Participants",
        "description": "Event participant tracking — registration, attendance status updates, and cross-session participant queries.",
    },
    {
        "name": "Event Feedback",
        "description": "Checked-in attendee feedback — submit post-event ratings, comments, and suggestions.",
    },
    {
        "name": "Events",
        "description": "Event catalog — create, update, manage status, upload banners, and delete events with session management.",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
    openapi_tags=_OPENAPI_TAGS,
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    if settings.DEBUG:
        return JSONResponse(
            status_code=422,
            content={"success": False, "message": "Validation failed.", "errors": exc.errors()},
        )
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed.",
            "errors": [{"loc": err.get("loc"), "msg": err.get("msg"), "type": err.get("type")} for err in exc.errors()],
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    content: dict = {"success": False, "message": "An unexpected error occurred"}
    if settings.DEBUG:
        content["debug"] = f"{type(exc).__name__}: {exc}"
    return JSONResponse(status_code=500, content=content)


@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    """Serve Scalar API documentation"""
    return HTMLResponse("""
        <!DOCTYPE html>
        <html>
            <head>
                <title>Eventara API Documentation</title>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                
            </head>
            <body>
                <script id="api-reference" data-url="/openapi.json"></script>
                <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
            </body>
        </html>
    """)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "name": "Eventara API",
        "version": "1.0.0",
        "description": "API for Eventara, the ultimate event management platform by Davao Defi.",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
