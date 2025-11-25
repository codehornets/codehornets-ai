# Database Connection Pooling - Quick Reference

## TL;DR

All services now have production-ready database connection pooling with the following defaults:

```typescript
{
  max: 20,              // Maximum pool size
  min: 5,               // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxQueryExecutionTime: 10000,  // Log slow queries
  ssl: true (in production)
}
```

## Environment Variables

```bash
# .env file
DB_POOL_MAX=20  # Maximum connections per service
DB_POOL_MIN=5   # Minimum connections per service
```

## Quick Commands

### Monitor Database Connections

```bash
# See all connections by service
psql -U funnel_agents -d funnel_agents -c "
  SELECT application_name, count(*), state
  FROM pg_stat_activity
  WHERE application_name LIKE '%service'
  GROUP BY application_name, state
  ORDER BY count(*) DESC;
"

# Total active connections
psql -U funnel_agents -d funnel_agents -c "
  SELECT count(*) FROM pg_stat_activity WHERE datname = 'funnel_agents';
"

# Find slow queries (>10s)
psql -U funnel_agents -d funnel_agents -c "
  SELECT application_name, now() - query_start as duration, left(query, 60)
  FROM pg_stat_activity
  WHERE state != 'idle' AND now() - query_start > interval '10 seconds';
"
```

### Service-Specific Configuration

To override pool settings for a specific service:

```bash
# In service's .env file
DB_POOL_MAX=30  # Increase for high-traffic services
DB_POOL_MIN=10

# Or as environment variable
export DB_POOL_MAX=30
npm run start:auth-service
```

### Health Monitoring

Pool statistics are logged every 5 minutes:

```bash
# Watch pool stats in logs
docker-compose logs -f auth-service | grep "Pool Stats"

# Example output:
# [DatabaseHealthService] Pool Stats - Total: 8, Idle: 6, Waiting: 0
```

## Service Application Names

| Service | Application Name |
|---------|-----------------|
| Auth | `auth-service` |
| CRM | `crm-service` |
| Campaigns | `campaigns-service` |
| Content | `content-service` |
| Agents | `agents-service` |
| Tasks | `tasks-service` |
| Automations | `automations-service` |
| Reports | `reports-service` |
| Scheduler | `scheduler` |

## Troubleshooting

### "Connection timeout" errors

1. Check current pool usage:
   ```bash
   psql -U funnel_agents -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. Increase pool size temporarily:
   ```bash
   DB_POOL_MAX=30 npm run start:service-name
   ```

3. Look for connection leaks:
   ```bash
   # Find long-lived connections
   psql -U funnel_agents -c "
     SELECT application_name, now() - backend_start as age
     FROM pg_stat_activity
     WHERE now() - backend_start > interval '1 hour'
     ORDER BY age DESC;
   "
   ```

### High idle connection count

1. Reduce minimum pool size:
   ```bash
   DB_POOL_MIN=2 npm run start:service-name
   ```

2. Check if service is truly idle:
   ```bash
   docker-compose logs service-name | tail -100
   ```

### Slow queries

1. Check logs for queries >10s:
   ```bash
   docker-compose logs service-name | grep "Query execution time"
   ```

2. Analyze with EXPLAIN:
   ```sql
   EXPLAIN ANALYZE <slow-query>;
   ```

## Files Modified

### Infrastructure
- `libs/infrastructure/src/lib/db/database-config.helper.ts` (new)
- `libs/infrastructure/src/lib/db/database-health.service.ts` (new)
- `libs/infrastructure/src/lib/db/database.module.ts`

### Services
- All service `app.module.ts` files updated with pooling config

### Configuration
- `infrastructure/docker/.env.example`

## Performance Tips

1. **Start conservative**: Default 20/5 works for most cases
2. **Monitor first**: Use pg_stat_activity before adjusting
3. **Scale per service**: High-traffic services get larger pools
4. **Watch for patterns**: Idle time, query duration, waiting clients

## Production Checklist

- [ ] Set DB_POOL_MAX and DB_POOL_MIN in production .env
- [ ] Verify SSL is enabled (NODE_ENV=production)
- [ ] Monitor initial connection counts after deployment
- [ ] Set up alerts for pool capacity warnings
- [ ] Configure proper SSL certificates (update rejectUnauthorized: true)

## Need Help?

See full documentation: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/DATABASE_POOLING_IMPLEMENTATION_REPORT.md`
