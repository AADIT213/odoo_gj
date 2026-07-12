from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_category(db: Session, category_id: int) -> Optional[Category]:
    return db.query(Category).filter(Category.id == category_id).first()


def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[Category]:
    return db.query(Category).offset(skip).limit(limit).all()


def create_category(db: Session, obj_in: CategoryCreate) -> Category:
    db_obj = Category(name=obj_in.name, type=obj_in.type, status=obj_in.status)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_category(db: Session, category_id: int, obj_in: CategoryUpdate) -> Optional[Category]:
    db_obj = db.query(Category).filter(Category.id == category_id).first()
    if not db_obj:
        return None
    for field, value in obj_in.dict(exclude_unset=True).items():
        setattr(db_obj, field, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_category(db: Session, category_id: int) -> bool:
    db_obj = db.query(Category).filter(Category.id == category_id).first()
    if not db_obj:
        return False
    db.delete(db_obj)
    db.commit()
    return True
