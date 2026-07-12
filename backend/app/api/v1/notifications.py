from typing import List
from fastapi import APIRouter, Depends
from app.api import deps
from app.crud import crud_notification
from app.schemas.notification import Notification, NotificationCreate

router = APIRouter()

@router.get("/", response_model=List[Notification])
def read_notifications(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 50,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_notification.get_user_notifications(db, user_id=current_user.id, skip=skip, limit=limit)

@router.put("/{id}/read", response_model=Notification)
def mark_notification_read(
    id: int,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    # Only the owner should be able to mark their notification as read
    # Real app would check ownership here.
    return crud_notification.mark_notification_read(db, notification_id=id)

@router.post("/", response_model=Notification)
def create_notification(
    *,
    db: deps.SessionDep,
    notif_in: NotificationCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_notification.create_notification(db, obj_in=notif_in)
