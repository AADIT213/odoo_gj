from typing import List
from fastapi import APIRouter, Depends
from app.api import deps
from app.crud import crud_environmental
from app.schemas.environmental import EnvironmentalData, EnvironmentalDataCreate, EnvironmentalDataUpdate, SustainabilityGoal, SustainabilityGoalCreate, CarbonTransaction, CarbonTransactionCreate, AutoCalcTransactionRequest
from app.services import emission_service

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
    db: deps.SessionDep,
    department_id: int = None,
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
    db: deps.SessionDep,
    department_id: int = None,
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


@router.post("/transactions/auto", response_model=CarbonTransaction)
def create_auto_transaction(
    *,
    db: deps.SessionDep,
    request_in: AutoCalcTransactionRequest,
    current_user = Depends(deps.get_current_active_superuser),
):
    """
    Auto-calculate CO2e from source_type + quantity + unit using stored EmissionFactors.
    Requires auto_emission_calc_enabled=True in settings (toggle in admin panel).
    Returns 400 if toggle is off or no matching EmissionFactor found.
    """
    return emission_service.calculate_carbon_transaction(
        db=db,
        source_type=request_in.source_type,
        quantity=request_in.quantity,
        unit=request_in.unit,
        department_id=request_in.department_id,
        transaction_type=request_in.transaction_type,
        date=request_in.date,
        description=request_in.description,
    )
