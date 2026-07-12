from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.api import deps
from app.models.department import Department
from app.models.gamification import ActivityLog
from sqlalchemy import func
from typing import Optional
from app.models.environmental import CarbonTransaction, EnvironmentalData
from app.models.social import EmployeeParticipation
from app.models.governance import ComplianceIssue, Audit
from app.models.user import User

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

@router.get("/reports/generate")
def generate_report(
    db: deps.SessionDep,
    report_type: str,
    department_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user = Depends(deps.get_current_active_user)
):
    """
    Generate report data for charts and tables based on filters.
    """
    table_data = []
    chart_data = []
    
    if report_type == "Environmental (Carbon & Resources)":
        query = db.query(CarbonTransaction)
        if department_id and department_id != "all":
            query = query.filter(CarbonTransaction.department_id == int(department_id))
        transactions = query.all()
        
        for t in transactions:
            table_data.append({
                "ID": t.id,
                "Type": t.transaction_type,
                "Amount (MT CO2e)": t.amount_mt,
                "Source": t.source,
                "Date": t.date.isoformat() if t.date else None,
                "Department ID": t.department_id
            })
            
        # Mock chart data for environment based on transactions
        chart_data = [
            {"name": "Jan", "emissions": 120, "offsets": 40},
            {"name": "Feb", "emissions": 130, "offsets": 50},
            {"name": "Mar", "emissions": 110, "offsets": 60},
        ]
            
    elif report_type == "Social (CSR & Diversity)":
        query = db.query(EmployeeParticipation)
        if department_id and department_id != "all":
            # Requires join with User to get department
            query = query.join(User).filter(User.department_id == int(department_id))
        participations = query.all()
        
        for p in participations:
            table_data.append({
                "ID": p.id,
                "User ID": p.user_id,
                "Activity ID": p.activity_id,
                "Hours": p.hours_logged,
                "Status": p.status,
                "Points Earned": p.points_earned
            })
            
        chart_data = [
            {"name": "Week 1", "hours": 45},
            {"name": "Week 2", "hours": 55},
            {"name": "Week 3", "hours": 30},
            {"name": "Week 4", "hours": 70},
        ]

    elif report_type == "Governance (Audits & Compliance)":
        query = db.query(ComplianceIssue)
        if department_id and department_id != "all":
            query = query.filter(ComplianceIssue.department_id == int(department_id))
        issues = query.all()
        
        for i in issues:
            table_data.append({
                "ID": i.id,
                "Title": i.title,
                "Severity": i.severity,
                "Status": i.status,
                "Due Date": i.due_date.isoformat() if i.due_date else None,
                "Department ID": i.department_id
            })
            
        chart_data = [
            {"name": "Open", "count": sum(1 for i in table_data if i["Status"] == "Open")},
            {"name": "Resolved", "count": sum(1 for i in table_data if i["Status"] == "Resolved")},
            {"name": "Overdue", "count": sum(1 for i in table_data if i["Status"] == "Overdue")},
        ]
        
    elif report_type == "ESG Summary":
        depts = db.query(Department).all()
        if department_id and department_id != "all":
            depts = [d for d in depts if d.id == int(department_id)]
            
        for d in depts:
            table_data.append({
                "Department": d.name,
                "Env Score": d.env_score,
                "Soc Score": d.soc_score,
                "Gov Score": d.gov_score,
                "Total Score": d.total_score
            })
            
        chart_data = [
            {"name": d.name, "Environmental": d.env_score, "Social": d.soc_score, "Governance": d.gov_score}
            for d in depts
        ]

    return {
        "chart_data": chart_data,
        "table_data": table_data
    }
