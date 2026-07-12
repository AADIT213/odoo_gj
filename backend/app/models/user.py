from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, index=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    
    # Roles: SuperAdmin, Manager, DeptHead, Employee
    role = Column(String, default="Employee", nullable=False)
    
    department_id = Column(Integer, ForeignKey("department.id"), nullable=True)
    
    # Gamification
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    
    # Relationships
    department = relationship("Department", back_populates="users", foreign_keys="[User.department_id]")
