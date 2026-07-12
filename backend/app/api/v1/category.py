from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.crud import crud_category
from app.schemas.category import Category, CategoryCreate, CategoryUpdate

router = APIRouter()

@router.get("/", response_model=List[Category])
def read_categories(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_category.get_categories(db, skip=skip, limit=limit)

@router.post("/", response_model=Category)
def create_category(
    *,
    db: deps.SessionDep,
    cat_in: CategoryCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_category.create_category(db, obj_in=cat_in)

@router.put("/{category_id}", response_model=Category)
def update_category(
    *,
    db: deps.SessionDep,
    category_id: int,
    cat_in: CategoryUpdate,
    current_user = Depends(deps.get_current_active_superuser),
):
    updated = crud_category.update_category(db, category_id, cat_in)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@router.delete("/{category_id}")
def delete_category(
    *,
    db: deps.SessionDep,
    category_id: int,
    current_user = Depends(deps.get_current_active_superuser),
):
    success = crud_category.delete_category(db, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Deleted successfully"}
