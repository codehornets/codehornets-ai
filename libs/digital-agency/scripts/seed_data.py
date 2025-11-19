#!/usr/bin/env python3
"""
Database Seeding Script

Seeds the database with initial/sample data.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def seed_database():
    """Seed the database with initial data."""
    print("🌱 Seeding database...")
    print("ℹ️  No seed data configured yet.")
    print("   Add your seed data logic here when ready.")
    return True


if __name__ == "__main__":
    try:
        success = seed_database()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        sys.exit(1)
