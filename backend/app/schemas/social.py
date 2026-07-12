from pydantic import BaseModel
from datetime import date
from typing import Optional

class CSRActivityBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "General"
    points_awarded: int = 0
    date: date
    target_participants: int = 0

class CSRActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    points_awarded: Optional[int] = None
    date: Optional[date] = None
    target_participants: Optional[int] = None

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
    proof_url: Optional[str] = None
    points_earned: int = 0
    completion_date: Optional[date] = None

class EmployeeParticipationCreate(EmployeeParticipationBase):
    pass

class EmployeeParticipationUpdate(BaseModel):
    is_approved: Optional[bool] = None
    hours_contributed: Optional[float] = None
    proof_url: Optional[str] = None

class EmployeeParticipation(EmployeeParticipationBase):
    id: int
    is_approved: bool

    class Config:
        from_attributes = True

class DiversityMetricBase(BaseModel):
    department_id: Optional[int] = None
    metric_name: str
    metric_value: float
    date_recorded: date

class DiversityMetricCreate(DiversityMetricBase):
    pass

class DiversityMetric(DiversityMetricBase):
    id: int

    class Config:
        from_attributes = True

class TrainingMetricBase(BaseModel):
    department_id: Optional[int] = None
    course_name: str
    completion_percentage: float
    date_recorded: date

class TrainingMetricCreate(TrainingMetricBase):
    pass

class TrainingMetric(TrainingMetricBase):
    id: int

    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    action: str
    user_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: str

class AuditLogCreate(AuditLogBase):
    pass

class AuditLog(AuditLogBase):
    id: int

    class Config:
        from_attributes = True
