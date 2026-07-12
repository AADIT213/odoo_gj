from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate


def get_user_notifications(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    priority: Optional[str] = None,
) -> List[Notification]:
    q = db.query(Notification).filter(Notification.user_id == user_id)
    if is_read is not None:
        q = q.filter(Notification.is_read == is_read)
    if type:
        q = q.filter(Notification.type == type)
    if priority:
        q = q.filter(Notification.priority == priority)
    return q.order_by(Notification.id.desc()).offset(skip).limit(limit).all()


def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).count()


def create_notification(db: Session, obj_in: NotificationCreate) -> Notification:
    db_obj = Notification(**obj_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def mark_notification_read(db: Session, notification_id: int, user_id: Optional[int] = None) -> Optional[Notification]:
    q = db.query(Notification).filter(Notification.id == notification_id)
    if user_id is not None:
        q = q.filter(Notification.user_id == user_id)
    db_obj = q.first()
    if db_obj:
        db_obj.is_read = True
        db.commit()
        db.refresh(db_obj)
    return db_obj


def mark_all_read(db: Session, user_id: int) -> int:
    """Mark all unread notifications for a user as read. Returns count updated."""
    result = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False,
    ).all()
    count = len(result)
    for notif in result:
        notif.is_read = True
    db.commit()
    return count


def delete_notification(db: Session, notification_id: int, user_id: int) -> bool:
    """Delete a notification only if it belongs to the user. Returns True on success."""
    db_obj = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
        return True
    return False
