from fastapi import APIRouter

from app.controller.api.analytics_route import analytics_router
from app.controller.api.app_feedback_route import app_feedback_router
from app.controller.api.audit_log_route import router as audit_log_router
from app.controller.api.auth_route import router as auth_router
from app.controller.api.dashboard_route import dashboard_router
from app.controller.api.event_feedback_route import event_feedback_router
from app.controller.api.event_participant_route import participant_router
from app.controller.api.event_route import event_router
from app.controller.api.event_volunteer_route import event_volunteer_router
from app.controller.api.features_route import feature_router
from app.controller.api.queue_route import router as queue_router
from app.controller.api.role_route import grant_router, role_management_router, role_router
from app.controller.api.user_account_route import router as user_account_router
from app.controller.api.user_route import account_settings_router
from app.controller.api.user_route import router as user_router
from app.controller.api.venue_route import venue_router
from app.controller.api.volunteer_route import volunteer_application_router, volunteer_role_router, volunteer_router

router = APIRouter()
router.include_router(analytics_router)
router.include_router(app_feedback_router)
router.include_router(dashboard_router)
router.include_router(auth_router)
router.include_router(user_router)
router.include_router(account_settings_router)
router.include_router(user_account_router)
router.include_router(audit_log_router)
router.include_router(feature_router)
router.include_router(role_management_router)
router.include_router(role_router)
router.include_router(grant_router)
router.include_router(queue_router)
router.include_router(venue_router)
router.include_router(event_router)
router.include_router(event_feedback_router)
router.include_router(participant_router)
router.include_router(volunteer_router)
router.include_router(volunteer_role_router)
router.include_router(volunteer_application_router)
router.include_router(event_volunteer_router)
