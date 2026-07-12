import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from app.db.base_class import Base
from app.models.gamification import Reward, Redemption
from app.models.user import User
from app.services.redemption_service import redeem_reward
import threading
from sqlalchemy.pool import StaticPool
import app.db.base
import os

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_redemption.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    if os.path.exists("./test_redemption.db"):
        try:
            os.remove("./test_redemption.db")
        except:
            pass
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()
        if os.path.exists("./test_redemption.db"):
            try:
                os.remove("./test_redemption.db")
            except:
                pass

def test_successful_redemption(db):
    user = User(email="test@test.com", hashed_password="pw", full_name="Test", xp=500)
    reward = Reward(title="Test Reward", cost_xp=200, stock=5, status="active")
    db.add(user)
    db.add(reward)
    db.commit()
    db.refresh(user)
    db.refresh(reward)
    
    redemption = redeem_reward(db, user_id=user.id, reward_id=reward.id)
    
    assert redemption.xp_used == 200
    assert redemption.status == "fulfilled"
    
    db.refresh(user)
    db.refresh(reward)
    assert user.xp == 300
    assert reward.stock == 4

def test_insufficient_xp(db):
    user = User(email="test@test.com", hashed_password="pw", full_name="Test", xp=100)
    reward = Reward(title="Test Reward", cost_xp=200, stock=5, status="active")
    db.add(user)
    db.add(reward)
    db.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        redeem_reward(db, user_id=user.id, reward_id=reward.id)
    
    assert excinfo.value.status_code == 400
    assert "Insufficient XP" in excinfo.value.detail
    
    db.refresh(user)
    db.refresh(reward)
    assert user.xp == 100
    assert reward.stock == 5

def test_out_of_stock(db):
    user = User(email="test@test.com", hashed_password="pw", full_name="Test", xp=500)
    reward = Reward(title="Test Reward", cost_xp=200, stock=0, status="active")
    db.add(user)
    db.add(reward)
    db.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        redeem_reward(db, user_id=user.id, reward_id=reward.id)
    
    assert excinfo.value.status_code == 400
    assert "out of stock" in excinfo.value.detail

def test_inactive_reward(db):
    user = User(email="test@test.com", hashed_password="pw", full_name="Test", xp=500)
    reward = Reward(title="Test Reward", cost_xp=200, stock=5, status="inactive")
    db.add(user)
    db.add(reward)
    db.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        redeem_reward(db, user_id=user.id, reward_id=reward.id)
    
    assert excinfo.value.status_code == 400
    assert "not currently available" in excinfo.value.detail

def test_concurrent_redemptions(db):
    user1 = User(email="test1@test.com", hashed_password="pw", full_name="Test1", xp=500)
    user2 = User(email="test2@test.com", hashed_password="pw", full_name="Test2", xp=500)
    reward = Reward(title="Test Reward", cost_xp=200, stock=1, status="active")
    db.add(user1)
    db.add(user2)
    db.add(reward)
    db.commit()
    
    results = []
    
    def attempt_redeem(user_id):
        session = TestingSessionLocal()
        try:
            res = redeem_reward(session, user_id=user_id, reward_id=reward.id)
            results.append("success")
        except HTTPException as e:
            results.append("error")
        except Exception as e:
            print(f"EXCEPTION: {type(e)} - {e}")
            results.append("error")
        finally:
            session.close()

    t1 = threading.Thread(target=attempt_redeem, args=(user1.id,))
    t2 = threading.Thread(target=attempt_redeem, args=(user2.id,))
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()
    
    assert results.count("success") == 1
    assert results.count("error") == 1


