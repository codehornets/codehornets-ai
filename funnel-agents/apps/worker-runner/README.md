# Worker Runner Service

The Worker Runner service is a background job processing service for FunnelAgents that consumes jobs from BullMQ queues and executes AI agents.

## Overview

This service provides three main processors:

1. **TaskProcessor** - Processes task execution jobs from the `tasks` queue
2. **AgentProcessor** - Handles direct agent invocation jobs from the `agents` queue
3. **WorkflowProcessor** - Executes workflow automation jobs from the `automations` queue

## Architecture

```
┌─────────────────┐
│  Redis/BullMQ   │
│     Queues      │
└────────┬────────┘
         │
    ┌────┼────┬────────────┐
    │    │    │            │
    v    v    v            v
┌───────────────┐    ┌─────────┐
│ TaskProcessor │    │ Health  │
│AgentProcessor │───>│ Service │
│WorkflowProc.. │    └─────────┘
└───────┬───────┘
        │
   ┌────┼────┬───────────┐
   v    v    v           v
┌──────────────────────────┐
│   Microservices (TCP)    │
│  - tasks-service         │
│  - agents-service        │
│  - automations-service   │
└──────────────────────────┘
        │
        v
┌──────────────────────────┐
│   Python Agent API       │
│   (FastAPI - Port 8000)  │
└──────────────────────────┘
```

## Features

- **Queue Processing**: Consumes and processes jobs from three BullMQ queues
- **Microservice Communication**: TCP-based communication with other services
- **Agent Execution**: Invokes Python AI agents via HTTP API
- **Workflow Orchestration**: Node-by-node workflow execution with conditions
- **Health Monitoring**: Comprehensive health check endpoints
- **Error Handling**: Automatic retry logic with exponential backoff
- **Progress Tracking**: Real-time job progress updates
- **Logging**: Context-aware logging with correlation IDs

## Queue Processors

### TaskProcessor (`tasks` queue)

Processes task execution jobs with the following flow:

1. Fetch task details from tasks-service
2. Update task status to 'running'
3. Fetch agent details from agents-service
4. Invoke Python agent via FastAPI
5. Update task with results (completed/failed)
6. Store output data and execution log

**Job Data Format:**
```typescript
{
  type: 'execute_task',
  payload: {
    taskId: string,
    workspaceId?: string
  },
  metadata?: {
    correlationId?: string,
    timestamp?: Date
  }
}
```

### AgentProcessor (`agents` queue)

Handles direct agent invocation without task persistence:

1. Fetch agent details from agents-service
2. Invoke Python agent with provided input
3. Update agent statistics
4. Return execution results

**Job Data Format:**
```typescript
{
  type: 'execute_agent',
  payload: {
    agentId: string,
    taskDescription?: string,
    inputData?: any,
    context?: Record<string, any>,
    workspaceId?: string
  }
}
```

### WorkflowProcessor (`automations` queue)

Executes multi-node workflows:

1. Fetch workflow definition
2. Fetch workflow run record
3. Execute nodes starting from trigger
4. Handle node types: trigger, agent, condition, delay, webhook, email
5. Evaluate edge conditions
6. Update workflow run status and execution log

**Job Data Format:**
```typescript
{
  type: 'execute_workflow',
  payload: {
    workflowRunId: string,
    workflowId: string,
    triggerData?: any
  }
}
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Service Ports
WORKER_RUNNER_HOST=0.0.0.0
WORKER_RUNNER_PORT=3009          # TCP port
WORKER_RUNNER_HTTP_PORT=3109     # HTTP port for health checks

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Microservices
TASKS_SERVICE_HOST=localhost
TASKS_SERVICE_PORT=3006

AGENTS_SERVICE_HOST=localhost
AGENTS_SERVICE_PORT=3002

AUTOMATIONS_SERVICE_HOST=localhost
AUTOMATIONS_SERVICE_PORT=3008

# Python Agent API
AGENT_API_URL=http://localhost:8000
AGENT_API_TIMEOUT=300000

# Queue Configuration
QUEUE_DEFAULT_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000
QUEUE_REMOVE_COMPLETED=100
QUEUE_REMOVE_FAILED=50
```

## Installation

```bash
# Install dependencies
npm install

# Development
npm run serve worker-runner

# Build
npm run build worker-runner

# Production
npm run start worker-runner
```

## Health Checks

The service exposes HTTP endpoints for health monitoring:

### GET /health
Basic health check
```json
{
  "status": "healthy",
  "timestamp": "2024-11-25T10:00:00.000Z",
  "uptime": 3600
}
```

### GET /health/queues
Queue-specific health metrics
```json
{
  "tasks": {
    "name": "tasks",
    "status": "healthy",
    "metrics": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3,
      "delayed": 0,
      "paused": false
    }
  },
  "agents": { ... },
  "automations": { ... }
}
```

### GET /health/detailed
Comprehensive health status
```json
{
  "status": "healthy",
  "timestamp": "2024-11-25T10:00:00.000Z",
  "uptime": 3600,
  "queues": { ... }
}
```

## Job Retry Logic

### Default Configuration

- **Attempts**: 3 retries
- **Backoff**: Exponential with 2s base delay
- **Task Queue**: 3 attempts
- **Agent Queue**: 3 attempts
- **Automation Queue**: 2 attempts (longer running)

### Retry Intervals

- 1st retry: after 2 seconds
- 2nd retry: after 4 seconds
- 3rd retry: after 8 seconds

## Logging

The service uses structured logging with context:

```typescript
[TaskProcessor] Processing task task-123 (Job job-456, Correlation: corr-789)
[TaskProcessor] Fetching task details for task-123...
[TaskProcessor] Updating task status to 'running'...
[TaskProcessor] Fetching agent details for agent-123...
[TaskProcessor] Invoking agent Test Agent...
[TaskProcessor] Agent execution successful. Updating task...
[TaskProcessor] Task task-123 completed successfully in 1234ms
```

## Error Handling

The service implements comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **Service Unavailable**: Logged and retried
3. **Agent Failures**: Task marked as failed with error details
4. **Timeout**: Configurable timeouts for each operation
5. **Validation Errors**: Immediate failure with descriptive message

## Development

### Running Tests

```bash
# Unit tests
npm run test worker-runner

# Watch mode
npm run test:watch worker-runner

# Coverage
npm run test:cov worker-runner
```

### Local Development Setup

1. Start Redis:
```bash
docker run -d -p 6379:6379 redis:alpine
```

2. Start required services:
```bash
npm run serve tasks-service &
npm run serve agents-service &
npm run serve automations-service &
```

3. Start Python agent API:
```bash
cd digital-agency/api
uvicorn main:app --reload --port 8000
```

4. Start worker-runner:
```bash
npm run serve worker-runner
```

## Monitoring

### Metrics to Monitor

- Queue depths (waiting, active)
- Job completion rates
- Job failure rates
- Average execution time
- Worker active/idle count
- Health check status

### Alerting Recommendations

- Alert if queue depth > 100 for 5 minutes
- Alert if failure rate > 10%
- Alert if health check fails
- Alert if no jobs processed in 15 minutes

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/apps/worker-runner ./
CMD ["node", "main.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker-runner
spec:
  replicas: 3
  selector:
    matchLabels:
      app: worker-runner
  template:
    metadata:
      labels:
        app: worker-runner
    spec:
      containers:
      - name: worker-runner
        image: funnelagents/worker-runner:latest
        env:
        - name: REDIS_HOST
          value: redis-service
        - name: REDIS_PORT
          value: "6379"
        ports:
        - containerPort: 3009
          name: tcp
        - containerPort: 3109
          name: http
        livenessProbe:
          httpGet:
            path: /health
            port: 3109
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3109
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Troubleshooting

### Common Issues

1. **Jobs Not Processing**
   - Check Redis connection
   - Verify queue registration
   - Check processor logs

2. **Agent API Timeouts**
   - Increase `AGENT_API_TIMEOUT`
   - Check Python API health
   - Review network connectivity

3. **High Failure Rate**
   - Check agent status (must be 'active')
   - Review task input data format
   - Check Python API logs

4. **Memory Issues**
   - Reduce `QUEUE_REMOVE_COMPLETED`
   - Reduce `QUEUE_REMOVE_FAILED`
   - Scale horizontally

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm run serve worker-runner
```

## API Integration

### Python Agent API Contract

The worker expects the Python API to implement:

**POST /api/agents/execute**

Request:
```json
{
  "agent_id": "uuid",
  "agent_name": "string",
  "task_id": "uuid",
  "task_description": "string",
  "input_data": {},
  "context": {
    "workspace_id": "uuid",
    "domain": "string",
    "skills": ["string"],
    "tools": ["string"]
  },
  "settings": {},
  "prompt_template": "string",
  "model": "string"
}
```

Response:
```json
{
  "success": true,
  "task_id": "uuid",
  "agent_id": "uuid",
  "output": {},
  "execution_log": ["string"],
  "execution_time": 1234,
  "tokens_used": 100,
  "model_used": "gpt-4",
  "error": "string"
}
```

## Contributing

See main repository CONTRIBUTING.md for guidelines.

## License

MIT
