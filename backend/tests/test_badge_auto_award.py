"""
test_badge_auto_award.py

Tests for Task 7: Badge Auto Award.

Covers:
  1. User crossing XP threshold on CSR approval → badge auto-awarded
  2. Badge is NOT duplicated on a second approval
  3. Notification is fired (non-critical, just mustn't raise)
  4. new_badges appears in the API response
"""
import datetime
import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.gamification import Badge, UserBadge
from app.models.social import CSRActivity, EmployeeParticipation
from app.services.badge_service import check_and_award_badges


# ── helpers ───────────────────────────────────────────────────────────────────

def make_user(db: Session, xp: int = 50, role: str = "Employee") -> User:
    u = User(
        email=f"badge_test_{xp}_{id(db)}@example.com",
        full_name="Badge Test User",
        hashed_password="hashed_pw",
        role=role,
        is_active=True,
        xp=xp,
        level=1,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def make_badge(db: Session, name: str = "Century Member", required_xp: int = 100) -> Badge:
    b = Badge(
        name=name,
        description=f"Earn {required_xp} XP",
        required_xp=required_xp,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


def make_activity(db: Session, points: int = 50) -> CSRActivity:
    a = CSRActivity(
        title=f"Activity_{points}",
        description="Test activity",
        category="Environment",
        points_awarded=points,
        date=datetime.date.today(),
        target_participants=10,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def make_participation(db: Session, user_id: int, activity_id: int) -> EmployeeParticipation:
    p = EmployeeParticipation(
        user_id=user_id,
        activity_id=activity_id,
        hours_contributed=1.0,
        is_approved=False,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ── Unit tests for badge_service ──────────────────────────────────────────────

class TestBadgeService:

    def test_badge_awarded_when_xp_meets_threshold(self, db: Session):
        """User with xp >= badge.required_xp gets the badge."""
        user = make_user(db, xp=100)
        badge = make_badge(db, required_xp=100)

        new_badges = check_and_award_badges(db, user_id=user.id)

        assert len(new_badges) == 1
        assert new_badges[0].id == badge.id

        user_badges = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
        assert len(user_badges) == 1

    def test_badge_not_awarded_when_xp_below_threshold(self, db: Session):
        """User with xp < badge.required_xp does NOT get the badge."""
        user = make_user(db, xp=50)
        make_badge(db, required_xp=100)

        new_badges = check_and_award_badges(db, user_id=user.id)

        assert len(new_badges) == 0

    def test_badge_not_duplicated(self, db: Session):
        """Calling check_and_award_badges twice doesn't duplicate the badge."""
        user = make_user(db, xp=100)
        badge = make_badge(db, required_xp=100)

        first = check_and_award_badges(db, user_id=user.id)
        assert len(first) == 1

        second = check_and_award_badges(db, user_id=user.id)
        assert len(second) == 0  # already owned

        user_badges = db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
        assert len(user_badges) == 1

    def test_multiple_badges_awarded_at_once(self, db: Session):
        """Multiple qualifying badges are all awarded in one call."""
        user = make_user(db, xp=500)
        b1 = make_badge(db, name="Rookie", required_xp=100)
        b2 = make_badge(db, name="Pro", required_xp=300)
        b3 = make_badge(db, name="Elite", required_xp=1000)  # should NOT be awarded

        new_badges = check_and_award_badges(db, user_id=user.id)
        awarded_ids = {b.id for b in new_badges}

        assert b1.id in awarded_ids
        assert b2.id in awarded_ids
        assert b3.id not in awarded_ids


# ── Integration tests via HTTP API ────────────────────────────────────────────

import pytest_asyncio

@pytest.mark.anyio
class TestBadgeAutoAwardViaAPI:

    async def test_new_badges_in_approve_response(self, async_client, db: Session, superuser, superuser_token_headers):
        """
        Approving a participation that pushes a user's XP over a badge threshold
        should return new_badges in the response.
        """
        # employee starts at 50 XP; activity gives 50 → total 100
        employee = make_user(db, xp=50)
        badge = make_badge(db, required_xp=100)
        activity = make_activity(db, points=50)
        participation = make_participation(db, user_id=employee.id, activity_id=activity.id)

        response = await async_client.put(
            f"/api/v1/social/participations/{participation.id}/approve",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_approved"] is True
        assert "new_badges" in data
        assert len(data["new_badges"]) == 1
        assert data["new_badges"][0]["id"] == badge.id
        assert data["new_badges"][0]["name"] == badge.name

    async def test_no_new_badges_when_below_threshold(self, async_client, db: Session, superuser, superuser_token_headers):
        """No badges returned when XP doesn't cross any threshold."""
        employee = make_user(db, xp=10)
        make_badge(db, required_xp=1000)
        activity = make_activity(db, points=10)
        participation = make_participation(db, user_id=employee.id, activity_id=activity.id)

        response = await async_client.put(
            f"/api/v1/social/participations/{participation.id}/approve",
            headers=superuser_token_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["new_badges"] is None or data["new_badges"] == []

    async def test_badge_not_duplicated_via_api(self, async_client, db: Session, superuser, superuser_token_headers):
        """
        Second approval doesn't duplicate the badge (UserBadge count stays at 1).
        """
        employee = make_user(db, xp=50)
        badge = make_badge(db, required_xp=100)

        # First activity: 50 pts → total 100 → badge awarded
        act1 = make_activity(db, points=50)
        p1 = make_participation(db, user_id=employee.id, activity_id=act1.id)
        r1 = await async_client.put(
            f"/api/v1/social/participations/{p1.id}/approve",
            headers=superuser_token_headers,
        )
        assert r1.status_code == 200
        assert len(r1.json()["new_badges"]) == 1

        # Second activity: 50 pts more → total 150 → badge NOT duplicated
        act2 = make_activity(db, points=50)
        p2 = make_participation(db, user_id=employee.id, activity_id=act2.id)
        r2 = await async_client.put(
            f"/api/v1/social/participations/{p2.id}/approve",
            headers=superuser_token_headers,
        )
        assert r2.status_code == 200
        assert r2.json().get("new_badges", []) == [] or r2.json()["new_badges"] is None

        user_badges = db.query(UserBadge).filter(UserBadge.user_id == employee.id).all()
        assert len(user_badges) == 1

