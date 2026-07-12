from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class EnvironmentalData(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    date_recorded = Column(Date, nullable=False)
    
    # Core Metrics
    energy_usage_kwh = Column(Float, default=0.0)
    water_usage_liters = Column(Float, default=0.0)
    waste_generated_kg = Column(Float, default=0.0)
    waste_recycled_kg = Column(Float, default=0.0)
    
    # Calculated Emissions (Carbon Footprint)
    carbon_emissions_mt = Column(Float, default=0.0)
    
    status = Column(String, default="Pending") # Pending, Approved, Rejected

    # Relationships
    department = relationship("Department")

class EmissionFactor(Base):
    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, index=True) # e.g., "Electricity", "Water", "Gas"
    factor = Column(Float, nullable=False)   # Multiplier to get CO2 equivalent

class SustainabilityGoal(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    title = Column(String, nullable=False)
    target_reduction_percent = Column(Float, nullable=False)
    deadline = Column(Date, nullable=False)
    status = Column(String, default="In Progress") # In Progress, Achieved, Failed

class CarbonTransaction(Base):
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("department.id"), nullable=False)
    transaction_type = Column(String) # "Credit", "Offset"
    amount_mt = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String)

