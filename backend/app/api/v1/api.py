from fastapi import APIRouter
from app.api.v1 import auth, users, departments, environmental, social, governance, gamification, analytics, notifications, advisor

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(environmental.router, prefix="/environmental", tags=["environmental"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(governance.router, prefix="/governance", tags=["governance"])
api_router.include_router(gamification.router, prefix="/gamification", tags=["gamification"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(advisor.router, prefix="/advisor", tags=["advisor"])
