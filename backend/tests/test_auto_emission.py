"""
test_auto_emission.py

Tests for the auto emission calculation service.

Covers:
1. Math is correct: co2e = quantity * factor.
2. Manual carbon entry (create_carbon_transaction) is unaffected when toggle is OFF.
3. Missing EmissionFactor returns a clean 400 HTTPException.
4. Auto-calc with toggle OFF returns a clean 400 HTTPException.
"""
import datetime
import pytest
from fastapi import HTTPException

from app.services.emission_service import calculate_carbon_transaction, get_settings
from app.models.environmental import EmissionFactor, CarbonTransaction
from app.crud.crud_environmental import create_carbon_transaction
from app.schemas.environmental import CarbonTransactionCreate


# ── Helpers ───────────────────────────────────────────────────────────────────

def _enable_toggle(db):
    """Enable the auto-calc toggle on the singleton config row."""
    settings = get_settings(db)
    settings.auto_emission_calc_enabled = True
    db.commit()
    db.refresh(settings)
    return settings


def _disable_toggle(db):
    """Disable the auto-calc toggle on the singleton config row."""
    settings = get_settings(db)
    settings.auto_emission_calc_enabled = False
    db.commit()
    db.refresh(settings)
    return settings


def _add_factor(db, source_type: str, factor: float) -> EmissionFactor:
    ef = EmissionFactor(source_type=source_type, factor=factor)
    db.add(ef)
    db.commit()
    db.refresh(ef)
    return ef


def _add_department(db):
    from app.models.department import Department
    dept = Department(name="Test Dept")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestAutoCalcMath:
    """Auto-calc math: co2e = quantity * factor."""

    def test_correct_co2e_calculation(self, db):
        """co2e_mt must equal quantity * emission_factor."""
        dept = _add_department(db)
        _add_factor(db, "Purchase", 2.5)   # 2.5 MT CO2e per unit
        _enable_toggle(db)

        tx = calculate_carbon_transaction(
            db=db,
            source_type="Purchase",
            quantity=10.0,
            unit="kg",
            department_id=dept.id,
            transaction_type="Credit",
            date=datetime.date.today(),
        )

        assert tx.id is not None
        assert tx.amount_mt == pytest.approx(25.0)   # 10.0 * 2.5
        assert tx.calculation_method == "Auto"
        assert tx.unit == "kg"

    def test_co2e_with_fractional_factor(self, db):
        """Fractional factors are handled correctly."""
        dept = _add_department(db)
        _add_factor(db, "Expense", 0.233)
        _enable_toggle(db)

        tx = calculate_carbon_transaction(
            db=db,
            source_type="Expense",
            quantity=100.0,
            unit="USD",
            department_id=dept.id,
            date=datetime.date.today(),
        )

        assert tx.amount_mt == pytest.approx(23.3)   # 100.0 * 0.233

    def test_transaction_persisted_in_db(self, db):
        """Auto-calc row must be readable back from the database."""
        dept = _add_department(db)
        _add_factor(db, "Fleet", 1.0)
        _enable_toggle(db)

        tx = calculate_carbon_transaction(
            db=db,
            source_type="Fleet",
            quantity=5.0,
            unit="km",
            department_id=dept.id,
            date=datetime.date.today(),
        )

        from_db = db.query(CarbonTransaction).filter(CarbonTransaction.id == tx.id).first()
        assert from_db is not None
        assert from_db.calculation_method == "Auto"
        assert from_db.amount_mt == pytest.approx(5.0)

    def test_case_insensitive_source_type_lookup(self, db):
        """source_type lookup is case-insensitive."""
        dept = _add_department(db)
        _add_factor(db, "Manufacturing", 3.0)
        _enable_toggle(db)

        tx = calculate_carbon_transaction(
            db=db,
            source_type="manufacturing",  # lowercase
            quantity=2.0,
            unit="units",
            department_id=dept.id,
            date=datetime.date.today(),
        )

        assert tx.amount_mt == pytest.approx(6.0)


class TestManualEntryUnaffected:
    """Manual carbon entry must work regardless of the toggle state."""

    def test_manual_create_works_when_toggle_off(self, db):
        """The existing crud create_carbon_transaction path is not guarded by toggle."""
        dept = _add_department(db)
        _disable_toggle(db)

        tx_in = CarbonTransactionCreate(
            department_id=dept.id,
            transaction_type="Credit",
            amount_mt=42.0,
            date=datetime.date.today(),
            description="Manual entry test",
        )
        tx = create_carbon_transaction(db, obj_in=tx_in)

        assert tx.id is not None
        assert tx.amount_mt == 42.0
        # Default calculation_method should be "Manual"
        assert tx.calculation_method == "Manual"

    def test_manual_create_works_when_toggle_on(self, db):
        """Manual entry also works when toggle is ON (no interference)."""
        dept = _add_department(db)
        _enable_toggle(db)

        tx_in = CarbonTransactionCreate(
            department_id=dept.id,
            transaction_type="Offset",
            amount_mt=10.0,
            date=datetime.date.today(),
        )
        tx = create_carbon_transaction(db, obj_in=tx_in)

        assert tx.id is not None
        assert tx.amount_mt == 10.0


class TestMissingEmissionFactor:
    """Missing EmissionFactor must yield a clean 400, not a crash."""

    def test_missing_factor_raises_400(self, db):
        """HTTPException 400 with descriptive message when no factor found."""
        dept = _add_department(db)
        _enable_toggle(db)
        # Intentionally no EmissionFactor added for "UnknownSource"

        with pytest.raises(HTTPException) as exc_info:
            calculate_carbon_transaction(
                db=db,
                source_type="UnknownSource",
                quantity=1.0,
                unit="units",
                department_id=dept.id,
                date=datetime.date.today(),
            )

        assert exc_info.value.status_code == 400
        assert "UnknownSource" in str(exc_info.value.detail)
        assert "emission factor" in str(exc_info.value.detail).lower()

    def test_toggle_off_raises_400(self, db):
        """HTTPException 400 when toggle is disabled, even if factor exists."""
        dept = _add_department(db)
        _add_factor(db, "Purchase", 1.0)
        _disable_toggle(db)

        with pytest.raises(HTTPException) as exc_info:
            calculate_carbon_transaction(
                db=db,
                source_type="Purchase",
                quantity=5.0,
                unit="kg",
                department_id=dept.id,
                date=datetime.date.today(),
            )

        assert exc_info.value.status_code == 400
        assert "disabled" in str(exc_info.value.detail).lower()
