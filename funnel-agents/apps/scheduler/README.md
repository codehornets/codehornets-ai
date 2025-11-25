# Scheduler Service

The Scheduler Service provides comprehensive cron-based task scheduling for the FunnelAgents platform. It supports workflow execution, report generation, agent task creation, and custom scheduled operations.

## Features

- **Dynamic Cron Scheduling**: Create and manage scheduled tasks via API
- **Multiple Task Types**: Workflow, Report, Agent, and Custom task support
- **Execution Tracking**: Complete history and statistics for all task executions
- **Automatic Retries**: Configurable retry logic with failure tracking
- **Real-time Monitoring**: Health endpoints showing active jobs and upcoming runs
- **Microservice Integration**: TCP-based communication with other services
- **Hybrid Architecture**: Both HTTP REST API and microservice message patterns

## Architecture

### Modules

1. **ScheduledTasksModule**: Core task management and database operations
2. **CronJobsModule**: Cron job execution and lifecycle management
3. **DispatchersModule**: Service-specific task dispatchers

### Entities

#### ScheduledTask
- Task definition and configuration
- Cron expression and scheduling info
- Execution statistics and state

#### TaskExecution
- Individual execution records
- Success/failure tracking
- Performance metrics

## API Endpoints

### HTTP REST API (Port 3110)

#### Tasks Management

```bash
# Create a new scheduled task
POST /scheduler/tasks
Body: {
  "name": "Daily Report",
  "description": "Generate daily analytics report",
  "cron_expression": "0 9 * * *",
  "task_type": "report",
  "target_id": "report-123",
  "enabled": true,
  "config": {
    "recipients": ["admin@example.com"]
  }
}

# Get all tasks
GET /scheduler/tasks?enabled=true&task_type=workflow

# Get specific task
GET /scheduler/tasks/:id

# Update task
PUT /scheduler/tasks/:id
Body: { "cron_expression": "0 10 * * *" }

# Delete task
DELETE /scheduler/tasks/:id

# Enable/Disable task
POST /scheduler/tasks/:id/enable
POST /scheduler/tasks/:id/disable

# Manually trigger task
POST /scheduler/tasks/:id/trigger
```

#### Monitoring & Statistics

```bash
# Get upcoming scheduled runs
GET /scheduler/next-runs?limit=10

# Get task executions
GET /scheduler/executions?task_id=xxx&status=success

# Get executions for specific task
GET /scheduler/tasks/:id/executions?limit=20

# Get task statistics
GET /scheduler/tasks/:id/stats

# Get overall statistics
GET /scheduler/stats

# Health check
GET /scheduler/health
```

### Microservice Patterns (Port 3010)

```typescript
// Create task
client.send('scheduler.task.create', createTaskDto)

// Update task
client.send('scheduler.task.update', { id, updates })

// Delete task
client.send('scheduler.task.delete', { id })

// Trigger task
client.send('scheduler.task.trigger', { id })

// List tasks
client.send('scheduler.tasks.list', { filters })

// Get task
client.send('scheduler.task.get', { id })

// Health check
client.send('scheduler.health.check', {})
```

## Task Types

### 1. Workflow Tasks
Executes automated workflows via the Automations Service.

```json
{
  "task_type": "workflow",
  "target_id": "workflow-uuid",
  "config": {
    "input_data": {},
    "timeout": 600
  }
}
```

### 2. Report Tasks
Generates reports via the Reports Service.

```json
{
  "task_type": "report",
  "target_id": "report-uuid",
  "config": {
    "format": "pdf",
    "recipients": ["email@example.com"]
  }
}
```

### 3. Agent Tasks
Creates tasks for AI agents via the Tasks Service.

```json
{
  "task_type": "agent",
  "target_id": "agent-uuid",
  "config": {
    "priority": "high",
    "instructions": "Process new leads"
  }
}
```

### 4. Custom Tasks
Flexible custom task execution with various handlers.

```json
{
  "task_type": "custom",
  "config": {
    "type": "webhook",
    "webhook_url": "https://api.example.com/callback",
    "method": "POST",
    "headers": {},
    "body": {}
  }
}
```

**Custom Task Types:**
- `webhook`: HTTP webhook calls
- `script`: Execute custom scripts
- `notification`: Send notifications (email, Slack, etc.)

## Cron Expression Format

Standard cron format (minute hour day month weekday):

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Examples

```bash
"0 9 * * *"      # Every day at 9:00 AM
"0 */6 * * *"    # Every 6 hours
"30 2 * * 1"     # Every Monday at 2:30 AM
"0 0 1 * *"      # First day of every month at midnight
"*/15 * * * *"   # Every 15 minutes
```

## Configuration

### Environment Variables

```bash
# Scheduler Service
SCHEDULER_HOST=0.0.0.0
SCHEDULER_PORT=3010
SCHEDULER_HTTP_PORT=3110

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=funnelagents
DB_SYNCHRONIZE=false
DB_LOGGING=false

# Dependent Services
TASKS_SERVICE_HOST=localhost
TASKS_SERVICE_PORT=3006

AUTOMATIONS_SERVICE_HOST=localhost
AUTOMATIONS_SERVICE_PORT=3007

REPORTS_SERVICE_HOST=localhost
REPORTS_SERVICE_PORT=3008
```

## Database Schema

### scheduled_tasks table

```sql
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  task_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  run_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  config JSONB,
  created_by VARCHAR(255),
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 300,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### task_executions table

```sql
CREATE TABLE task_executions (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  error_message TEXT,
  error_details JSONB,
  result JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## System Cron Jobs

The service runs several system-level cron jobs:

1. **check-due-tasks** (every minute): Checks for and executes due tasks
2. **cleanup-executions** (daily at 2 AM): Cleans up old execution records
3. **health-check** (every 5 minutes): Performs system health checks

## Error Handling

### Automatic Retries

Tasks automatically retry on failure based on `max_retries` setting. After exceeding max retries, the task is automatically disabled.

### Timeout Handling

Tasks that exceed `timeout_seconds` are marked with timeout status and counted as failures.

### Failure Recovery

- Failed tasks maintain failure count
- Last error message is stored for debugging
- Tasks can be manually re-enabled after fixing issues

## Monitoring

### Health Endpoint Response

```json
{
  "status": "healthy",
  "timestamp": "2025-11-25T10:00:00Z",
  "scheduler": {
    "total_tasks": 15,
    "enabled_tasks": 12,
    "disabled_tasks": 3,
    "active_cron_jobs": 5,
    "dynamic_cron_jobs": 12
  },
  "next_scheduled_runs": [...],
  "execution_stats": {
    "total": 1000,
    "success": 950,
    "failed": 50,
    "running": 0,
    "avgDuration": 1234
  }
}
```

### Execution Statistics

Track performance metrics:
- Total executions
- Success/failure rates
- Average execution duration
- Currently running tasks

## Usage Examples

### Create Daily Report Task

```typescript
import { ClientProxy } from '@nestjs/microservices';

// Via microservice
const result = await firstValueFrom(
  schedulerClient.send('scheduler.task.create', {
    name: 'Daily Analytics Report',
    cron_expression: '0 9 * * *', // 9 AM daily
    task_type: 'report',
    target_id: 'analytics-report-123',
    config: {
      format: 'pdf',
      recipients: ['team@example.com']
    }
  })
);
```

### Create Hourly Workflow

```bash
# Via HTTP API
curl -X POST http://localhost:3110/scheduler/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hourly Lead Processing",
    "cron_expression": "0 * * * *",
    "task_type": "workflow",
    "target_id": "lead-processing-workflow",
    "enabled": true
  }'
```

### Monitor Task Execution

```bash
# Get task execution history
curl http://localhost:3110/scheduler/tasks/{task-id}/executions

# Get task statistics
curl http://localhost:3110/scheduler/tasks/{task-id}/stats

# Check upcoming runs
curl http://localhost:3110/scheduler/next-runs?limit=5
```

## Development

### Build

```bash
nx build scheduler
```

### Run

```bash
nx serve scheduler
```

### Test

```bash
nx test scheduler
```

### Lint

```bash
nx lint scheduler
```

## Dependencies

- `@nestjs/schedule`: Cron job scheduling
- `@nestjs/typeorm`: Database ORM
- `@nestjs/microservices`: TCP communication
- `cron-parser`: Cron expression parsing
- `class-validator`: Input validation
- `class-transformer`: DTO transformation

## Future Enhancements

- [ ] Distributed locking for clustered deployments
- [ ] Task execution history cleanup service
- [ ] Advanced scheduling (one-time, recurring with end date)
- [ ] Task dependencies and chains
- [ ] Webhook notifications on task completion
- [ ] Dashboard for visual task management
- [ ] Import/export task configurations
- [ ] Task templates and presets

## License

MIT
