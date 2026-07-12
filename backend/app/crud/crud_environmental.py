from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.environmental import EnvironmentalData, EmissionFactor, SustainabilityGoal, CarbonTransaction
from app.schemas.environmental import EnvironmentalDataCreate, EnvironmentalDataUpdate, EmissionFactorCreate, SustainabilityGoalCreate, CarbonTransactionCreate

def get_environmental_data(db: Session, skip: int = 0, limit: int = 100) -> List[EnvironmentalData]:
    return db.query(EnvironmentalData).offset(skip).limit(limit).all()

def get_environmental_data_by_dept(db: Session, dept_id: int) -> List[EnvironmentalData]:
    return db.query(EnvironmentalData).filter(EnvironmentalData.department_id == dept_id).all()

def calculate_emissions(db: Session, data: EnvironmentalDataCreate) -> float:
    # Pull factors from DB or fallback
    elec = db.query(EmissionFactor).filter(EmissionFactor.resource_type == "Electricity").first()
    water = db.query(EmissionFactor).filter(EmissionFactor.resource_type == "Water").first()
    waste = db.query(EmissionFactor).filter(EmissionFactor.resource_type == "Waste").first()
    
    electricity_factor = elec.factor if elec else 0.5 # kg CO2e per kWh
    water_factor = water.factor if water else 0.001     # kg CO2e per liter
    waste_factor = waste.factor if waste else 2.5       # kg CO2e per kg waste
    
    emissions = (
        (data.energy_usage_kwh * electricity_factor) +
        (data.water_usage_liters * water_factor) +
        ((data.waste_generated_kg - data.waste_recycled_kg) * waste_factor)
    )
    return emissions / 1000.0 # Convert to metric tons (MT)

def create_environmental_data(db: Session, obj_in: EnvironmentalDataCreate) -> EnvironmentalData:
    emissions = calculate_emissions(db, obj_in)
    db_obj = EnvironmentalData(
        department_id=obj_in.department_id,
        date_recorded=obj_in.date_recorded,
        energy_usage_kwh=obj_in.energy_usage_kwh,
        water_usage_liters=obj_in.water_usage_liters,
        waste_generated_kg=obj_in.waste_generated_kg,
        waste_recycled_kg=obj_in.waste_recycled_kg,
        carbon_emissions_mt=emissions,
        status="Pending"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_environmental_data_status(db: Session, data_id: int, status: str) -> Optional[EnvironmentalData]:
    db_obj = db.query(EnvironmentalData).filter(EnvironmentalData.id == data_id).first()
    if db_obj:
        db_obj.status = status
        db.commit()
        db.refresh(db_obj)
    return db_obj

def get_sustainability_goals(db: Session, department_id: Optional[int] = None) -> List[SustainabilityGoal]:
    query = db.query(SustainabilityGoal)
    if department_id:
        query = query.filter(SustainabilityGoal.department_id == department_id)
    return query.all()

def create_sustainability_goal(db: Session, obj_in: SustainabilityGoalCreate) -> SustainabilityGoal:
    db_obj = SustainabilityGoal(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_carbon_transactions(db: Session, department_id: Optional[int] = None) -> List[CarbonTransaction]:
    query = db.query(CarbonTransaction)
    if department_id:
        query = query.filter(CarbonTransaction.department_id == department_id)
    return query.all()

def create_carbon_transaction(db: Session, obj_in: CarbonTransactionCreate) -> CarbonTransaction:
    db_obj = CarbonTransaction(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
