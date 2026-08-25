import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import engine
from sqlalchemy import text

def run_migration():
    print("Running sales revert migration on PostgreSQL...")
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE sales ADD COLUMN is_reverted BOOLEAN DEFAULT FALSE NOT NULL;"))
            print("✓ Added is_reverted column to sales table.")
        except Exception as e:
            print("  is_reverted column already exists or failed:", e)

    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
