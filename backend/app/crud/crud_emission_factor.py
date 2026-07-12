from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.environmental import EmissionFactor
from app.schemas.environmental import EmissionFactorCreate, EmissionFactor


def get_factor(db: Session, factor_id: int) -> Optional[EmissionFactor]:
    return db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()


def get_factors(db: Session, skip: int = 0, limit: int = 100) -> List[EmissionFactor]:
    return db.query(EmissionFactor).offset(skip).limit(limit).all()


def create_factor(db: Session, obj_in: EmissionFactorCreate) -> EmissionFactor:
    db_obj = EmissionFactor(source_type=obj_in.source_type, factor=obj_in.factor)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_factor(db: Session, factor_id: int, obj_in: EmissionFactorCreate) -> Optional[EmissionFactor]:
    db_obj = db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()
    if not db_obj:
        return None
    db_obj.source_type = obj_in.source_type
    db_obj.factor = obj_in.factor
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_factor(db: Session, factor_id: int) -> bool:
    db_obj = db.query(EmissionFactor).filter(EmissionFactor.id == factor_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
