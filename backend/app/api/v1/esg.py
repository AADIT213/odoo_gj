from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.esg import ESGWeightConfig as ESGWeightConfigModel
from app.schemas.esg import ESGWeightConfig, ESGWeightConfigUpdate
from app.services import esg_engine

router = APIRouter()


@router.get("/weights", response_model=ESGWeightConfig)
def get_esg_weights(
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    """Return the current global ESG weight configuration."""
    return esg_engine._get_weights(db)


@router.put("/weights", response_model=ESGWeightConfig)
def update_esg_weights(
    *,
    db: deps.SessionDep,
    weights_in: ESGWeightConfigUpdate,
    current_user=Depends(deps.get_current_active_superuser),
):
    """
    Update the global ESG weights. Weights must sum to 1.0.
    Automatically triggers a full recalculation of all department scores.
    """
    total = weights_in.env_weight + weights_in.soc_weight + weights_in.gov_weight
    if round(total, 5) != 1.0:
        raise HTTPException(
            status_code=400,
            detail=f"Weights must sum to 1.0. Got {total:.3f}"
        )

    config = esg_engine._get_weights(db)
    config.env_weight = weights_in.env_weight
    config.soc_weight = weights_in.soc_weight
    config.gov_weight = weights_in.gov_weight
    db.commit()
    db.refresh(config)

    # Recalculate all departments with new weights
    esg_engine.recalculate_all_departments(db)

    return config


@router.post("/recalculate/{department_id}")
def recalculate_department(
    department_id: int,
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    """Manually trigger a recalculation of ESG scores for a specific department."""
    result = esg_engine.recalculate_department_score(db, department_id)
    if not result:
        raise HTTPException(status_code=404, detail="Department not found")
    return {
        "department_id": result.id,
        "department_name": result.name,
        "env_score": result.env_score,
        "soc_score": result.soc_score,
        "gov_score": result.gov_score,
        "total_score": result.total_score,
    }


@router.post("/recalculate-all")
def recalculate_all(
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_superuser),
):
    """Recalculate ESG scores for ALL departments. SuperAdmin only."""
    results = esg_engine.recalculate_all_departments(db)
    return {"recalculated": len(results), "departments": results}


@router.get("/scores")
def get_all_scores(
    db: deps.SessionDep,
    current_user=Depends(deps.get_current_active_user),
):
    """Return current ESG scores for all departments along with the active weights."""
    from app.models.department import Department
    departments = db.query(Department).all()
    weights = esg_engine._get_weights(db)
    return {
        "weights": {
            "env_weight": weights.env_weight,
            "soc_weight": weights.soc_weight,
            "gov_weight": weights.gov_weight,
        },
        "departments": [
            {
                "id": d.id,
                "name": d.name,
                "env_score": d.env_score,
                "soc_score": d.soc_score,
                "gov_score": d.gov_score,
                "total_score": d.total_score,
            }
            for d in departments
        ]
    }
