from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from scalar_fastapi import get_scalar_api_reference
from scalar_fastapi.scalar_fastapi import Theme

from app.controller.router import router
from app.core.config import settings
from app.infrastructure.messaging.redis import create_arq_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.arq = await create_arq_pool()
    yield
    await app.state.arq.aclose()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
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
    return JSONResponse(
        status_code=422,
        content={"success": False, "detail": exc.errors()},
    )
    
    
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "An unexpected error occurred",
            "detail": None
        }
    )



@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    """Serve Scalar API documentation"""
    return HTMLResponse("""
        <!DOCTYPE html>
        <html>
            <head>
                <title>ShrinkLy API Documentation</title>
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
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "ok"}
