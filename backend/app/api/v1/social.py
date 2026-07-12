from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.crud import crud_social
from app.schemas.social import CSRActivity, CSRActivityCreate, CSRActivityUpdate, EmployeeParticipation, EmployeeParticipationCreate, EmployeeParticipationUpdate, DiversityMetric, TrainingMetric
from app.services import notification_service

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

@router.put("/activities/{id}", response_model=CSRActivity)
def update_activity(
    id: int,
    *,
    db: deps.SessionDep,
    activity_in: CSRActivityUpdate,
    current_user = Depends(deps.get_current_active_superuser),
):
    activity = crud_social.update_activity(db, activity_id=id, obj_in=activity_in)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

@router.delete("/activities/{id}")
def delete_activity(
    id: int,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_superuser),
):
    success = crud_social.delete_activity(db, activity_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Deleted successfully"}

@router.get("/participations", response_model=List[EmployeeParticipation])
def read_participations(
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    user_id = None if current_user.role in ["SuperAdmin", "Manager"] else current_user.id
    return crud_social.get_participations(db, user_id=user_id)

@router.post("/participations", response_model=EmployeeParticipation)
def create_participation(
    *,
    db: deps.SessionDep,
    participation_in: EmployeeParticipationCreate,
    current_user = Depends(deps.get_current_active_user),
):
    # Ensure they can only create participation for themselves
    participation_in.user_id = current_user.id
    return crud_social.create_participation(db, obj_in=participation_in)

@router.put("/participations/{id}", response_model=EmployeeParticipation)
def update_participation(
    id: int,
    *,
    db: deps.SessionDep,
    participation_in: EmployeeParticipationUpdate,
    current_user = Depends(deps.get_current_active_user),
):
    participation = crud_social.update_participation(db, participation_id=id, obj_in=participation_in)
    if not participation:
        raise HTTPException(status_code=404, detail="Participation not found")
    return participation

@router.delete("/participations/{id}")
def delete_participation(
    id: int,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    success = crud_social.delete_participation(db, participation_id=id)
    if not success:
        raise HTTPException(status_code=404, detail="Participation not found")
    return {"message": "Deleted successfully"}

@router.put("/participations/{id}/approve", response_model=EmployeeParticipation)
def approve_participation_endpoint(
    id: int,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    if current_user.role not in ["SuperAdmin", "Manager"]:
        raise HTTPException(status_code=403, detail="Not enough privileges")
    participation = crud_social.approve_participation(db, participation_id=id, manager_id=current_user.id)
    if not participation:
         raise HTTPException(status_code=404, detail="Participation or related activity/user not found")
    # Notify the employee whose participation was approved
    if participation.user_id:
        from app.models.social import CSRActivity as CSRActivityModel
        from app.services import badge_service
        
        activity = db.query(CSRActivityModel).filter(CSRActivityModel.id == participation.activity_id).first()
        activity_title = activity.title if activity else "CSR Activity"
        notification_service.send_csr_approved(db, user_id=participation.user_id, activity_title=activity_title)
        
        # Check and award badges based on new XP
        new_badges = badge_service.check_and_award_badges(db, user_id=participation.user_id)
        # Inject into ORM object so Pydantic serializes it
        participation.new_badges = [{"id": b.id, "name": b.name, "description": b.description, "icon_url": b.icon_url} for b in new_badges]
        
    return participation

@router.get("/diversity-metrics", response_model=List[DiversityMetric])
def read_diversity_metrics(
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_social.get_diversity_metrics(db)

@router.get("/training-metrics", response_model=List[TrainingMetric])
def read_training_metrics(
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_social.get_training_metrics(db)
