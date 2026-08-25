import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant

async def fix_users():
    db: Session = SessionLocal()
    try:
        # Create a default tenant if none exists
        default_tenant = db.query(Tenant).filter(Tenant.name == "Default Tenant").first()
        if not default_tenant:
            default_tenant = Tenant(name="Default Tenant")
            db.add(default_tenant)
            db.commit()
            db.refresh(default_tenant)
            print(f"Created Default Tenant with ID {default_tenant.id}")

        # Assign all non-superusers to this tenant if they don't have one
        users = db.query(User).filter(User.is_superuser == False, User.tenant_id == None).all()
        for u in users:
            u.tenant_id = default_tenant.id
            print(f"Assigned user '{u.username}' to Tenant {default_tenant.id}")
        
        db.commit()
        print("Fixed all existing users.")
    except Exception as e:
        db.rollback()
        print(f"Failed to fix users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(fix_users())
