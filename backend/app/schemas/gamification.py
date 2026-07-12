from pydantic import BaseModel
from datetime import date
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

class RewardCreate(RewardBase):
    pass

class Reward(RewardBase):
    id: int

    class Config:
        from_attributes = True
