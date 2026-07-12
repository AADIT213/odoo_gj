from typing import List
from fastapi import APIRouter, Depends
from app.api import deps
from app.crud import crud_environmental
from app.schemas.environmental import EnvironmentalData, EnvironmentalDataCreate, EnvironmentalDataUpdate, SustainabilityGoal, SustainabilityGoalCreate, CarbonTransaction, CarbonTransactionCreate

router = APIRouter()

@router.get("/", response_model=List[EnvironmentalData])
def read_environmental_data(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_environmental.get_environmental_data(db, skip=skip, limit=limit)

@router.post("/", response_model=EnvironmentalData)
def create_environmental_data(
    *,
    db: deps.SessionDep,
    data_in: EnvironmentalDataCreate,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_environmental.create_environmental_data(db, obj_in=data_in)

@router.put("/{data_id}", response_model=EnvironmentalData)
def update_environmental_status(
    data_id: int,
    data_in: EnvironmentalDataUpdate,
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    # Usually requires Manager role
    return crud_environmental.update_environmental_data_status(db, data_id, data_in.status)

@router.get("/goals", response_model=List[SustainabilityGoal])
def read_goals(
    department_id: int = None,
    db: deps.SessionDep = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    return crud_environmental.get_sustainability_goals(db, department_id=department_id)

@router.post("/goals", response_model=SustainabilityGoal)
def create_goal(
    *,
    db: deps.SessionDep,
    goal_in: SustainabilityGoalCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_environmental.create_sustainability_goal(db, obj_in=goal_in)

@router.get("/transactions", response_model=List[CarbonTransaction])
def read_transactions(
    department_id: int = None,
    db: deps.SessionDep = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    return crud_environmental.get_carbon_transactions(db, department_id=department_id)

@router.post("/transactions", response_model=CarbonTransaction)
def create_transaction(
    *,
    db: deps.SessionDep,
    transaction_in: CarbonTransactionCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_environmental.create_carbon_transaction(db, obj_in=transaction_in)
