from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class CSRActivity(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    category = Column(String, default="General")
    points_awarded = Column(Integer, default=0)
    date = Column(Date, nullable=False)
    target_participants = Column(Integer, default=0)

class EmployeeParticipation(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("csractivity.id"), nullable=False)
    hours_contributed = Column(Float, default=0.0)
    is_approved = Column(Boolean, default=False)
    proof_url = Column(String, nullable=True)
    points_earned = Column(Integer, default=0)
    completion_date = Column(Date, nullable=True)

    # Relationships
    user = relationship("User")
    activity = relationship("CSRActivity")

class DiversityMetric(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    metric_name = Column(String, nullable=False)  # e.g. "Gender Ratio", "Minority Representation"
    metric_value = Column(Float, nullable=False)
    date_recorded = Column(Date, nullable=False)

class TrainingMetric(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    course_name = Column(String, nullable=False)
    completion_percentage = Column(Float, nullable=False)
    date_recorded = Column(Date, nullable=False)

class AuditLog(Base):
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    details = Column(String, nullable=True)
    timestamp = Column(String, nullable=False) # Store as ISO string for simplicity or DateTime
