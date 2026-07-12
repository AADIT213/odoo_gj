from pydantic import BaseModel
from datetime import date
from typing import Optional

class CSRActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: date
    target_participants: int = 0

class CSRActivityCreate(CSRActivityBase):
    pass

class CSRActivity(CSRActivityBase):
    id: int

    class Config:
        from_attributes = True

class EmployeeParticipationBase(BaseModel):
    user_id: int
    activity_id: int
    hours_contributed: float = 0.0

class EmployeeParticipationCreate(EmployeeParticipationBase):
    pass

class EmployeeParticipationUpdate(BaseModel):
    is_approved: bool

class EmployeeParticipation(EmployeeParticipationBase):
    id: int
    is_approved: bool

    class Config:
        from_attributes = True
