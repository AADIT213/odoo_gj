"""
Notification Service — typed helpers for creating notifications from any module.
Each helper encapsulates the type, priority, and message format for a specific event.
Import this service in API route handlers — do NOT call crud_notification directly
from service layers to avoid circular imports.
"""
from sqlalchemy.orm import Session
from app.crud import crud_notification
from app.schemas.notification import NotificationCreate


def _send(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
    type: str,
    priority: str = "Medium",
    action_url: str = None,
) -> None:
    """Internal helper — fire and forget a notification."""
    try:
        notif = NotificationCreate(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            priority=priority,
            action_url=action_url,
        )
        crud_notification.create_notification(db, obj_in=notif)
    except Exception:
        # Notifications are non-critical — never let them break the main flow
        pass


# ─── Gamification ────────────────────────────────────────────────────────────

def send_reward_redeemed(db: Session, user_id: int, reward_title: str, xp_cost: int) -> None:
    _send(
        db,
        user_id=user_id,
        title="🎁 Reward Redeemed!",
        message=f"You successfully redeemed '{reward_title}' for {xp_cost} XP.",
        type="Gamification",
        priority="Medium",
        action_url="/rewards",
    )


def send_badge_unlocked(db: Session, user_id: int, badge_name: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="🏅 Badge Unlocked!",
        message=f"Congratulations! You've earned the '{badge_name}' badge.",
        type="Gamification",
        priority="High",
        action_url="/gamification",
    )


def send_challenge_assigned(db: Session, user_id: int, challenge_title: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="🎯 New Challenge Assigned",
        message=f"A new challenge has been created: '{challenge_title}'. Complete it to earn XP!",
        type="Gamification",
        priority="Medium",
        action_url="/gamification",
    )


def send_challenge_completed(db: Session, user_id: int, challenge_title: str, xp: int) -> None:
    _send(
        db,
        user_id=user_id,
        title="✅ Challenge Completed!",
        message=f"You completed '{challenge_title}' and earned {xp} XP.",
        type="Gamification",
        priority="High",
        action_url="/gamification",
    )


# ─── Social ──────────────────────────────────────────────────────────────────

def send_csr_approved(db: Session, user_id: int, activity_title: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="✅ CSR Activity Approved",
        message=f"Your participation in '{activity_title}' has been approved.",
        type="Social",
        priority="High",
        action_url="/social",
    )


def send_csr_rejected(db: Session, user_id: int, activity_title: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="❌ CSR Activity Rejected",
        message=f"Your participation in '{activity_title}' was not approved. Please contact your manager.",
        type="Social",
        priority="High",
        action_url="/social",
    )


# ─── Governance ───────────────────────────────────────────────────────────────

def send_policy_assigned(db: Session, user_id: int, policy_title: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="📋 Policy Requires Acknowledgement",
        message=f"A new policy '{policy_title}' has been published and requires your acknowledgement.",
        type="Governance",
        priority="High",
        action_url="/governance",
    )


def send_audit_assigned(db: Session, user_id: int, audit_title: str, dept: str = None) -> None:
    dept_info = f" for department '{dept}'" if dept else ""
    _send(
        db,
        user_id=user_id,
        title="🔍 Audit Scheduled",
        message=f"A new audit '{audit_title}'{dept_info} has been scheduled. Please prepare relevant documentation.",
        type="Governance",
        priority="Critical",
        action_url="/governance",
    )


def send_compliance_issue_created(db: Session, user_id: int, issue_title: str, severity: str = "Medium") -> None:
    priority = "Critical" if severity in ["High", "Critical"] else "High"
    _send(
        db,
        user_id=user_id,
        title="⚠️ Compliance Issue Raised",
        message=f"A compliance issue '{issue_title}' has been created and requires attention.",
        type="Governance",
        priority=priority,
        action_url="/governance",
    )


def send_compliance_issue_resolved(db: Session, user_id: int, issue_title: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="✅ Compliance Issue Resolved",
        message=f"The compliance issue '{issue_title}' has been marked as resolved.",
        type="Governance",
        priority="Medium",
        action_url="/governance",
    )


# ─── Environmental ────────────────────────────────────────────────────────────

def send_esg_goal_achieved(db: Session, user_id: int, goal_name: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="🌱 ESG Goal Achieved!",
        message=f"Your department has achieved the sustainability goal: '{goal_name}'.",
        type="Environmental",
        priority="High",
        action_url="/environmental",
    )


def send_esg_goal_missed(db: Session, user_id: int, goal_name: str) -> None:
    _send(
        db,
        user_id=user_id,
        title="📉 ESG Goal Missed",
        message=f"The sustainability goal '{goal_name}' was not met this period. Review your targets.",
        type="Environmental",
        priority="High",
        action_url="/environmental",
    )


def send_dept_esg_score_updated(db: Session, user_id: int, dept_name: str, new_score: float) -> None:
    _send(
        db,
        user_id=user_id,
        title="📊 Department ESG Score Updated",
        message=f"The ESG score for '{dept_name}' has been updated to {new_score:.1f}.",
        type="Environmental",
        priority="Low",
        action_url="/departments",
    )


# ─── System ───────────────────────────────────────────────────────────────────

def send_system_announcement(db: Session, user_id: int, title: str, message: str) -> None:
    _send(
        db,
        user_id=user_id,
        title=f"📣 {title}",
        message=message,
        type="System",
        priority="Medium",
    )
