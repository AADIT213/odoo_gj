from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.api import deps
import random

router = APIRouter()

@router.get("/recommendations", response_model=List[Dict[str, Any]])
def get_ai_recommendations(
    department_id: int = None,
    db: deps.SessionDep = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Simulates an AI Sustainability Advisor analyzing ESG data and generating actionable recommendations.
    In a real app, this would call an LLM (e.g. Gemini/OpenAI) with the department's metrics.
    """
    
    recommendations = [
        {
            "id": 1,
            "category": "Environmental",
            "title": "Optimize HVAC Energy Usage",
            "impact": "High",
            "description": "Our AI detected a 15% spike in energy consumption during off-hours. We recommend implementing automated thermostat controls which could save 50 MT CO2e annually.",
            "confidence": 92,
            "action_text": "Schedule HVAC Audit"
        },
        {
            "id": 2,
            "category": "Social",
            "title": "Boost CSR Participation",
            "impact": "Medium",
            "description": "Employee participation in the 'APAC Region' has dropped to 45%. We suggest launching a Gamified Challenge with double XP rewards to boost engagement.",
            "confidence": 88,
            "action_text": "Create Challenge"
        },
        {
            "id": 3,
            "category": "Governance",
            "title": "Pending GDPR Acknowledgements",
            "impact": "Critical",
            "description": "42 employees in Global HQ have not signed the updated Data Privacy framework. Immediate reminder notifications should be dispatched.",
            "confidence": 99,
            "action_text": "Send Reminders"
        }
    ]
    
    # Randomize slightly to feel 'dynamic'
    random.shuffle(recommendations)
    return recommendations
