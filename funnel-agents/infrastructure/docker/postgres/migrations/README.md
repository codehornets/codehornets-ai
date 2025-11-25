# Database Migrations

## Overview

This directory contains SQL migration files that define the complete database schema for the FunnelAgents platform. Migrations are executed automatically when the PostgreSQL container starts.

## Migration Files

Migrations are numbered sequentially and executed in order:

1. **001_create_users_table.sql** - User authentication and audit tables
   - users
   - password_reset_tokens
   - token_blacklist
   - audit_logs
   - login_attempts

2. **002_create_agents_table.sql** - AI agent management
   - agents
   - agent_templates
   - agent_feedback
   - agent_tuning
   - agent_metrics

3. **003_create_tasks_table.sql** - Task execution and scheduling
   - tasks
   - scheduled_tasks
   - task_executions

4. **004_create_leads_contacts_deals.sql** - CRM core tables
   - workspaces
   - leads (with proper indexes)
   - lead_activities
   - contacts (with proper indexes)
   - deals (with proper indexes)
   - client_feedback

5. **005_create_campaigns_table.sql** - Marketing campaigns
   - campaigns
   - campaign_templates

6. **006_create_workflows_table.sql** - Workflow automation
   - workflows
   - workflow_runs

7. **007_create_reports_table.sql** - Reporting and analytics
   - report_templates
   - scheduled_reports
   - feedback
   - content
   - files

8. **008_add_missing_foreign_keys.sql** - Referential integrity
   - Foreign key constraints for all relationships

## Key Improvements

### Indexes Added
All CRM entities (leads, contacts, deals) now have proper indexes:
- Status indexes for filtering
- Workspace/user indexes for multi-tenancy
- Created_at indexes for time-based queries
- Composite indexes for common query patterns

### Foreign Key Constraints
All relationships now have explicit foreign key constraints with proper ON DELETE behavior:
- `CASCADE` for dependent data
- `SET NULL` for optional relationships

### Performance Optimizations
- Composite indexes for common query patterns
- GIN indexes for JSONB columns (where beneficial)
- Partial indexes for filtered queries

## Execution Order

Migrations are executed automatically by the PostgreSQL Docker container during initialization:

1. Container starts
2. `01-create-databases.sql` creates databases
3. `02-seed-test-user.sql` (if exists) seeds test data
4. `03-run-migrations.sh` executes all migrations in this directory
5. Services connect with `synchronize: false` and `migrationsRun: true`

## Synchronize: False

All TypeORM configurations have been updated with:
```typescript
{
  synchronize: false,        // Never auto-modify schema
  migrationsRun: true,        // Run pending migrations
  migrations: [__dirname + '/migrations/**/*{.ts,.js}']
}
```

This ensures:
- No accidental schema modifications
- Explicit migration control
- Production safety
- Version-controlled schema changes

## Adding New Migrations

1. Create a new file: `009_your_migration_name.sql`
2. Follow the existing pattern:
   ```sql
   -- =============================================================================
   -- Migration: 009 - Your Migration Name
   -- Description: Brief description
   -- =============================================================================

   -- Your SQL here
   ```
3. Test locally first
4. Migrations run once on container initialization

## Manual Execution

To run migrations manually on an existing database:

```bash
# Connect to container
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents

# Run specific migration
\i /docker-entrypoint-initdb.d/migrations/009_your_migration.sql

# Or run all migrations
cd /docker-entrypoint-initdb.d/migrations
for f in *.sql; do psql -U funnel_agents -d funnel_agents -f "$f"; done
```

## Reset Database

To reset and rebuild the database:

```bash
# Stop and remove containers
docker-compose down

# Remove PostgreSQL volume
docker volume rm funnel-agents_postgres-data

# Restart (migrations will run automatically)
docker-compose up -d postgres
```

## Production Considerations

For production deployments:

1. **Run migrations separately** before deploying new code
2. Use a migration tool like Flyway or TypeORM CLI
3. Create database backups before migrations
4. Test migrations on staging first
5. Consider blue-green deployments for zero-downtime

## Index Strategy

Our indexing strategy focuses on:

1. **Foreign Keys**: Always indexed
2. **Status Fields**: For filtering by state
3. **Timestamps**: For time-range queries
4. **Composite Indexes**: For common multi-column queries
5. **Workspace/User IDs**: For multi-tenant data isolation

## Foreign Key Strategy

Our FK strategy:

- `ON DELETE CASCADE`: For truly dependent data (feedback, activities)
- `ON DELETE SET NULL`: For optional relationships (workspace, user references)
- `ON DELETE RESTRICT`: For critical relationships that shouldn't be deleted

## Monitoring

To check migration status:

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check foreign keys
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
ORDER BY conrelid::regclass::text;
```

## Troubleshooting

### Migrations not running
- Check container logs: `docker logs funnel-agents-postgres`
- Verify migration files are mounted: `docker exec funnel-agents-postgres ls /docker-entrypoint-initdb.d/migrations`
- Ensure script is executable: `chmod +x postgres/init/03-run-migrations.sh`

### Duplicate key errors
- Database may have been initialized without migrations
- Reset database and restart

### Foreign key violations
- Check migration order - parent tables must exist first
- Verify data consistency

## Schema Diagram

```
users
  ├── password_reset_tokens
  ├── token_blacklist
  ├── audit_logs
  └── login_attempts

agents
  ├── agent_feedback
  ├── agent_tuning
  ├── agent_metrics
  └── tasks

workspaces
  ├── leads
  │   └── lead_activities
  ├── contacts
  │   └── client_feedback
  ├── deals
  ├── campaigns
  ├── workflows
  │   └── workflow_runs
  ├── content
  └── files
```
