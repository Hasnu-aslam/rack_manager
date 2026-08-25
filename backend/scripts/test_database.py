"""
Test database connection and data retrieval
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import Product, Customer
from sqlalchemy import text


def test_connection():
    """Test database connection"""
    print("Testing database connection...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def test_products():
    """Test product data retrieval"""
    print("\nTesting product data...")
    db: Session = SessionLocal()
    try:
        products = db.query(Product).all()
        print(f"✓ Found {len(products)} products")
        for product in products[:5]:  # Show first 5
            print(f"  - {product.name} (SKU: {product.sku}, Stock: {product.stock_quantity}, Price: ${product.price})")
        return True
    except Exception as e:
        print(f"✗ Error retrieving products: {e}")
        return False
    finally:
        db.close()


def test_customers():
    """Test customer data retrieval"""
    print("\nTesting customer data...")
    db: Session = SessionLocal()
    try:
        customers = db.query(Customer).all()
        print(f"✓ Found {len(customers)} customers")
        for customer in customers[:5]:  # Show first 5
            print(f"  - {customer.name} (Email: {customer.email}, Phone: {customer.phone})")
        return True
    except Exception as e:
        print(f"✗ Error retrieving customers: {e}")
        return False
    finally:
        db.close()


def main():
    """Main test function"""
    print("=" * 50)
    print("Database Connection Test")
    print("=" * 50)
    print()
    
    if not test_connection():
        print("\n✗ Cannot proceed without database connection")
        return
    
    test_products()
    test_customers()
    
    print("\n" + "=" * 50)
    print("Test complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()
