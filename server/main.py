import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.controller.router import router
from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.security.headers import SecurityHeadersMiddleware

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
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
