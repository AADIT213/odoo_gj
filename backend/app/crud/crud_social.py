from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.social import CSRActivity, EmployeeParticipation
from app.schemas.social import CSRActivityCreate, EmployeeParticipationCreate

def get_activities(db: Session, skip: int = 0, limit: int = 100) -> List[CSRActivity]:
    return db.query(CSRActivity).offset(skip).limit(limit).all()

def create_activity(db: Session, obj_in: CSRActivityCreate) -> CSRActivity:
    db_obj = CSRActivity(
        title=obj_in.title,
        description=obj_in.description,
        date=obj_in.date,
        target_participants=obj_in.target_participants
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

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
        is_approved=False
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def approve_participation(db: Session, participation_id: int) -> Optional[EmployeeParticipation]:
    db_obj = db.query(EmployeeParticipation).filter(EmployeeParticipation.id == participation_id).first()
    if db_obj:
        db_obj.is_approved = True
        db.commit()
        db.refresh(db_obj)
    return db_obj
