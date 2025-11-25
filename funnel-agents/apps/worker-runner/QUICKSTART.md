# Worker Runner - Quick Start Guide

Get the Worker Runner service up and running in 5 minutes.

## Prerequisites

- Node.js 18+
- Redis 6+
- Docker (optional)

## Quick Start (Development)

### 1. Install Dependencies

```bash
# From repository root
npm install
```

### 2. Start Redis

```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or using local Redis
redis-server
```

### 3. Configure Environment

```bash
# Copy example environment file
cp apps/worker-runner/.env.example apps/worker-runner/.env

# Edit configuration (use defaults for local development)
nano apps/worker-runner/.env
```

### 4. Start Required Services

Open separate terminal windows for each:

```bash
# Terminal 1: Tasks Service
npm run serve tasks-service

# Terminal 2: Agents Service
npm run serve agents-service

# Terminal 3: Automations Service
npm run serve automations-service

# Terminal 4: Python Agent API
cd digital-agency/api
uvicorn main:app --reload --port 8000
```

### 5. Start Worker Runner

```bash
# Terminal 5: Worker Runner
npm run serve worker-runner
```

You should see:
```
[WorkerRunner] Worker Runner TCP service is listening on port 3009
[WorkerRunner] Worker Runner HTTP service (health checks) is listening on port 3109
[WorkerRunner] Background task processing started...
[WorkerRunner] Queue processors active: tasks, agents, automations
```

### 6. Verify Health

```bash
curl http://localhost:3109/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-25T10:00:00.000Z",
  "uptime": 10
}
```

## Testing the Service

### Queue a Test Task

Using the tasks-service API:

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Task",
    "description": "Test task for worker runner",
    "agentId": "your-agent-id",
    "priority": "high",
    "input": {
      "message": "Hello, world!"
    }
  }'
```

Watch the worker-runner logs to see it process the task!

### Check Queue Status

```bash
curl http://localhost:3109/health/queues
```

## Docker Quick Start

### Build Image

```bash
docker build -t worker-runner:latest apps/worker-runner/
```

### Run with Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  tasks-service:
    image: tasks-service:latest
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis

  agents-service:
    image: agents-service:latest
    depends_on:
      - redis

  automations-service:
    image: automations-service:latest
    depends_on:
      - redis

  agent-api:
    image: agent-api:latest
    ports:
      - "8000:8000"

  worker-runner:
    image: worker-runner:latest
    environment:
      - REDIS_HOST=redis
      - TASKS_SERVICE_HOST=tasks-service
      - AGENTS_SERVICE_HOST=agents-service
      - AUTOMATIONS_SERVICE_HOST=automations-service
      - AGENT_API_URL=http://agent-api:8000
    ports:
      - "3009:3009"
      - "3109:3109"
    depends_on:
      - redis
      - tasks-service
      - agents-service
      - automations-service
      - agent-api
```

Start everything:

```bash
docker-compose up -d
```

## Common Issues

### Issue: Redis Connection Failed

**Error**: `ECONNREFUSED 127.0.0.1:6379`

**Solution**:
```bash
# Check Redis is running
docker ps | grep redis

# Or restart Redis
docker restart redis
```

### Issue: Service Not Found

**Error**: `Failed to fetch task/agent details`

**Solution**: Ensure all required services are running:
```bash
# Check services
curl http://localhost:3006/health  # tasks-service
curl http://localhost:3002/health  # agents-service
curl http://localhost:3008/health  # automations-service
curl http://localhost:8000/health  # agent-api
```

### Issue: Jobs Not Processing

**Problem**: Health check shows jobs in queue but not processing

**Solution**:
1. Check worker-runner logs for errors
2. Verify agent status is 'active' in database
3. Check agent API is responding
4. Verify queue permissions in Redis

## Development Tips

### Watch Logs

```bash
# Worker Runner logs
npm run serve worker-runner 2>&1 | tee worker.log

# Filter for specific processor
npm run serve worker-runner 2>&1 | grep TaskProcessor
```

### Monitor Queues

Install BullBoard for queue visualization:

```bash
npm install @bull-board/express @bull-board/api
```

Add to app.module.ts:
```typescript
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

// In imports
BullBoardModule.forRoot({
  route: '/admin/queues',
  adapter: ExpressAdapter
}),
BullBoardModule.forFeature({
  name: 'tasks',
  adapter: BullMQAdapter
}),
```

Access at: http://localhost:3109/admin/queues

### Debug Mode

Enable verbose logging:

```bash
NODE_ENV=development npm run serve worker-runner
```

### Test Individual Processor

Create a test script `test-processor.ts`:

```typescript
import { Queue } from 'bullmq';

const queue = new Queue('tasks', {
  connection: { host: 'localhost', port: 6379 }
});

async function test() {
  await queue.add('execute_task', {
    type: 'execute_task',
    payload: {
      taskId: 'test-123',
      workspaceId: 'workspace-123'
    },
    metadata: {
      correlationId: 'test-corr-123'
    }
  });

  console.log('Job queued!');
}

test();
```

Run: `npx ts-node test-processor.ts`

## Next Steps

1. Read [README.md](./README.md) for detailed documentation
2. Review [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) for architecture details
3. Set up monitoring dashboards
4. Configure production environment
5. Run load tests

## Useful Commands

```bash
# Build
npm run build worker-runner

# Run tests
npm run test worker-runner

# Watch tests
npm run test:watch worker-runner

# Lint
npm run lint worker-runner

# Format
npm run format worker-runner

# Check health
curl http://localhost:3109/health

# Check queue status
curl http://localhost:3109/health/queues

# Detailed health
curl http://localhost:3109/health/detailed
```

## Environment Variables Reference

```bash
# Required
REDIS_HOST=localhost
REDIS_PORT=6379

# Services
TASKS_SERVICE_HOST=localhost
TASKS_SERVICE_PORT=3006
AGENTS_SERVICE_HOST=localhost
AGENTS_SERVICE_PORT=3002
AUTOMATIONS_SERVICE_HOST=localhost
AUTOMATIONS_SERVICE_PORT=3008

# Agent API
AGENT_API_URL=http://localhost:8000

# Ports
WORKER_RUNNER_PORT=3009          # TCP
WORKER_RUNNER_HTTP_PORT=3109     # HTTP

# Optional
QUEUE_DEFAULT_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000
```

## Support

- Documentation: [README.md](./README.md)
- Issues: Create GitHub issue
- Architecture: [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md)

---

Happy coding! 🚀
