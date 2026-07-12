from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.api import deps
from app.crud import crud_user
from app.schemas.user import User, UserCreate, UserUpdate
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/", response_model=User)
def create_user(
    *,
    db: deps.SessionDep,
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = crud_user.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud_user.create_user(db, user_in=user_in)
    return user

@router.get("/me", response_model=User)
def read_user_me(
    current_user: deps.CurrentUser,
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.get("/", response_model=List[User])
def read_users(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(deps.get_current_active_superuser),
) -> Any:
    """
    Retrieve users (Admin only).
    """
    users = crud_user.get_users(db, skip=skip, limit=limit)
    return users
