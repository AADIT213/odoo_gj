from sqlalchemy import Column, Integer, Float
from app.db.base_class import Base

class ESGWeightConfig(Base):
    id = Column(Integer, primary_key=True, index=True)
    env_weight = Column(Float, default=0.40)
    soc_weight = Column(Float, default=0.30)
    gov_weight = Column(Float, default=0.30)
