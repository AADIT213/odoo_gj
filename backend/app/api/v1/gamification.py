from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.api import deps
from app.crud import crud_gamification
from app.models.user import User
from app.schemas.gamification import Challenge, ChallengeCreate, Badge, BadgeCreate, Reward, RewardCreate

router = APIRouter()

@router.get("/challenges", response_model=List[Challenge])
def read_challenges(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_gamification.get_challenges(db, skip=skip, limit=limit)

@router.post("/challenges", response_model=Challenge)
def create_challenge(
    *,
    db: deps.SessionDep,
    challenge_in: ChallengeCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_gamification.create_challenge(db, obj_in=challenge_in)

@router.get("/badges", response_model=List[Badge])
def read_badges(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_gamification.get_badges(db, skip=skip, limit=limit)

@router.post("/badges", response_model=Badge)
def create_badge(
    *,
    db: deps.SessionDep,
    badge_in: BadgeCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_gamification.create_badge(db, obj_in=badge_in)

@router.get("/rewards", response_model=List[Reward])
def read_rewards(
    db: deps.SessionDep,
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
):
    return crud_gamification.get_rewards(db, skip=skip, limit=limit)

@router.post("/rewards", response_model=Reward)
def create_reward(
    *,
    db: deps.SessionDep,
    reward_in: RewardCreate,
    current_user = Depends(deps.get_current_active_superuser),
):
    return crud_gamification.create_reward(db, obj_in=reward_in)

@router.get("/leaderboard")
def get_leaderboard(
    db: deps.SessionDep,
    limit: int = 10,
    current_user = Depends(deps.get_current_active_user),
):
    users = db.query(User).order_by(User.xp.desc()).limit(limit).all()
    return [
        {
            "id": u.id,
            "name": u.full_name,
            "department": u.department.name if u.department else "Unassigned",
            "xp": u.xp,
            "badges": 0
        }
        for u in users
    ]

@router.get("/me")
def get_my_stats(
    db: deps.SessionDep,
    current_user = Depends(deps.get_current_active_user),
):
    return {
        "xp": current_user.xp,
        "badges": 0,
        "level": current_user.xp // 1000 + 1
    }
