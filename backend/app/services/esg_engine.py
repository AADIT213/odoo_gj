"""
ESG Score Engine Service
Calculates Environmental, Social, Governance, and composite ESG scores.
All business logic lives here — not in routes or CRUD.
"""
from typing import Optional
from sqlalchemy.orm import Session
from datetime import date

from app.models.department import Department
from app.models.environmental import CarbonTransaction, EnvironmentalData
from app.models.social import EmployeeParticipation, CSRActivity
from app.models.governance import ComplianceIssue, PolicyAcknowledgement, Audit
from app.models.esg import ESGWeightConfig


def _get_weights(db: Session) -> ESGWeightConfig:
    """Return the single global weight config row, creating defaults if absent."""
    config = db.query(ESGWeightConfig).first()
    if not config:
        config = ESGWeightConfig(env_weight=0.40, soc_weight=0.30, gov_weight=0.30)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def calculate_env_score(db: Session, department_id: int) -> float:
    """
    Environmental Score (0-100):
    Starts at 100. Deducts for carbon emissions and energy/water/waste data.
    - Each MT of net carbon (Credits exceed Offsets) deducts 1 point, capped at -40.
    - Each pending (unapproved) EnvironmentalData record deducts 2 points.
    """
    score = 100.0

    # Carbon Transactions: net credits vs offsets
    transactions = db.query(CarbonTransaction).filter(
        CarbonTransaction.department_id == department_id
    ).all()
    credits = sum(t.amount_mt for t in transactions if t.transaction_type == "Credit")
    offsets = sum(t.amount_mt for t in transactions if t.transaction_type == "Offset")
    net_carbon = max(0.0, credits - offsets)  # Only deduct if credits > offsets
    score -= min(40.0, net_carbon * 1.0)

    # Pending (unreviewed) environmental submissions
    pending = db.query(EnvironmentalData).filter(
        EnvironmentalData.department_id == department_id,
        EnvironmentalData.status == "Pending"
    ).count()
    score -= min(20.0, pending * 2.0)

    return max(0.0, round(score, 2))


def calculate_soc_score(db: Session, department_id: int) -> float:
    """
    Social Score (0-100):
    Starts at 50. Awards points for approved CSR participations.
    Each approved participation adds points_earned * 0.5, capped at +50.
    """
    score = 50.0

    # Get all users in this department to find their participations
    from app.models.user import User
    user_ids = [u.id for u in db.query(User.id).filter(User.department_id == department_id).all()]

    if user_ids:
        approved = db.query(EmployeeParticipation).filter(
            EmployeeParticipation.user_id.in_(user_ids),
            EmployeeParticipation.is_approved == True
        ).all()
        total_points = sum(p.points_earned or 0 for p in approved)
        score += min(50.0, total_points * 0.5)

    return min(100.0, round(score, 2))


def calculate_gov_score(db: Session, department_id: int) -> float:
    """
    Governance Score (0-100):
    Starts at 80.
    - Each Open/Overdue Compliance Issue deducts 5 points.
    - Each failed Audit deducts 3 points.
    - Each acknowledged Policy adds 1 point, capped at +10.
    """
    score = 80.0

    # Compliance Issues (Open or Overdue)
    issues = db.query(ComplianceIssue).filter(
        ComplianceIssue.department_id == department_id,
        ComplianceIssue.status.in_(["Open", "Overdue"])
    ).count()
    score -= min(40.0, issues * 5.0)

    # Failed Audits
    failed_audits = db.query(Audit).filter(
        Audit.department_id == department_id,
        Audit.status == "Failed"
    ).count()
    score -= min(20.0, failed_audits * 3.0)

    # Policy Acknowledgements reward (global — across org)
    acks = db.query(PolicyAcknowledgement).count()
    score += min(10.0, acks * 1.0)

    return max(0.0, min(100.0, round(score, 2)))


def recalculate_department_score(db: Session, department_id: int) -> Optional[Department]:
    """
    Master recalculation method.
    Fetches the configured weights, calculates all three pillar scores,
    computes the weighted total, and persists to the Department table.
    """
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        return None

    weights = _get_weights(db)

    env = calculate_env_score(db, department_id)
    soc = calculate_soc_score(db, department_id)
    gov = calculate_gov_score(db, department_id)
    total = round(
        (env * weights.env_weight) + (soc * weights.soc_weight) + (gov * weights.gov_weight),
        2
    )

    dept.env_score = env
    dept.soc_score = soc
    dept.gov_score = gov
    dept.total_score = total

    db.commit()
    db.refresh(dept)
    return dept


def recalculate_all_departments(db: Session) -> list:
    """Recalculates ESG scores for every department. Called when weights change."""
    departments = db.query(Department).all()
    results = []
    for dept in departments:
        updated = recalculate_department_score(db, dept.id)
        if updated:
            results.append({
                "department_id": updated.id,
                "department_name": updated.name,
                "env_score": updated.env_score,
                "soc_score": updated.soc_score,
                "gov_score": updated.gov_score,
                "total_score": updated.total_score,
            })
    return results
