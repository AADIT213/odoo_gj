from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ChallengeBase(BaseModel):
    title: str
    description: Optional[str] = None
    xp_reward: int = 50
    category: str
    deadline: date
    is_active: bool = True

class ChallengeCreate(ChallengeBase):
    pass

class Challenge(ChallengeBase):
    id: int

    class Config:
        from_attributes = True

class BadgeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon_url: Optional[str] = None
    required_xp: int = 100

class BadgeCreate(BadgeBase):
    pass

class Badge(BadgeBase):
    id: int

    class Config:
        from_attributes = True

class RewardBase(BaseModel):
    title: str
    description: Optional[str] = None
    cost_xp: int
    stock: int = 100
    category: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = "active"

class RewardCreate(RewardBase):
    pass

class Reward(RewardBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RedemptionBase(BaseModel):
    reward_id: int
    xp_used: int
    status: str = "fulfilled"

class RedemptionCreate(RedemptionBase):
    user_id: int

class RedemptionResponse(RedemptionBase):
    id: int
    user_id: int
    redeemed_at: datetime
    
    class Config:
        from_attributes = True

class UserBadgeResponse(BaseModel):
    id: int
    badge_id: int
    date_earned: date
    badge: Badge

    class Config:
        from_attributes = True
