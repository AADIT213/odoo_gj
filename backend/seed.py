from app.db.session import SessionLocal
from app.crud import crud_user
from app.schemas.user import UserCreate
from app.models.department import Department

def seed_db():
    db = SessionLocal()
    
    # 1. Check if department exists
    dept = db.query(Department).filter(Department.name == "Global HQ").first()
    if not dept:
        dept = Department(name="Global HQ", description="Headquarters", env_score=85.0, soc_score=90.0, gov_score=88.0, total_score=87.5)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    
    # 2. Check if SuperAdmin exists
    admin_user = crud_user.get_user_by_email(db, email="admin@ecosphere.com")
    if not admin_user:
        user_in = UserCreate(
            email="admin@ecosphere.com",
            password="adminpassword",
            full_name="Super Admin",
            role="SuperAdmin",
            department_id=dept.id
        )
        crud_user.create_user(db, user_in=user_in)
        print("SuperAdmin created (admin@ecosphere.com / adminpassword)")
    else:
        print("Database already seeded with SuperAdmin.")
        
    db.close()

if __name__ == "__main__":
    print("Seeding database...")
    seed_db()
    print("Done.")
