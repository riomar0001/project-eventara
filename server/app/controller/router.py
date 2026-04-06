from fastapi import APIRouter

from app.controller.api.audit_log_route import router as audit_log_router
from app.controller.api.auth_route import router as auth_router
from app.controller.api.role_route import grant_router, role_router
from app.controller.api.user_route import router as onboarding_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(onboarding_router)
router.include_router(audit_log_router)
router.include_router(role_router)
router.include_router(grant_router)
