#!/bin/bash
# =============================================================================
# Migration Runner Script
# Description: Executes all SQL migrations in order
# =============================================================================

set -e

MIGRATIONS_DIR="/docker-entrypoint-initdb.d/migrations"

echo "======================================"
echo "Running Database Migrations"
echo "======================================"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "ERROR: Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | wc -l)

if [ "$MIGRATION_COUNT" -eq 0 ]; then
    echo "WARNING: No migration files found in $MIGRATIONS_DIR"
    exit 0
fi

echo "Found $MIGRATION_COUNT migration file(s)"
echo ""

# Run migrations in alphabetical order (which follows our numbering scheme)
for migration_file in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo "▶ Executing migration: $filename"

        # Execute the migration
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration_file"

        if [ $? -eq 0 ]; then
            echo "  ✓ Successfully executed: $filename"
        else
            echo "  ✗ FAILED: $filename"
            exit 1
        fi
        echo ""
    fi
done

echo "======================================"
echo "All migrations completed successfully!"
echo "======================================"
