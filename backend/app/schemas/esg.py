from pydantic import BaseModel

class ESGWeightConfigBase(BaseModel):
    env_weight: float = 0.40
    soc_weight: float = 0.30
    gov_weight: float = 0.30
    auto_emission_calc_enabled: bool = False

class ESGWeightConfigUpdate(BaseModel):
    env_weight: float
    soc_weight: float
    gov_weight: float

class ESGWeightConfig(ESGWeightConfigBase):
    id: int
    class Config:
        from_attributes = True

class AppSettings(BaseModel):
    auto_emission_calc_enabled: bool
    evidence_required_enabled: bool = False

    class Config:
        from_attributes = True
