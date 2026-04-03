from fastapi import FastAPI

from app.api.routes import auth
from app.config import settings

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, debug=settings.DEBUG)

api_prefix = "/api/v1"


app.include_router(auth.router, prefix=api_prefix)
