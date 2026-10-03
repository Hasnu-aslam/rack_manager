"""
Database initialization script
Creates initial admin user if it doesn't exist
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import User
from app.core.security import get_password_hash


def init_db():
    """Initialize database and create admin user"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@rackmanager.com",
                hashed_password=get_password_hash("admin123"),
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("✓ Admin user created (username: admin, password: admin123)")
        else:
            print("✓ Admin user already exists")
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
