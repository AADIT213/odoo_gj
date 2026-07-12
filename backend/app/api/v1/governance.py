from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.crud import crud_governance
from app.schemas.governance import Policy, PolicyCreate, PolicyAcknowledgement, PolicyAcknowledgementCreate, Audit, AuditCreate, AuditUpdate, ComplianceIssue, ComplianceIssueCreate

router = APIRouter()

@router.get("/policies", response_model=List[Policy])
def read_policies(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_governance.get_policies(db, skip=skip, limit=limit)

@router.post("/policies", response_model=Policy)
def create_policy(
    *,
    db: deps.SessionDep,
    policy_in: PolicyCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_governance.create_policy(db, obj_in=policy_in)

@router.post("/policies/acknowledge", response_model=PolicyAcknowledgement)
def acknowledge_policy(
    *,
    db: deps.SessionDep,
    ack_in: PolicyAcknowledgementCreate,
    current_user = Depends(deps.get_current_active_user),
):
    # Ensure users only acknowledge for themselves
    if ack_in.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only acknowledge for self")
    return crud_governance.acknowledge_policy(db, obj_in=ack_in)

@router.get("/audits", response_model=List[Audit])
def read_audits(
    db: deps.SessionDep,
    department_id: int = None,
    current_user = Depends(deps.get_current_active_user),
):
    # Normal employees probably shouldn't see all audits unless it's their department
    if current_user.role == "Employee" and current_user.department_id != department_id:
         raise HTTPException(status_code=403, detail="Cannot view other department audits")
    return crud_governance.get_audits(db, department_id=department_id)

@router.post("/audits", response_model=Audit)
def create_audit(
    *,
    db: deps.SessionDep,
    audit_in: AuditCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_governance.create_audit(db, obj_in=audit_in)

@router.get("/compliance-issues", response_model=List[ComplianceIssue])
def read_compliance_issues(
    department_id: int = None,
    db: deps.SessionDep = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    return crud_governance.get_compliance_issues(db, department_id=department_id)

@router.post("/compliance-issues", response_model=ComplianceIssue)
def create_compliance_issue(
    *,
    db: deps.SessionDep,
    issue_in: ComplianceIssueCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_governance.create_compliance_issue(db, obj_in=issue_in)

@router.put("/compliance-issues/{id}/resolve", response_model=ComplianceIssue)
def resolve_compliance_issue(
    id: int,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    if current_user.role not in ["SuperAdmin", "Manager"]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return crud_governance.resolve_compliance_issue(db, issue_id=id)
