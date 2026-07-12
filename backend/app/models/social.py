from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class CSRActivity(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    date = Column(Date, nullable=False)
    target_participants = Column(Integer, default=0)

class EmployeeParticipation(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("csractivity.id"), nullable=False)
    hours_contributed = Column(Float, default=0.0)
    is_approved = Column(Boolean, default=False)

    # Relationships
    user = relationship("User")
    activity = relationship("CSRActivity")
