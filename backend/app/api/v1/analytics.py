from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.api import deps
from app.models.department import Department
from app.models.gamification import ActivityLog
from sqlalchemy import func

router = APIRouter()

@router.get("/organization-score", response_model=Dict[str, Any])
def get_organization_score(db: deps.SessionDep, current_user = Depends(deps.get_current_active_user)):
    """
    Calculate the overall organization ESG score by averaging department scores.
    """
    result = db.query(
        func.avg(Department.env_score).label("avg_env"),
        func.avg(Department.soc_score).label("avg_soc"),
        func.avg(Department.gov_score).label("avg_gov"),
        func.avg(Department.total_score).label("avg_total")
    ).first()
    
    return {
        "env_score": round(result.avg_env or 0.0, 2),
        "soc_score": round(result.avg_soc or 0.0, 2),
        "gov_score": round(result.avg_gov or 0.0, 2),
        "total_score": round(result.avg_total or 0.0, 2),
        "status": "Excellent" if (result.avg_total or 0) >= 80 else "Needs Improvement"
    }

@router.get("/department-rankings")
def get_department_rankings(db: deps.SessionDep, current_user = Depends(deps.get_current_active_user)):
    """
    Get departments ranked by their total ESG score.
    """
    depts = db.query(Department).order_by(Department.total_score.desc()).limit(10).all()
    return [{"id": d.id, "name": d.name, "score": d.total_score} for d in depts]

@router.get("/activity-feed")
def get_activity_feed(db: deps.SessionDep, current_user = Depends(deps.get_current_active_user)):
    """
    Get global activity feed for the dashboard.
    """
    activities = db.query(ActivityLog).order_by(ActivityLog.id.desc()).limit(10).all()
    return [{
        "id": a.id, 
        "user_name": a.user.full_name if a.user else "System",
        "action": a.action, 
        "module": a.module, 
        "timestamp": a.timestamp
    } for a in activities]

@router.get("/historical-trend")
def get_historical_trend(db: deps.SessionDep, current_user = Depends(deps.get_current_active_user)):
    """
    Get historical ESG trend data (placeholder implementation using DB data eventually).
    For now, return a stable generated trend since there's no historical table yet.
    """
    return [
        {"month": "Jan", "score": 65},
        {"month": "Feb", "score": 68},
        {"month": "Mar", "score": 70},
        {"month": "Apr", "score": 75},
        {"month": "May", "score": 82},
        {"month": "Jun", "score": 85},
    ]
