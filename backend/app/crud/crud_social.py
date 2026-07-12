from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from app.models.social import CSRActivity, EmployeeParticipation, DiversityMetric, TrainingMetric, AuditLog
from app.schemas.social import CSRActivityCreate, CSRActivityUpdate, EmployeeParticipationCreate, EmployeeParticipationUpdate
from app.models.user import User
from app.services import esg_engine

def get_activities(db: Session, skip: int = 0, limit: int = 100) -> List[CSRActivity]:
    return db.query(CSRActivity).offset(skip).limit(limit).all()

def create_activity(db: Session, obj_in: CSRActivityCreate) -> CSRActivity:
    db_obj = CSRActivity(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_activity(db: Session, activity_id: int, obj_in: CSRActivityUpdate) -> Optional[CSRActivity]:
    db_obj = db.query(CSRActivity).filter(CSRActivity.id == activity_id).first()
    if db_obj:
        update_data = obj_in.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_activity(db: Session, activity_id: int) -> bool:
    db_obj = db.query(CSRActivity).filter(CSRActivity.id == activity_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False

def get_participations(db: Session, user_id: Optional[int] = None) -> List[EmployeeParticipation]:
    query = db.query(EmployeeParticipation)
    if user_id:
        query = query.filter(EmployeeParticipation.user_id == user_id)
    return query.all()

def create_participation(db: Session, obj_in: EmployeeParticipationCreate) -> EmployeeParticipation:
    db_obj = EmployeeParticipation(
        user_id=obj_in.user_id,
        activity_id=obj_in.activity_id,
        hours_contributed=obj_in.hours_contributed,
        proof_url=obj_in.proof_url,
        completion_date=obj_in.completion_date,
        is_approved=False,
        points_earned=0
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_participation(db: Session, participation_id: int, obj_in: EmployeeParticipationUpdate) -> Optional[EmployeeParticipation]:
    db_obj = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if db_obj:
        update_data = obj_in.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_participation(db: Session, participation_id: int) -> bool:
    db_obj = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False

def approve_participation(db: Session, participation_id: int, manager_id: int) -> Optional[EmployeeParticipation]:
    participation = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if not participation or participation.is_approved:
        return participation

    activity = db.query(CSRActivity).filter(CSRActivity.id == participation.activity_id).first()
    user = db.query(User).filter(User.id == participation.user_id).first()

    if not activity or not user:
        return None

    # 0. Check evidence requirement
    # Fetch settings to see if evidence is required
    from app.services import emission_service
    settings = emission_service.get_settings(db)
    if getattr(settings, 'evidence_required_enabled', False) and not participation.proof_url:
        # Do not approve, raise error
        raise HTTPException(status_code=400, detail="Proof of participation is required before approval.")

    # 1. Set Approved and points
    participation.is_approved = True
    participation.points_earned = activity.points_awarded

    # 2. Add XP to User
    user.xp = (user.xp or 0) + activity.points_awarded
    user.level = (user.xp // 1000) + 1

    # 3. Audit Log
    audit = AuditLog(
        action="Approve Participation",
        user_id=manager_id,
        details=f"Approved participation {participation.id} for user {user.id}. Awarded {activity.points_awarded} XP.",
        timestamp=datetime.utcnow().isoformat()
    )
    db.add(audit)

    db.commit()
    db.refresh(participation)

    # 4. Recalculate department ESG score via the engine
    if user.department_id:
        esg_engine.recalculate_department_score(db, user.department_id)

    return participation

def get_diversity_metrics(db: Session) -> List[DiversityMetric]:
    return db.query(DiversityMetric).all()

def get_training_metrics(db: Session) -> List[TrainingMetric]:
    return db.query(TrainingMetric).all()
