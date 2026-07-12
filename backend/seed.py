import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.crud import crud_user, crud_social, crud_gamification, crud_governance
from app.schemas.user import UserCreate
from app.schemas.social import CSRActivityCreate, EmployeeParticipationCreate
from app.schemas.gamification import ChallengeCreate, BadgeCreate, RewardCreate
from app.schemas.governance import PolicyCreate, PolicyAcknowledgementCreate, AuditCreate, ComplianceIssueCreate
from app.models.department import Department
from app.models.user import User
from app.models.gamification import Reward, Badge, Challenge, UserBadge
from app.models.social import CSRActivity, EmployeeParticipation
from app.models.governance import Policy, PolicyAcknowledgement, Audit, ComplianceIssue
from app.models.environmental import EmissionFactor, CarbonTransaction

def seed_db():
    db = SessionLocal()
    
    # Run SQLite migration for Reward table to prevent OperationalError if old DB exists
    from sqlalchemy import text
    try:
        with db.get_bind().connect() as conn:
            conn.execute(text("ALTER TABLE reward ADD COLUMN category VARCHAR"))
            conn.execute(text("ALTER TABLE reward ADD COLUMN image_url VARCHAR"))
            conn.execute(text("ALTER TABLE reward ADD COLUMN status VARCHAR DEFAULT 'active'"))
            conn.execute(text("ALTER TABLE reward ADD COLUMN created_at DATETIME"))
            conn.commit()
    except Exception:
        pass
    
    # 1. Departments
    dept_names = ["Global HQ", "APAC Region", "Manufacturing Division"]
    depts = {}
    for dname in dept_names:
        dept = db.query(Department).filter(Department.name == dname).first()
        if not dept:
            dept = Department(name=dname, description=f"{dname} Description", env_score=85.0, soc_score=90.0, gov_score=88.0, total_score=87.5)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        depts[dname] = dept
    print("1. Departments seeded.")

    # 2. Users
    users_data = [
        {"email": "admin@ecosphere.com", "name": "Super Admin", "role": "SuperAdmin", "dept": "Global HQ"},
        {"email": "manager@ecosphere.com", "name": "ESG Manager", "role": "Manager", "dept": "Global HQ"},
        {"email": "head@ecosphere.com", "name": "Department Head", "role": "DeptHead", "dept": "APAC Region"},
        {"email": "employee@ecosphere.com", "name": "Standard Employee", "role": "Employee", "dept": "Manufacturing Division"}
    ]
    users = {}
    for ud in users_data:
        user = crud_user.get_user_by_email(db, email=ud["email"])
        if not user:
            user_in = UserCreate(
                email=ud["email"],
                password="adminpassword",
                full_name=ud["name"],
                role=ud["role"],
                department_id=depts[ud["dept"]].id
            )
            user = crud_user.create_user(db, user_in=user_in)
            
            if ud["role"] == "Employee":
                user.xp = 120
                user.level = 1
                db.commit()
                db.refresh(user)
        users[ud["role"]] = user
    print("2. Users seeded.")

    # 4. EmissionFactor (No Category required in Step 3 based on models, Category is just a string column)
    factors_data = [
        {"source_type": "Electricity (Grid)", "factor": 0.82},
        {"source_type": "Diesel", "factor": 2.68},
        {"source_type": "Flight (Short Haul)", "factor": 0.15},
        {"source_type": "Water Supply", "factor": 0.0003},
        {"source_type": "Waste Disposal", "factor": 0.44}
    ]
    for fd in factors_data:
        factor = db.query(EmissionFactor).filter(EmissionFactor.source_type == fd["source_type"]).first()
        if not factor:
            factor = EmissionFactor(source_type=fd["source_type"], factor=fd["factor"])
            db.add(factor)
            db.commit()
    print("4. EmissionFactors seeded.")

    # 5. CarbonTransaction
    ct_count = db.query(CarbonTransaction).count()
    if ct_count == 0:
        for i in range(15):
            txn = CarbonTransaction(
                department_id=depts["Global HQ"].id,
                transaction_type="Credit" if i % 3 == 0 else "Offset",
                amount_mt=float(10 + i),
                date=datetime.date.today() - datetime.timedelta(days=i*5),
                description=f"Transaction {i}"
            )
            db.add(txn)
        db.commit()
    print("5. CarbonTransactions seeded.")

    # 6. ESG Policy & Acknowledgement
    policies_data = ["Code of Conduct", "Environmental Policy", "Data Privacy", "Supplier Code", "Health & Safety"]
    for title in policies_data:
        policy = db.query(Policy).filter(Policy.title == title).first()
        if not policy:
            p_in = PolicyCreate(title=title, description=f"{title} description", document_url="http://example.com/doc", is_active=True)
            policy = crud_governance.create_policy(db, obj_in=p_in)
    
    ack_count = db.query(PolicyAcknowledgement).count()
    if ack_count == 0:
        p1 = db.query(Policy).first()
        if p1:
            crud_governance.acknowledge_policy(db, obj_in=PolicyAcknowledgementCreate(
                user_id=users["Employee"].id,
                policy_id=p1.id,
                date_acknowledged=datetime.date.today()
            ))
    print("6. Policies and Acknowledgements seeded.")

    # 7. Audit & ComplianceIssue
    audits_data = ["Q1 Environmental Audit", "Q2 Social Audit", "Annual Governance Audit"]
    for title in audits_data:
        audit = db.query(Audit).filter(Audit.auditor_name == title).first()
        if not audit:
            a_in = AuditCreate(department_id=depts["Global HQ"].id, auditor_name=title, audit_date=datetime.date.today(), status="Pending", findings="None")
            crud_governance.create_audit(db, obj_in=a_in)

    issue_count = db.query(ComplianceIssue).count()
    if issue_count == 0:
        i_in1 = ComplianceIssueCreate(department_id=depts["Global HQ"].id, owner_id=users["Manager"].id, title="Missing Safety Gear", description="Safety issue", severity="High", status="Open", due_date=datetime.date.today() - datetime.timedelta(days=5))
        i_in2 = ComplianceIssueCreate(department_id=depts["APAC Region"].id, owner_id=users["DeptHead"].id, title="Water Leak", description="Water issue", severity="Medium", status="Resolved", due_date=datetime.date.today() + datetime.timedelta(days=5))
        crud_governance.create_compliance_issue(db, obj_in=i_in1)
        crud_governance.create_compliance_issue(db, obj_in=i_in2)
    print("7. Audits and Compliance Issues seeded.")

    # 8. CSR Activity & Participation
    csr_titles = [f"Beach Cleanup {i}" for i in range(1, 9)]
    for title in csr_titles:
        csr = db.query(CSRActivity).filter(CSRActivity.title == title).first()
        if not csr:
            csr_in = CSRActivityCreate(title=title, description="Description", category="Environment", points_awarded=50, date=datetime.date.today(), target_participants=10)
            crud_social.create_activity(db, obj_in=csr_in)
            
    part_count = db.query(EmployeeParticipation).count()
    if part_count == 0:
        c1 = db.query(CSRActivity).first()
        if c1:
            p_in = EmployeeParticipationCreate(user_id=users["Employee"].id, activity_id=c1.id, hours_contributed=2.0, proof_url="http://example.com/proof", points_earned=50, completion_date=datetime.date.today())
            crud_social.create_participation(db, obj_in=p_in)
    print("8. CSR Activities and Participations seeded.")

    # 9. Challenge
    challenges_data = ["Plant Trees", "Zero Waste Week", "Carpool Challenge", "Energy Saver"]
    for title in challenges_data:
        c = db.query(Challenge).filter(Challenge.title == title).first()
        if not c:
            c_in = ChallengeCreate(title=title, description="Challenge desc", xp_reward=100, category="Environment", deadline=datetime.date.today() + datetime.timedelta(days=10), is_active=True)
            crud_gamification.create_challenge(db, obj_in=c_in)
    print("9. Challenges seeded.")

    # 10. Badge
    badges_data = [("Bronze", 50), ("Silver", 150), ("Gold", 300), ("Platinum", 500)]
    for title, xp in badges_data:
        b = db.query(Badge).filter(Badge.name == title).first()
        if not b:
            b_in = BadgeCreate(name=title, description="Badge desc", icon_url="icon", required_xp=xp)
            crud_gamification.create_badge(db, obj_in=b_in)
    print("10. Badges seeded.")

    # 11. Reward
    rewards_data = [("Coffee Mug", 100), ("T-Shirt", 250), ("Gift Card", 500), ("Extra PTO", 1000)]
    for title, cost in rewards_data:
        r = db.query(Reward).filter(Reward.title == title).first()
        if not r:
            r_in = RewardCreate(title=title, description="Reward desc", cost_xp=cost, stock=50, category="Merch", image_url="image", status="active")
            crud_gamification.create_reward(db, obj_in=r_in)
    print("11. Rewards seeded.")

    db.close()

if __name__ == "__main__":
    print("Seeding database...")
    seed_db()
    print("Done.")

    db = SessionLocal()
    print("\nRow Counts:")
    print("Department:", db.query(Department).count())
    print("User:", db.query(User).count())
    print("EmissionFactor:", db.query(EmissionFactor).count())
    print("CarbonTransaction:", db.query(CarbonTransaction).count())
    print("Policy:", db.query(Policy).count())
    print("PolicyAcknowledgement:", db.query(PolicyAcknowledgement).count())
    print("Audit:", db.query(Audit).count())
    print("ComplianceIssue:", db.query(ComplianceIssue).count())
    print("CSRActivity:", db.query(CSRActivity).count())
    print("EmployeeParticipation:", db.query(EmployeeParticipation).count())
    print("Challenge:", db.query(Challenge).count())
    print("Badge:", db.query(Badge).count())
    print("Reward:", db.query(Reward).count())
    db.close()
