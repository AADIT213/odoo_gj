# schemas/department.py
from pydantic import BaseModel
from typing import Optional

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    status: str = "Active"
    head_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    env_score: float
    soc_score: float
    gov_score: float
    total_score: float

    class Config:
        from_attributes = True
