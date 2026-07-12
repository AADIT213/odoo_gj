from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate

def get_user_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[Notification]:
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.id.desc()).offset(skip).limit(limit).all()

def create_notification(db: Session, obj_in: NotificationCreate) -> Notification:
    db_obj = Notification(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def mark_notification_read(db: Session, notification_id: int) -> Optional[Notification]:
    db_obj = db.query(Notification).filter(Notification.id == notification_id).first()
    if db_obj:
        db_obj.is_read = True
        db.commit()
        db.refresh(db_obj)
    return db_obj
