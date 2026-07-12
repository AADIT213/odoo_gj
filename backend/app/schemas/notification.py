from pydantic import BaseModel
from typing import Optional

class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "Info"

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True
