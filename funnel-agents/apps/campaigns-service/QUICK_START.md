# Campaigns Service - Quick Start Guide

## Table of Contents
- [Setup](#setup)
- [Database Migration](#database-migration)
- [Environment Variables](#environment-variables)
- [Running the Service](#running-the-service)
- [API Examples](#api-examples)
- [Testing](#testing)

---

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for throttling)
- Tasks Service running (for task creation)
- Scheduler Service running (optional, for distributed scheduling)

### Install Dependencies
```bash
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents
npm install
```

---

## Database Migration

### Option 1: Run SQL Migration (Recommended for Production)
```bash
# Connect to PostgreSQL
psql -U postgres -d funnel_agents -f apps/campaigns-service/migrations/001-add-campaign-features.sql

# Verify tables created
psql -U postgres -d funnel_agents -c "\dt campaign_*"
```

### Option 2: TypeORM Synchronize (Development Only)
```typescript
// In app.module.ts (ONLY for development)
DatabaseModule.forRootAsync({
  synchronize: true, // WARNING: Don't use in production!
})
```

---

## Environment Variables

### Create .env file
```bash
# Copy from example
cp apps/campaigns-service/.env.example apps/campaigns-service/.env

# Edit with your values
nano apps/campaigns-service/.env
```

### Required Variables
```bash
# Service
CAMPAIGNS_SERVICE_HOST=0.0.0.0
CAMPAIGNS_SERVICE_PORT=3003

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/funnel_agents
# OR individual configs:
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=funnel_agents
DB_PASSWORD=secret
DB_DATABASE=funnel_agents

# Tasks Service (required for task creation)
TASKS_SERVICE_HOST=localhost
TASKS_SERVICE_PORT=3006

# Scheduler Service (optional)
SCHEDULER_SERVICE_HOST=localhost
SCHEDULER_SERVICE_PORT=3009

# Redis (optional, for throttling)
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

---

## Running the Service

### Development Mode
```bash
# Start campaigns service
npm run start:dev campaigns-service

# Service will be available at:
# - TCP: localhost:3003
# - Health: http://localhost:3003/health
```

### Production Mode
```bash
# Build
npm run build campaigns-service

# Start
npm run start:prod campaigns-service
```

### Docker (if configured)
```bash
docker-compose up campaigns-service
```

---

## API Examples

### Base URL
```
http://localhost:3003
```

### 1. Create Campaign
```bash
curl -X POST http://localhost:3003/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 2025 Lead Generation",
    "description": "Tech industry focus",
    "workspace_id": "workspace-123",
    "status": "planning",
    "priority": "high",
    "goal": "Generate 1000 leads",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-03-31T23:59:59Z",
    "team_members": ["user-1", "user-2"],
    "agent_ids": ["agent-sales"],
    "settings": {
      "budget": 10000,
      "target_industries": ["tech", "saas"]
    }
  }'
```

### 2. Create Campaign from Template (with automatic tasks)
```bash
curl -X POST http://localhost:3003/campaigns/from-template \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "template-uuid",
    "name": "New Campaign",
    "workspace_id": "workspace-123",
    "create_default_tasks": true,
    "settings": {
      "custom_config": "value"
    }
  }'
```

### 3. Track Analytics Event
```bash
curl -X POST http://localhost:3003/campaigns/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "campaign-uuid",
    "event_type": "EMAIL_SENT",
    "metadata": {
      "recipient": "user@example.com",
      "template_id": "welcome-email"
    },
    "entity_id": "email-123",
    "entity_type": "email",
    "workspace_id": "workspace-123"
  }'
```

### 4. Get Campaign Performance
```bash
curl "http://localhost:3003/campaigns/analytics/performance/campaign-uuid?start_date=2025-01-01&end_date=2025-01-31"
```

### 5. Create Email Channel
```bash
curl -X POST http://localhost:3003/campaigns/channels \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "campaign-uuid",
    "channel_type": "email",
    "description": "Welcome email series",
    "configuration": {
      "template_id": "welcome",
      "from_email": "hello@company.com",
      "from_name": "Company",
      "subject": "Welcome!",
      "track_opens": true,
      "track_clicks": true
    },
    "scheduled_at": "2025-02-01T09:00:00Z"
  }'
```

### 6. Create Campaign Schedule
```bash
curl -X POST http://localhost:3003/campaigns/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "campaign-uuid",
    "start_date": "2025-02-01T00:00:00Z",
    "end_date": "2025-12-31T23:59:59Z",
    "recurrence": "weekly",
    "recurrence_config": {
      "days_of_week": [1, 3, 5]
    },
    "max_runs": 52,
    "timezone": "America/New_York"
  }'
```

### 7. List Campaigns with Filters
```bash
curl "http://localhost:3003/campaigns?workspace_id=workspace-123&status=active&priority=high&page=1&limit=20&sortBy=created_at&sortOrder=desc"
```

### 8. Get Campaign by ID
```bash
curl http://localhost:3003/campaigns/campaign-uuid
```

### 9. Update Campaign
```bash
curl -X PATCH http://localhost:3003/campaigns/campaign-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active",
    "progress": 50
  }'
```

### 10. Delete Campaign
```bash
curl -X DELETE http://localhost:3003/campaigns/campaign-uuid
```

---

## Testing

### Run Unit Tests
```bash
# All campaigns tests
npm run test campaigns-service

# Specific test file
npm run test campaigns-service -- campaigns.service.spec.ts

# Watch mode
npm run test:watch campaigns-service
```

### Run Integration Tests
```bash
# Requires database and services running
npm run test:integration campaigns-service
```

### Test Coverage
```bash
npm run test:cov campaigns-service
```

### Manual Testing Checklist

#### Basic Campaign Operations
- [ ] Create campaign
- [ ] Get campaign by ID
- [ ] List campaigns with filters
- [ ] Update campaign
- [ ] Delete campaign

#### Template-Based Creation
- [ ] Create template
- [ ] Create campaign from template
- [ ] Verify tasks created (check tasks-service)
- [ ] Verify settings merged correctly

#### Analytics
- [ ] Track email_sent event
- [ ] Track email_opened event
- [ ] Track lead_created event
- [ ] Track lead_converted event
- [ ] Get performance report
- [ ] Verify metrics calculations

#### Multi-Channel
- [ ] Create email channel
- [ ] Create SMS channel
- [ ] Create social media channel
- [ ] Activate channel
- [ ] Pause channel
- [ ] Delete channel

#### Scheduling
- [ ] Create one-time schedule
- [ ] Create daily recurring schedule
- [ ] Create weekly recurring schedule
- [ ] Activate schedule
- [ ] Wait 5 minutes and verify cron executed
- [ ] Check campaign status changed to active
- [ ] Pause schedule

---

## Troubleshooting

### Service Won't Start
```bash
# Check port not in use
lsof -i :3003

# Check database connection
psql -U funnel_agents -d funnel_agents -c "SELECT 1"

# Check environment variables
cat .env | grep -E "CAMPAIGNS|DATABASE|TASKS"
```

### Tasks Not Created
```bash
# Verify tasks-service is running
curl http://localhost:3006/health

# Check logs for TCP errors
npm run start:dev campaigns-service | grep "TASKS_SERVICE"

# Test TCP connectivity
telnet localhost 3006
```

### Schedule Not Executing
```bash
# Check cron job logs (should run every 5 minutes)
# Look for: "Processing due campaign schedules"

# Verify schedule is active
curl http://localhost:3003/campaigns/schedules/campaign/campaign-uuid

# Check next_run_at is in the past
# Check status is 'active'
```

### Analytics Not Tracking
```bash
# Verify table exists
psql -U funnel_agents -d funnel_agents -c "\d campaign_analytics"

# Check recent events
psql -U funnel_agents -d funnel_agents -c "SELECT * FROM campaign_analytics ORDER BY created_at DESC LIMIT 10"

# Test tracking endpoint
curl -X POST http://localhost:3003/campaigns/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"campaign_id":"test","event_type":"EMAIL_SENT"}'
```

---

## Next Steps

1. **Read Full Documentation**
   - See `CAMPAIGNS_COMPLETION_REPORT.md` for detailed features
   - See `IMPLEMENTATION_REPORT.md` for original implementation

2. **Set Up Related Services**
   - Start tasks-service for task creation
   - Start scheduler-service for distributed scheduling
   - Configure Redis for rate limiting

3. **Configure Monitoring**
   - Set up health checks
   - Monitor TCP connections
   - Track analytics ingestion rate
   - Monitor cron job execution

4. **Production Deployment**
   - Run migration on production database
   - Set production environment variables
   - Configure load balancer
   - Set up logging and monitoring

---

## Support

### Resources
- API Gateway: Configure proxy routes
- Database Schema: See migration file
- Environment Variables: See `.env.example`
- Test Examples: See `*.spec.ts` files

### Common Issues
1. **Port 3003 in use**: Change `CAMPAIGNS_SERVICE_PORT`
2. **Database connection failed**: Check `DATABASE_URL`
3. **Tasks not creating**: Verify `TASKS_SERVICE_HOST/PORT`
4. **Cron not running**: Check `@nestjs/schedule` is installed

---

**Service Version**: 1.0.0 (100% Complete)
**Last Updated**: 2025-11-25
**Status**: Production Ready
