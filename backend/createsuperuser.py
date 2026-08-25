import asyncio
import getpass
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_superuser():
    print("--- Create SuperUser ---")
    username = input("Username: ")
    email = input("Email: ")
    password = getpass.getpass("Password: ")
    
    db: Session = SessionLocal()
    try:
        existing_user = db.query(User).filter(
            (User.username == username) | (User.email == email)
        ).first()
        
        if existing_user:
            print("Error: User with this username or email already exists.")
            return

        hashed_password = get_password_hash(password)
        super_user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_superuser=True,
            is_active=True
        )
        db.add(super_user)
        db.commit()
        print(f"Superuser '{username}' created successfully!")
    except Exception as e:
        db.rollback()
        print(f"Failed to create superuser: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_superuser())
