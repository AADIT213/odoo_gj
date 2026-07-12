from pydantic import BaseModel
from typing import Optional

# Notification types
NOTIFICATION_TYPES = [
    "Gamification",    # Reward Redeemed, Badge Unlocked, Challenge Completed/Assigned
    "Social",          # CSR Activity Approved, CSR Activity Rejected
    "Governance",      # Policy Assigned, Policy Reminder, Audit Assigned, Compliance Issue
    "Environmental",   # ESG Goal Achieved, ESG Goal Missed, Dept ESG Score Updated
    "System",          # System Announcement
]

# Priority levels
PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"]

class NotificationBase(BaseModel):
    user_id: int
    title: str
    message: str
    type: str = "System"
    priority: str = "Medium"
    action_url: Optional[str] = None
    meta: Optional[str] = None

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: int
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True
