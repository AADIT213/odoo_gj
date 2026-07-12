from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Department(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    parent_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    status = Column(String, default="Active")
    head_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    
    # ESG Scores
    env_score = Column(Float, default=0.0)
    soc_score = Column(Float, default=0.0)
    gov_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)

    # Relationships
    users = relationship("User", back_populates="department")
