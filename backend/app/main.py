from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.base import Base
from app.db.session import engine

# Create tables for dev
Base.metadata.create_all(bind=engine)

# Idempotent column migration for SQLite (no Alembic).
# Safely adds new notification columns if they don't exist yet.
def _run_notification_migrations():
    from sqlalchemy import text
    new_cols = [
        ("priority", "VARCHAR DEFAULT 'Medium'"),
        ("action_url", "VARCHAR"),
        ("meta", "TEXT"),
    ]
    with engine.connect() as conn:
        for col_name, col_def in new_cols:
            try:
                conn.execute(text(f"ALTER TABLE notification ADD COLUMN {col_name} {col_def}"))
                conn.commit()
            except Exception:
                pass  # Column already exists — safe to ignore

_run_notification_migrations()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to EcoSphere API"}
