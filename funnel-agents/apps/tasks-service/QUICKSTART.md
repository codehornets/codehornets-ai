# Tasks Service - Quick Start Guide

Get the Tasks Service up and running in 5 minutes.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 13+
- Git

## Step 1: Install Dependencies

```bash
cd C:\workspace\@codehornets-ai\funnel-agents
npm install
```

## Step 2: Set Up Database

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL in Docker
docker run -d \
  --name funnel-agents-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=funnel_agents \
  -p 5432:5432 \
  postgres:15-alpine

# Wait for PostgreSQL to start (5-10 seconds)
sleep 10

# Run migration
docker exec -i funnel-agents-db psql -U user -d funnel_agents < apps/tasks-service/migrations/001_create_tasks_table.sql
```

### Option B: Using Local PostgreSQL

```bash
# Create database
createdb funnel_agents

# Run migration
psql -U user -d funnel_agents -f apps/tasks-service/migrations/001_create_tasks_table.sql
```

## Step 3: Configure Environment

The `.env` file should already exist in the root with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/funnel_agents
TASKS_SERVICE_HOST=localhost
TASKS_SERVICE_PORT=3006
```

## Step 4: Build the Service

```bash
npx nx build tasks-service
```

## Step 5: Run the Service

```bash
# Development mode (with hot reload)
npx nx serve tasks-service

# Production mode
node dist/apps/tasks-service/src/main.js
```

You should see:
```
Tasks Service is listening on port 3006
```

## Step 6: Test It

### Quick Health Check

```bash
# Create a task
curl -X POST http://localhost:3006/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Task",
    "agent_id": "550e8400-e29b-12d3-a456-426655440000",
    "priority": "high"
  }'
```

You should get a response with the created task:
```json
{
  "id": "uuid-here",
  "title": "My First Task",
  "status": "pending",
  "priority": "high",
  ...
}
```

### List Tasks

```bash
curl http://localhost:3006/tasks
```

### Execute Task

```bash
# Replace {task-id} with the ID from the create response
curl -X POST http://localhost:3006/tasks/{task-id}/execute
```

## Step 7: Run Tests

```bash
npx nx test tasks-service
```

Expected output:
```
PASS  tasks-service  tasks.service.spec.ts
  TasksService
    ✓ should be defined
    ... (15 tests total)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

## Troubleshooting

### Database Connection Error

```
Error: password authentication failed for user "user"
```

**Solution**: Check your DATABASE_URL in `.env` matches your PostgreSQL credentials.

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3006
```

**Solution**: Either stop the process using port 3006 or change TASKS_SERVICE_PORT in `.env`.

### TypeORM Sync Error in Production

```
Error: synchronize should not be enabled in production
```

**Solution**: Set `NODE_ENV=production` and run migrations manually instead of using auto-sync.

## Next Steps

1. **Integrate with API Gateway**: Configure API Gateway to proxy requests to this service
2. **Set up Worker Runner**: Implement actual task execution logic
3. **Add Authentication**: Secure endpoints with JWT/OAuth
4. **Enable Monitoring**: Add logging and metrics collection

## Useful Commands

```bash
# Build
npx nx build tasks-service

# Serve (development)
npx nx serve tasks-service

# Test
npx nx test tasks-service

# Lint
npx nx lint tasks-service

# View all tasks service commands
npx nx show project tasks-service
```

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tasks | Create task |
| GET | /tasks | List tasks |
| GET | /tasks/:id | Get task |
| PATCH | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| POST | /tasks/:id/execute | Execute task |
| POST | /tasks/:id/cancel | Cancel task |
| POST | /tasks/:id/retry | Retry task |

See `USAGE.md` for detailed examples.

## Database Schema

The migration creates:
- `tasks` table with all required columns
- Enum types: `task_status`, `task_priority`
- Indexes for optimal query performance
- Trigger for auto-updating `updated_at`

## Development Tips

1. **Auto-reload**: Use `npx nx serve tasks-service` for hot reload during development
2. **Database GUI**: Use pgAdmin or DBeaver to inspect the tasks table
3. **API Testing**: Use Postman or Insomnia for easier API testing
4. **Logs**: Check console output for detailed operation logs

## Architecture Overview

```
┌─────────────┐
│  API Client │
└──────┬──────┘
       │ HTTP/TCP
       ▼
┌─────────────────┐
│ TasksController │ ◄── HTTP & Microservice Messages
└────────┬────────┘
         │
         ▼
┌────────────────┐
│  TasksService  │ ◄── Business Logic & Events
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   TypeORM      │ ◄── Database Access
└────────┬───────┘
         │
         ▼
┌────────────────┐
│   PostgreSQL   │ ◄── Data Storage
└────────────────┘
```

## Support

- **Documentation**: See `README.md` and `USAGE.md`
- **Issues**: Check GitHub issues
- **Implementation Details**: See `IMPLEMENTATION_REPORT.md`

---

**You're all set!** The Tasks Service is now running and ready to handle task management for the FunnelAgents platform.
