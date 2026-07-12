from sqlalchemy import Column, Integer, String
from app.db.base_class import Base

class Category(Base):
    __tablename__ = "category"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=True)  # e.g., Environmental, Social, Governance
    status = Column(String, default="active")
