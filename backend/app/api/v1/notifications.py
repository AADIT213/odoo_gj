from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.crud import crud_notification
from app.schemas.notification import Notification, NotificationCreate

router = APIRouter()


@router.get("/", response_model=List[Notification])
def read_notifications(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    type: Optional[str] = None,
    priority: Optional[str] = None,
    current_user=Depends(deps.get_current_active_user),
):
    return crud_notification.get_user_notifications(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        is_read=is_read,
        type=type,
        priority=priority,
    )


@router.get("/unread-count")
def get_unread_count(
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    count = crud_notification.get_unread_count(db, user_id=current_user.id)
    return {"count": count}


@router.put("/{id}/read", response_model=Notification)
@router.patch("/{id}/read", response_model=Notification)
def mark_notification_read(
    id: int,
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    notif = crud_notification.mark_notification_read(db, notification_id=id, user_id=current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.patch("/read-all")
def mark_all_read(
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    count = crud_notification.mark_all_read(db, user_id=current_user.id)
    return {"updated": count}


@router.delete("/{id}")
def delete_notification(
    id: int,
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    success = crud_notification.delete_notification(db, notification_id=id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"deleted": id}


@router.post("/", response_model=Notification)
def create_notification(
    *,
    db: deps.SessionDep,
    notif_in: NotificationCreate,
    current_user=Depends(deps.get_current_active_superuser),
):
    return crud_notification.create_notification(db, obj_in=notif_in)
