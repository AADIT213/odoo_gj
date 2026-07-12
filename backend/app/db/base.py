from app.db.base_class import Base
from app.models.user import User
from app.models.department import Department
from app.models.environmental import EnvironmentalData, EmissionFactor, SustainabilityGoal, CarbonTransaction
from app.models.social import CSRActivity, EmployeeParticipation, DiversityMetric, TrainingMetric, AuditLog
from app.models.governance import Policy, PolicyAcknowledgement, Audit, ComplianceIssue
from app.models.gamification import Challenge, Badge, UserBadge, Reward, ActivityLog, Redemption
from app.models.notification import Notification
from app.models.esg import ESGWeightConfig

# Import all models here so Alembic or create_all can discover them easily
from app.models.category import Category
