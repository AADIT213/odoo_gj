from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.api import deps
import random

router = APIRouter()

@router.get("/recommendations")
def get_ai_recommendations(
    department_id: int = None,
    db: deps.SessionDep = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Simulates an AI Sustainability Advisor analyzing ESG data and generating actionable recommendations, 
    including an Executive Summary and Department-specific recommendations.
    """
    
    global_recommendations = [
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
    
    department_recommendations = [
        {
            "id": 101,
            "department": "Engineering",
            "issue": "High Cloud Computing Emissions",
            "recommendation": "Migrate 30% of non-critical workloads to renewable-powered server regions to improve the department's environmental score by 12 points."
        },
        {
            "id": 102,
            "department": "Human Resources",
            "issue": "Low Diversity & Inclusion Training Completion",
            "recommendation": "Initiate a mandatory workshop by Q3 to boost the Social Score and maintain compliance with the new ESG policy framework."
        }
    ]
    
    executive_summary = (
        "Overall, the organization maintains a strong Governance posture, but Environmental and Social metrics show variance. "
        "Key focus areas for this quarter should be reducing Scope 2 emissions through facility optimizations and increasing "
        "employee participation in CSR initiatives. Addressing these could elevate the total ESG score from 'Needs Improvement' to 'Excellent'."
    )
    
    # Randomize slightly to feel 'dynamic'
    random.shuffle(global_recommendations)
    
    return {
        "executive_summary": executive_summary,
        "department_recommendations": department_recommendations,
        "global_recommendations": global_recommendations
    }
