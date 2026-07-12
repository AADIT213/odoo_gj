"""
conftest.py — pytest fixtures for EcoSphere backend tests.

Uses an in-memory SQLite database (isolated per test session) so tests
never touch the production DB.

httpx 0.28+: ASGITransport is async-only, so API integration tests use
pytest-anyio + httpx.AsyncClient.  Unit-level service tests stay sync
and work with a plain session fixture.
"""
import pytest
import pytest_asyncio
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.api import deps
from app.main import app
from app.models.user import User
from app.core.security import create_access_token, get_password_hash

# ── in-memory test DB ──────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables once per session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db():
    """Return a fresh DB session that's rolled back after each test."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest_asyncio.fixture()
async def async_client(db):
    """
    Async httpx client using ASGITransport (compatible with httpx 0.28+).
    DB dependency is overridden to use the isolated test session.
    """
    def override_get_db():
        yield db

    app.dependency_overrides[deps.get_db] = override_get_db

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def superuser(db) -> User:
    """Create and persist a superuser for use in tests."""
    user = User(
        email="admin@test.com",
        full_name="Test Admin",
        hashed_password=get_password_hash("testpass"),
        role="SuperAdmin",
        is_active=True,
        xp=0,
        level=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def superuser_token_headers(superuser: User) -> dict:
    """Return Authorization headers with a valid JWT for the superuser."""
    token = create_access_token(subject=superuser.id)
    return {"Authorization": f"Bearer {token}"}
