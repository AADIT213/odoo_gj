from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class Notification(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="Info")  # Gamification, Social, Governance, Environmental, System
    priority = Column(String, default="Medium")  # Low, Medium, High, Critical
    is_read = Column(Boolean, default=False)
    action_url = Column(String, nullable=True)
    meta = Column(Text, nullable=True)  # JSON string for optional extra data
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    user = relationship("User")
