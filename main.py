from fastapi import FastAPI
from mangum import Mangum
from app.api.routes import router
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

app.include_router(router)

handler = Mangum(app)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
