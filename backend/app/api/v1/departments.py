from typing import List
from fastapi import APIRouter, Depends
from app.api import deps
from app.crud import crud_department
from app.schemas.department import Department, DepartmentCreate

router = APIRouter()

@router.get("/", response_model=List[Department])
def read_departments(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_department.get_departments(db, skip=skip, limit=limit)

@router.post("/", response_model=Department)
def create_department(
    *,
    db: deps.SessionDep,
    dept_in: DepartmentCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_department.create_department(db, obj_in=dept_in)
