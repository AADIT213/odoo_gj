# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from sqlalchemy import update
from fastapi import HTTPException
from app.models.gamification import Reward, Redemption
from app.models.user import User
from app.services import notification_service

def redeem_reward(db: Session, user_id: int, reward_id: int) -> Redemption:
    result = db.execute(
        update(Reward)
        .where(Reward.id == reward_id, Reward.stock > 0, Reward.status == "active")
        .values(stock=Reward.stock - 1)
    )
    if result.rowcount == 0:
        reward = db.get(Reward, reward_id)
        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found")
        if reward.status != "active":
            raise HTTPException(status_code=400, detail="Reward is not currently available")
        raise HTTPException(status_code=400, detail="Reward is out of stock")
        
    reward = db.get(Reward, reward_id)
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.xp < reward.cost_xp:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Insufficient XP: need {reward.cost_xp}, have {user.xp}")
        
    # Validated: deduct XP
    user.xp -= reward.cost_xp
    
    redemption = Redemption(
        user_id=user_id,
        reward_id=reward_id,
        xp_used=reward.cost_xp,
        status="fulfilled"
    )
    db.add(redemption)
    
    # Send notification via typed helper
    notification_service.send_reward_redeemed(db, user_id=user_id, reward_title=reward.title, xp_cost=reward.cost_xp)
    
    db.commit()
    db.refresh(user)
    db.refresh(reward)
    db.refresh(redemption)
    
    return redemption
