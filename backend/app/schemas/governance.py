from pydantic import BaseModel
from datetime import date
from typing import Optional

class PolicyBase(BaseModel):
    title: str
    description: Optional[str] = None
    document_url: Optional[str] = None
    is_active: bool = True

class PolicyCreate(PolicyBase):
    pass

class Policy(PolicyBase):
    id: int

    class Config:
        from_attributes = True

class PolicyAcknowledgementBase(BaseModel):
    user_id: int
    policy_id: int
    date_acknowledged: date

class PolicyAcknowledgementCreate(PolicyAcknowledgementBase):
    pass

class PolicyAcknowledgement(PolicyAcknowledgementBase):
    id: int

    class Config:
        from_attributes = True

class AuditBase(BaseModel):
    department_id: int
    auditor_name: str
    audit_date: date
    status: str = "Pending"
    findings: Optional[str] = None

class AuditCreate(AuditBase):
    pass

class AuditUpdate(BaseModel):
    status: str
    findings: Optional[str] = None

class Audit(AuditBase):
    id: int

    class Config:
        from_attributes = True

class ComplianceIssueBase(BaseModel):
    department_id: int
    title: str
    description: Optional[str] = None
    severity: str = "Medium"
    status: str = "Open"
    due_date: date

class ComplianceIssueCreate(ComplianceIssueBase):
    pass

class ComplianceIssue(ComplianceIssueBase):
    id: int

    class Config:
        from_attributes = True
