from fastapi import APIRouter
from app.controller.api.auth_route import router as auth_router
from app.controller.api.user_route import router as onboarding_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(onboarding_router)
