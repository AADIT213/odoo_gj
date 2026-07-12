from typing import List
from sqlalchemy.orm import Session
from app.models.gamification import Challenge, Badge, Reward
from app.schemas.gamification import ChallengeCreate, BadgeCreate, RewardCreate

def get_challenges(db: Session, skip: int = 0, limit: int = 100) -> List[Challenge]:
    return db.query(Challenge).filter(Challenge.is_active == True).offset(skip).limit(limit).all()

def create_challenge(db: Session, obj_in: ChallengeCreate) -> Challenge:
    db_obj = Challenge(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_badges(db: Session, skip: int = 0, limit: int = 100) -> List[Badge]:
    return db.query(Badge).offset(skip).limit(limit).all()

def create_badge(db: Session, obj_in: BadgeCreate) -> Badge:
    db_obj = Badge(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_rewards(db: Session, skip: int = 0, limit: int = 100) -> List[Reward]:
    return db.query(Reward).offset(skip).limit(limit).all()

def create_reward(db: Session, obj_in: RewardCreate) -> Reward:
    db_obj = Reward(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
