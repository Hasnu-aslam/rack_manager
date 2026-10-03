"""
Database setup script
Creates database tables and initial data
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models import Product, Customer, User, Tenant
from app.core.security import get_password_hash


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")


def create_initial_data():
    """Create initial admin user and sample data"""
    db: Session = SessionLocal()
    try:
        # Create default tenant
        default_tenant = db.query(Tenant).filter(Tenant.name == "Default Tenant").first()
        if not default_tenant:
            default_tenant = Tenant(name="Default Tenant", status="active")
            db.add(default_tenant)
            db.flush()
            print("✓ Default Tenant created")
        else:
            print("✓ Default Tenant already exists")

        # Create admin user if it doesn't exist
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@rackmanager.com",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                tenant_id=default_tenant.id
            )
            db.add(admin_user)
            print("✓ Admin user created (username: admin, password: admin123)")
        else:
            print("✓ Admin user already exists")

        # Create sample products
        sample_products = [
            {
                "name": "Nike Air Max 90",
                "sku": "NIKE-AM90-001",
                "brand": "Nike",
                "category": "Running",
                "price": 120.00,
                "cost": 80.00,
                "stock_quantity": 50,
            },
            {
                "name": "Adidas Ultraboost 22",
                "sku": "ADIDAS-UB22-001",
                "brand": "Adidas",
                "category": "Running",
                "price": 180.00,
                "cost": 120.00,
                "stock_quantity": 30,
            },
            {
                "name": "Converse Chuck Taylor",
                "sku": "CONVERSE-CT-001",
                "brand": "Converse",
                "category": "Casual",
                "price": 55.00,
                "cost": 35.00,
                "stock_quantity": 100,
            },
        ]

        for product_data in sample_products:
            existing = db.query(Product).filter(Product.sku == product_data["sku"]).first()
            if not existing:
                product = Product(**product_data, tenant_id=default_tenant.id)
                db.add(product)
                print(f"✓ Created product: {product_data['name']}")
            else:
                print(f"  Product {product_data['name']} already exists")

        # Create sample customers
        sample_customers = [
            {
                "name": "John Doe",
                "phone": "+1234567890",
                "email": "john.doe@example.com",
                "address": "123 Main St, City, State 12345",
            },
            {
                "name": "Jane Smith",
                "phone": "+0987654321",
                "email": "jane.smith@example.com",
                "address": "456 Oak Ave, City, State 67890",
            },
        ]

        for customer_data in sample_customers:
            existing = db.query(Customer).filter(
                Customer.email == customer_data["email"]
            ).first()
            if not existing:
                customer = Customer(**customer_data, tenant_id=default_tenant.id)
                db.add(customer)
                print(f"✓ Created customer: {customer_data['name']}")
            else:
                print(f"  Customer {customer_data['name']} already exists")

        db.commit()
        print("\n✓ Initial data created successfully")
    except Exception as e:
        print(f"✗ Error creating initial data: {e}")
        db.rollback()
    finally:
        db.close()


def main():
    """Main setup function"""
    print("=" * 50)
    print("Database Setup")
    print("=" * 50)
    print()
    
    create_tables()
    print()
    create_initial_data()
    print()
    print("=" * 50)
    print("Setup complete!")
    print("=" * 50)
    print("\nYou can now start the server with:")
    print("  python3 -m uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
