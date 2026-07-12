from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Challenge(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    xp_reward = Column(Integer, default=50)
    category = Column(String) # Environmental, Social, Governance
    deadline = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

class Badge(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    icon_url = Column(String)
    required_xp = Column(Integer, default=100)

class UserBadge(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badge.id"), nullable=False)
    date_earned = Column(Date, nullable=False)

    user = relationship("User")
    badge = relationship("Badge")

class Reward(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    cost_xp = Column(Integer, nullable=False)
    stock = Column(Integer, default=100)
    category = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, server_default=func.now())

class ActivityLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    action = Column(String, nullable=False)
    module = Column(String, nullable=False)
    xp_earned = Column(Integer, default=0)
    timestamp = Column(String, nullable=False) # Store ISO format string for simplicity

    user = relationship("User")

class Redemption(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("reward.id"), nullable=False)
    xp_used = Column(Integer, nullable=False)
    status = Column(String, default="fulfilled")
    redeemed_at = Column(DateTime, server_default=func.now())
    
    user = relationship("User")
    reward = relationship("Reward")
