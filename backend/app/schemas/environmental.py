from pydantic import BaseModel
from datetime import date
from typing import Optional

class EnvironmentalDataBase(BaseModel):
    department_id: int
    date_recorded: date
    energy_usage_kwh: float = 0.0
    water_usage_liters: float = 0.0
    waste_generated_kg: float = 0.0
    waste_recycled_kg: float = 0.0

class EnvironmentalDataCreate(EnvironmentalDataBase):
    pass

class EnvironmentalDataUpdate(EnvironmentalDataBase):
    status: Optional[str] = None

class EnvironmentalData(EnvironmentalDataBase):
    id: int
    carbon_emissions_mt: float
    status: str

    class Config:
        from_attributes = True

class EmissionFactorBase(BaseModel):
    source_type: str
    factor: float

class EmissionFactorCreate(EmissionFactorBase):
    pass

class EmissionFactor(EmissionFactorBase):
    id: int

    class Config:
        from_attributes = True

class SustainabilityGoalBase(BaseModel):
    department_id: int
    title: str
    target_reduction_percent: float
    deadline: date
    status: str = "In Progress"

class SustainabilityGoalCreate(SustainabilityGoalBase):
    pass

class SustainabilityGoal(SustainabilityGoalBase):
    id: int

    class Config:
        from_attributes = True

class CarbonTransactionBase(BaseModel):
    department_id: int
    transaction_type: str
    amount_mt: float
    date: date
    description: Optional[str] = None

class CarbonTransactionCreate(CarbonTransactionBase):
    pass

class CarbonTransaction(CarbonTransactionBase):
    id: int

    class Config:
        from_attributes = True
