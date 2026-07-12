from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.crud import crud_social
from app.schemas.social import CSRActivity, CSRActivityCreate, EmployeeParticipation, EmployeeParticipationCreate, EmployeeParticipationUpdate

router = APIRouter()

@router.get("/activities", response_model=List[CSRActivity])
def read_activities(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_social.get_activities(db, skip=skip, limit=limit)

@router.post("/activities", response_model=CSRActivity)
def create_activity(
    *,
    db: deps.SessionDep,
    activity_in: CSRActivityCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_social.create_activity(db, obj_in=activity_in)

@router.get("/participations", response_model=List[EmployeeParticipation])
def read_participations(
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    # If not admin, return only own participations
    user_id = None if current_user.role in ["SuperAdmin", "Manager"] else current_user.id
    return crud_social.get_participations(db, user_id=user_id)

@router.post("/participations", response_model=EmployeeParticipation)
def create_participation(
    *,
    db: deps.SessionDep,
    participation_in: EmployeeParticipationCreate,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_social.create_participation(db, obj_in=participation_in)

@router.put("/participations/{id}/approve", response_model=EmployeeParticipation)
def approve_participation(
    id: int,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    # Only Managers or SuperAdmins should approve
    if current_user.role not in ["SuperAdmin", "Manager"]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return crud_social.approve_participation(db, participation_id=id)
