# Database Migration Quick Start Guide

## Quick Commands

### Reset and Rebuild Database
```bash
cd infrastructure/docker

# Stop containers
docker-compose down

# Remove PostgreSQL data volume
docker volume rm funnel-agents_postgres-data

# Start PostgreSQL (migrations run automatically)
docker-compose up -d postgres

# Watch logs
docker-compose logs -f postgres
```

### Verify Migration Success
```bash
# Check all tables created
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents -c "\dt"

# Check all indexes
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents -c "\di"

# Check foreign keys
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents -c "SELECT conname, conrelid::regclass AS table, confrelid::regclass AS references FROM pg_constraint WHERE contype = 'f' ORDER BY conrelid::regclass::text;"

# Count records in each table
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

### Manual Migration Execution
```bash
# Connect to database
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents

# Run specific migration
\i /docker-entrypoint-initdb.d/migrations/001_create_users_table.sql

# Exit
\q
```

### Start All Services
```bash
cd infrastructure/docker

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# Watch logs
docker-compose logs -f
```

### Check Service Health
```bash
# Check individual service logs
docker-compose logs -f auth-service
docker-compose logs -f crm-service
docker-compose logs -f agents-service
docker-compose logs -f campaigns-service
docker-compose logs -f automations-service
docker-compose logs -f reports-service
docker-compose logs -f tasks-service

# Check for errors
docker-compose logs | grep -i error
docker-compose logs | grep -i "migration"
```

## Common Issues

### Issue: Migrations not running
**Solution:**
```bash
# Check if migration files are mounted
docker exec -it funnel-agents-postgres ls -la /docker-entrypoint-initdb.d/migrations

# Check migration script permissions
docker exec -it funnel-agents-postgres ls -la /docker-entrypoint-initdb.d/03-run-migrations.sh

# Make script executable
chmod +x postgres/init/03-run-migrations.sh
```

### Issue: Foreign key violations
**Solution:**
```bash
# Check migration order
ls -la postgres/migrations/

# Migrations should run in this order:
# 001 -> Users (no dependencies)
# 002 -> Agents (no dependencies)
# 003 -> Tasks (depends on agents)
# 004 -> CRM (depends on users, workspaces)
# 005 -> Campaigns (depends on users, workspaces)
# 006 -> Workflows (depends on users, workspaces)
# 007 -> Reports (depends on users, workspaces)
# 008 -> Foreign keys (all tables must exist)
```

### Issue: Duplicate table errors
**Solution:**
Database was partially initialized. Reset completely:
```bash
docker-compose down
docker volume rm funnel-agents_postgres-data
docker-compose up -d postgres
```

### Issue: Service connection errors
**Solution:**
```bash
# Check PostgreSQL is healthy
docker-compose ps postgres

# Check DATABASE_URL is set
docker-compose config | grep DATABASE_URL

# Restart service
docker-compose restart auth-service
```

## Database Operations

### Backup Database
```bash
# Backup entire database
docker exec -t funnel-agents-postgres pg_dump -U funnel_agents funnel_agents > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific table
docker exec -t funnel-agents-postgres pg_dump -U funnel_agents -t users funnel_agents > users_backup.sql
```

### Restore Database
```bash
# Restore full database
cat backup_20251125_120000.sql | docker exec -i funnel-agents-postgres psql -U funnel_agents -d funnel_agents

# Restore specific table
cat users_backup.sql | docker exec -i funnel-agents-postgres psql -U funnel_agents -d funnel_agents
```

### Database Shell Access
```bash
# PostgreSQL shell
docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents

# Useful commands once in psql:
\dt              # List tables
\d+ tablename    # Describe table
\di              # List indexes
\df              # List functions
\l               # List databases
\du              # List users
\q               # Quit
```

## Performance Monitoring

### Check Slow Queries
```sql
-- Enable pg_stat_statements (run once)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Check Index Usage
```sql
-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Find most used indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 20;
```

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Connection Stats
```sql
SELECT
  datname,
  count(*) as connections,
  max(state) as state
FROM pg_stat_activity
GROUP BY datname
ORDER BY connections DESC;
```

## Development Workflow

### Making Schema Changes

1. **Create new migration file**
   ```bash
   cd infrastructure/docker/postgres/migrations

   # Create new file with next number
   cat > 009_add_user_preferences.sql << 'EOF'
   -- =============================================================================
   -- Migration: 009 - Add User Preferences
   -- Description: Add preferences column to users table
   -- =============================================================================

   ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

   CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING GIN (preferences);
   EOF
   ```

2. **Test migration**
   ```bash
   cd ../..  # Back to infrastructure/docker

   # Reset database
   docker-compose down
   docker volume rm funnel-agents_postgres-data
   docker-compose up -d postgres

   # Check logs
   docker-compose logs postgres | grep "009_add_user_preferences"
   ```

3. **Verify changes**
   ```bash
   docker exec -it funnel-agents-postgres psql -U funnel_agents -d funnel_agents -c "\d users"
   ```

### Testing Strategy

1. **Unit test** - Test SQL syntax
2. **Integration test** - Test on clean database
3. **Staging test** - Test on staging environment
4. **Production deploy** - Apply to production

## Configuration Reference

### TypeORM Configuration (All Services)
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    entities: [/* entity classes */],
    synchronize: false,              // NEVER enable in production
    migrationsRun: true,              // Auto-run pending migrations
    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    logging: configService.get('NODE_ENV') === 'development',
  }),
})
```

### Docker Compose Configuration
```yaml
postgres:
  volumes:
    - postgres-data:/var/lib/postgresql/data
    - ./postgres/init:/docker-entrypoint-initdb.d
    - ./postgres/migrations:/docker-entrypoint-initdb.d/migrations:ro
```

## File Structure
```
infrastructure/docker/
├── postgres/
│   ├── init/
│   │   ├── 01-create-databases.sql
│   │   ├── 02-seed-test-user.sql
│   │   └── 03-run-migrations.sh
│   └── migrations/
│       ├── README.md
│       ├── 001_create_users_table.sql
│       ├── 002_create_agents_table.sql
│       ├── 003_create_tasks_table.sql
│       ├── 004_create_leads_contacts_deals.sql
│       ├── 005_create_campaigns_table.sql
│       ├── 006_create_workflows_table.sql
│       ├── 007_create_reports_table.sql
│       └── 008_add_missing_foreign_keys.sql
├── docker-compose.yml
└── DATABASE_MIGRATION_REPORT.md
```

## Troubleshooting Decision Tree

```
Migration Issue?
├── Files not found?
│   ├── Check volume mount in docker-compose.yml
│   └── Verify files exist: ls postgres/migrations/
├── Permission denied?
│   ├── Make script executable: chmod +x postgres/init/03-run-migrations.sh
│   └── Check file ownership
├── SQL errors?
│   ├── Check migration logs: docker-compose logs postgres
│   ├── Verify SQL syntax
│   └── Check dependencies (parent tables exist?)
├── Service won't start?
│   ├── Check TypeORM config (synchronize: false)
│   ├── Verify DATABASE_URL
│   └── Check service logs: docker-compose logs <service-name>
└── Performance issues?
    ├── Check missing indexes
    ├── Analyze slow queries
    └── Review table statistics
```

## Success Checklist

- [ ] PostgreSQL container starts without errors
- [ ] Migration script executes successfully
- [ ] All 8 migration files run in order
- [ ] All tables created (verify with `\dt`)
- [ ] All indexes created (verify with `\di`)
- [ ] All foreign keys created (verify with pg_constraint)
- [ ] All services connect successfully
- [ ] No errors in service logs
- [ ] Health checks pass
- [ ] Basic CRUD operations work

## Emergency Rollback

If something goes wrong in production:

```bash
# 1. Stop services
docker-compose stop

# 2. Restore from backup
cat backup_before_migration.sql | docker exec -i funnel-agents-postgres psql -U funnel_agents -d funnel_agents

# 3. Revert code deployment
git checkout <previous-commit>

# 4. Restart services
docker-compose up -d
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review migrations: `postgres/migrations/README.md`
3. Check implementation report: `DATABASE_MIGRATION_REPORT.md`
4. Verify database state with psql commands above
