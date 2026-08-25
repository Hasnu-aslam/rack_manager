import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine
from sqlalchemy import text

def run_migration():
    print("Running sizes migration on PostgreSQL...")
    with engine.begin() as conn:
        # 1. Create product_sizes table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_sizes (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                size VARCHAR NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                tenant_id INTEGER NOT NULL REFERENCES tenants(id),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))
        print("✓ Created/verified product_sizes table.")

        # 2. Add size column to sale_items if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE sale_items ADD COLUMN size VARCHAR;"))
            print("✓ Added size column to sale_items.")
        except Exception as e:
            print("  size column already exists or failed:", e)

        # 3. Backfill existing products' stock to size '8'
        # Get all products and check if they have sizes populated
        products = conn.execute(text("SELECT id, stock_quantity, tenant_id FROM products")).fetchall()
        for p in products:
            p_id, stock, t_id = p
            existing_sizes = conn.execute(
                text("SELECT id FROM product_sizes WHERE product_id = :p_id"),
                {"p_id": p_id}
            ).fetchone()
            if not existing_sizes:
                conn.execute(
                    text("""
                        INSERT INTO product_sizes (product_id, size, quantity, tenant_id)
                        VALUES (:product_id, '8', :quantity, :tenant_id)
                    """),
                    {"product_id": p_id, "quantity": stock, "tenant_id": t_id}
                )
                print(f"✓ Backfilled Product {p_id} with size '8' stock: {stock}")

        # 4. Backfill existing sale items to size '8'
        conn.execute(text("UPDATE sale_items SET size = '8' WHERE size IS NULL;"))
        
        # 5. Make size column on sale_items NOT NULL
        try:
            conn.execute(text("ALTER TABLE sale_items ALTER COLUMN size SET NOT NULL;"))
            print("✓ Set size column on sale_items to NOT NULL.")
        except Exception as e:
            print("  Failed to set size column to NOT NULL:", e)

    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
