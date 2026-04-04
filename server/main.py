from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from scalar_fastapi import get_scalar_api_reference

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


@app.get("/docs", include_in_schema=False)
async def scalar_docs() -> HTMLResponse:
    return get_scalar_api_reference(
        openapi_url="/openapi.json",
        title=settings.APP_NAME,
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}
