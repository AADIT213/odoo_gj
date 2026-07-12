# crud/crud_department.py
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department import DepartmentCreate

def get_department(db: Session, dept_id: int) -> Optional[Department]:
    return db.query(Department).filter(Department.id == dept_id).first()

def get_departments(db: Session, skip: int = 0, limit: int = 100) -> List[Department]:
    return db.query(Department).offset(skip).limit(limit).all()

def create_department(db: Session, obj_in: DepartmentCreate) -> Department:
    db_obj = Department(
        name=obj_in.name,
        description=obj_in.description
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_department(db: Session, dept_id: int, obj_in: dict) -> Optional[Department]:
    db_obj = db.query(Department).filter(Department.id == dept_id).first()
    if not db_obj:
        return None
    for field, value in obj_in.items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_department(db: Session, dept_id: int) -> bool:
    db_obj = db.query(Department).filter(Department.id == dept_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
