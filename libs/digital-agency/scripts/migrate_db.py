#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database migration script.
"""

import os
import sys
import argparse
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# Set UTF-8 encoding for Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'digital_agency'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
}

def get_connection():
    """Get database connection"""
    return psycopg2.connect(**DB_CONFIG)


def create_migration(name: str):
    """
    Create a new migration file.

    Args:
        name: Migration name
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    migration_name = f"{timestamp}_{name}"
    migrations_dir = Path("data/migrations")
    migrations_dir.mkdir(parents=True, exist_ok=True)

    migration_file = migrations_dir / f"{migration_name}.sql"

    template = f"""-- Migration: {name}
-- Created: {datetime.utcnow().isoformat()}
-- Description: {name.replace('_', ' ')}

-- UP
-- Add your migration SQL here

-- Example:
-- CREATE TABLE agents (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     domain VARCHAR(100) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- DOWN
-- Add rollback SQL here
-- DROP TABLE IF EXISTS agents;
"""

    with open(migration_file, 'w') as f:
        f.write(template)

    print(f"Created migration: {migration_file}")
    print(f"\nEdit the file to add your migration SQL")


def list_migrations():
    """List all migrations."""
    migrations_dir = Path("data/migrations")

    if not migrations_dir.exists():
        print("No migrations found")
        return

    migrations = sorted(migrations_dir.glob("*.sql"))

    if not migrations:
        print("No migrations found")
        return

    print("\nMigrations:")
    print("=" * 50)
    for migration in migrations:
        print(f"  {migration.name}")


def run_migration(migration_file: str) -> bool:
    """Execute a migration file"""
    try:
        migrations_dir = Path("data/migrations")
        migration_path = migrations_dir / migration_file

        if not migration_path.exists():
            print(f"❌ Migration file not found: {migration_file}")
            return False

        # Read migration file
        with open(migration_path, 'r') as f:
            content = f.read()

        # Extract UP migration SQL
        up_match = re.search(r'-- UP\n(.*?)-- DOWN', content, re.DOTALL)
        if not up_match:
            print(f"❌ Invalid migration format: {migration_file}")
            return False

        up_sql = up_match.group(1).strip()

        # Execute migration
        conn = get_connection()
        cursor = conn.cursor()

        try:
            # Create migrations table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    id SERIAL PRIMARY KEY,
                    migration_name VARCHAR(255) UNIQUE NOT NULL,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Check if already executed
            cursor.execute(
                "SELECT 1 FROM schema_migrations WHERE migration_name = %s",
                (migration_file,)
            )
            if cursor.fetchone():
                print(f"⚠️  Migration already executed: {migration_file}")
                return True

            # Execute migration SQL
            cursor.execute(up_sql)

            # Record migration
            cursor.execute(
                "INSERT INTO schema_migrations (migration_name) VALUES (%s)",
                (migration_file,)
            )

            conn.commit()
            print(f"✅ Migration executed successfully: {migration_file}")
            return True

        except Exception as e:
            conn.rollback()
            print(f"❌ Migration failed: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def rollback_migration(migration_file: str) -> bool:
    """Rollback a migration"""
    try:
        migrations_dir = Path("data/migrations")
        migration_path = migrations_dir / migration_file

        if not migration_path.exists():
            print(f"❌ Migration file not found: {migration_file}")
            return False

        # Read migration file
        with open(migration_path, 'r') as f:
            content = f.read()

        # Extract DOWN migration SQL
        down_match = re.search(r'-- DOWN\n(.*?)$', content, re.DOTALL)
        if not down_match:
            print(f"❌ No rollback SQL found: {migration_file}")
            return False

        down_sql = down_match.group(1).strip()

        # Execute rollback
        conn = get_connection()
        cursor = conn.cursor()

        try:
            # Check if migration was executed
            cursor.execute(
                "SELECT 1 FROM schema_migrations WHERE migration_name = %s",
                (migration_file,)
            )
            if not cursor.fetchone():
                print(f"⚠️  Migration not found in history: {migration_file}")
                return False

            # Execute rollback SQL
            cursor.execute(down_sql)

            # Remove from migrations table
            cursor.execute(
                "DELETE FROM schema_migrations WHERE migration_name = %s",
                (migration_file,)
            )

            conn.commit()
            print(f"✅ Migration rolled back successfully: {migration_file}")
            return True

        except Exception as e:
            conn.rollback()
            print(f"❌ Rollback failed: {e}")
            return False
        finally:
            cursor.close()
            conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def get_migration_status() -> List[Dict[str, Any]]:
    """Get status of all migrations"""
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Create migrations table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


        # Get executed migrations
        cursor.execute("""
            SELECT migration_name, executed_at
            FROM schema_migrations
            ORDER BY executed_at
        """)
        executed = {row[0]: row[1] for row in cursor.fetchall()}

        cursor.close()
        conn.close()

        # Get all migration files
        migrations_dir = Path("data/migrations")
        all_migrations = sorted(migrations_dir.glob("*.sql"))

        status = []
        for migration_file in all_migrations:
            name = migration_file.name
            status.append({
                "name": name,
                "executed": name in executed,
                "executed_at": executed.get(name, None)
            })

        return status

    except Exception as e:
        print(f"❌ Error getting status: {e}")
        return []


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Database migration tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create migration
    create_parser = subparsers.add_parser("create", help="Create a new migration")
    create_parser.add_argument("name", help="Migration name (e.g., 'create_agents_table')")

    # List migrations
    subparsers.add_parser("list", help="List all migrations")

    # Status
    subparsers.add_parser("status", help="Show migration status")

    # Run migration
    run_parser = subparsers.add_parser("up", help="Run migrations")
    run_parser.add_argument("--target", help="Specific migration to run")

    # Rollback migration
    rollback_parser = subparsers.add_parser("down", help="Rollback migration")
    rollback_parser.add_argument("migration", help="Migration to rollback")

    args = parser.parse_args()

    print("Database Migration Tool")
    print("=" * 50)

    if args.command == "create":
        create_migration(args.name)
    elif args.command == "list":
        list_migrations()
    elif args.command == "status":
        status = get_migration_status()
        if status:
            print("\nMigration Status:")
            print("=" * 80)
            for item in status:
                executed_mark = "✅" if item["executed"] else "⏳"
                executed_time = f" (executed: {item['executed_at']})" if item["executed_at"] else ""
                print(f"  {executed_mark} {item['name']}{executed_time}")
        else:
            print("No migrations found or unable to connect to database")
    elif args.command == "up":
        if args.target:
            run_migration(args.target)
        else:
            print("Running all pending migrations...")
            status = get_migration_status()
            pending = [m for m in status if not m["executed"]]
            if pending:
                for migration in pending:
                    if not run_migration(migration["name"]):
                        print(f"\n❌ Stopped at failed migration: {migration['name']}")
                        break
            else:
                print("✅ All migrations are up to date")
    elif args.command == "down":
        rollback_migration(args.migration)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
