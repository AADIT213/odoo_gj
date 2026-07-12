from pydantic import BaseModel

class ESGWeightConfigBase(BaseModel):
    env_weight: float = 0.40
    soc_weight: float = 0.30
    gov_weight: float = 0.30

class ESGWeightConfigUpdate(BaseModel):
    env_weight: float
    soc_weight: float
    gov_weight: float

class ESGWeightConfig(ESGWeightConfigBase):
    id: int
    class Config:
        from_attributes = True
