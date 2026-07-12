from sqlalchemy import Column, Integer, String, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Policy(Base):
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    document_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class PolicyAcknowledgement(Base):
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policy.id"), nullable=False)
    date_acknowledged = Column(Date, nullable=False)

class Audit(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    auditor_name = Column(String, nullable=False)
    audit_date = Column(Date, nullable=False)
    status = Column(String, default="Pending") # Pending, Passed, Failed
    findings = Column(String)

    # Relationships
    department = relationship("Department")

class ComplianceIssue(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    severity = Column(String, default="Medium") # Low, Medium, High, Critical
    status = Column(String, default="Open") # Open, Resolved, Overdue
    due_date = Column(Date, nullable=False)

    # Relationships
    department = relationship("Department")
    owner = relationship("User")

