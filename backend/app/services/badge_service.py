import datetime
from sqlalchemy.orm import Session
from app.models.gamification import Badge, UserBadge
from app.models.user import User
from app.services import notification_service

def check_and_award_badges(db: Session, user_id: int) -> list[Badge]:
    """
    Checks if the user qualifies for any new badges based on their current XP.
    Awards the badges, fires a notification, and returns the list of newly awarded badges.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []

    # Get all badges the user does not currently own
    owned_badge_ids = [
        ub.badge_id for ub in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
    ]
    
    # Check what they qualify for
    available_badges = db.query(Badge).filter(
        Badge.required_xp <= user.xp,
        Badge.id.notin_(owned_badge_ids) if owned_badge_ids else True
    ).all()

    new_badges = []
    for badge in available_badges:
        # Create UserBadge row
        user_badge = UserBadge(
            user_id=user.id,
            badge_id=badge.id,
            date_earned=datetime.date.today()
        )
        db.add(user_badge)
        
        # Call notification service
        notification_service.send_badge_unlocked(db, user_id=user.id, badge_name=badge.name)
        new_badges.append(badge)

    if new_badges:
        db.commit()

    return new_badges
