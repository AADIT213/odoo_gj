"""
emission_service.py
Auto-emission calculation service.

calculate_carbon_transaction:
  - Looks up an EmissionFactor by source_type (case-insensitive match).
  - Computes co2e = quantity * factor (result in MT already since factors
    are defined in MT-equivalent per unit).
  - Creates a CarbonTransaction with calculation_method="Auto".
  - Raises HTTPException 400 if the toggle is OFF or no factor found.
  - DOES NOT touch the manual create_carbon_transaction path.
"""
import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.environmental import EmissionFactor, CarbonTransaction
from app.models.esg import ESGWeightConfig


def get_settings(db: Session) -> ESGWeightConfig:
    """Return the single global config row, creating defaults if absent."""
    config = db.query(ESGWeightConfig).first()
    if not config:
        config = ESGWeightConfig(
            env_weight=0.40,
            soc_weight=0.30,
            gov_weight=0.30,
            auto_emission_calc_enabled=False,
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def calculate_carbon_transaction(
    db: Session,
    source_type: str,
    quantity: float,
    unit: str,
    department_id: int,
    transaction_type: str = "Credit",
    date: datetime.date | None = None,
    description: str | None = None,
) -> CarbonTransaction:
    """
    Look up an EmissionFactor for source_type, compute co2e = quantity * factor,
    and persist a CarbonTransaction with calculation_method='Auto'.

    Raises:
        HTTPException 400 – if auto-calc is disabled globally.
        HTTPException 400 – if no EmissionFactor exists for the given source_type.
    """
    # Guard: toggle must be ON
    settings = get_settings(db)
    if not settings.auto_emission_calc_enabled:
        raise HTTPException(
            status_code=400,
            detail="Auto emission calculation is currently disabled. Enable it in Settings.",
        )

    # Look up factor (case-insensitive)
    factor_row = (
        db.query(EmissionFactor)
        .filter(EmissionFactor.source_type.ilike(source_type))
        .first()
    )
    if factor_row is None:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No emission factor found for source_type='{source_type}'. "
                f"Please add an EmissionFactor entry for this source type before proceeding."
            ),
        )

    co2e_mt = round(quantity * factor_row.factor, 6)
    tx_date = date or datetime.date.today()

    transaction = CarbonTransaction(
        department_id=department_id,
        transaction_type=transaction_type,
        amount_mt=co2e_mt,
        date=tx_date,
        description=description or f"Auto-calculated from {source_type} ({quantity} {unit})",
        calculation_method="Auto",
        unit=unit,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction
