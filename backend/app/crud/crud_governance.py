from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.governance import Policy, PolicyAcknowledgement, Audit, ComplianceIssue
from app.schemas.governance import PolicyCreate, PolicyAcknowledgementCreate, AuditCreate, AuditUpdate, ComplianceIssueCreate

def get_policies(db: Session, skip: int = 0, limit: int = 100) -> List[Policy]:
    return db.query(Policy).offset(skip).limit(limit).all()

def create_policy(db: Session, obj_in: PolicyCreate) -> Policy:
    db_obj = Policy(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def acknowledge_policy(db: Session, obj_in: PolicyAcknowledgementCreate) -> PolicyAcknowledgement:
    db_obj = PolicyAcknowledgement(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_audits(db: Session, department_id: Optional[int] = None) -> List[Audit]:
    query = db.query(Audit)
    if department_id:
        query = query.filter(Audit.department_id == department_id)
    return query.all()

def create_audit(db: Session, obj_in: AuditCreate) -> Audit:
    db_obj = Audit(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_audit(db: Session, audit_id: int, obj_in: AuditUpdate) -> Optional[Audit]:
    db_obj = db.query(Audit).filter(Audit.id == audit_id).first()
    if db_obj:
        db_obj.status = obj_in.status
        db_obj.findings = obj_in.findings
        db.commit()
        db.refresh(db_obj)
    return db_obj

def get_compliance_issues(db: Session, department_id: Optional[int] = None) -> List[ComplianceIssue]:
    query = db.query(ComplianceIssue)
    if department_id:
        query = query.filter(ComplianceIssue.department_id == department_id)
    return query.all()

def create_compliance_issue(db: Session, obj_in: ComplianceIssueCreate) -> ComplianceIssue:
    db_obj = ComplianceIssue(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def resolve_compliance_issue(db: Session, issue_id: int) -> Optional[ComplianceIssue]:
    db_obj = db.query(ComplianceIssue).filter(ComplianceIssue.id == issue_id).first()
    if db_obj:
        db_obj.status = "Resolved"
        db.commit()
        db.refresh(db_obj)
    return db_obj
