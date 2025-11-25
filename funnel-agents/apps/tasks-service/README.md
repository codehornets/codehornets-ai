# Tasks Service

The Tasks Service handles all task-related operations including CRUD operations, task execution, status management, and lifecycle tracking.

## Overview

- **Port**: 3006
- **Framework**: NestJS with TypeORM
- **Database**: PostgreSQL
- **Transport**: TCP Microservice

## Features

- Task CRUD operations
- Task execution and lifecycle management
- Status transitions with validation
- Event emission for status changes
- Support for filtering and sorting
- Input/Output data tracking
- Error handling and retry mechanism
- Timing and duration tracking

## Task Model

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  agent_id: string;
  workspace_id?: string;
  campaign_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  duration?: number; // in milliseconds
  created_at: Date;
  updated_at: Date;
}
```

## API Endpoints

### HTTP Endpoints

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "title": "Process customer data",
  "description": "Extract and process customer information",
  "agent_id": "uuid",
  "workspace_id": "uuid",
  "campaign_id": "uuid",
  "priority": "high",
  "input_data": {
    "customerId": "12345"
  }
}
```

#### List Tasks
```http
GET /tasks?status=pending&agent_id=uuid&sort_by=created_at&sort_order=DESC
```

Query Parameters:
- `status`: Filter by task status (pending, running, completed, failed, cancelled)
- `priority`: Filter by priority (low, medium, high, critical)
- `agent_id`: Filter by agent ID
- `workspace_id`: Filter by workspace ID
- `campaign_id`: Filter by campaign ID
- `sort_by`: Sort field (created_at, started_at, completed_at, priority, status)
- `sort_order`: Sort order (ASC, DESC)

#### Get Task by ID
```http
GET /tasks/:id
```

#### Update Task
```http
PATCH /tasks/:id
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "critical",
  "input_data": {
    "customerId": "67890"
  }
}
```

#### Delete Task
```http
DELETE /tasks/:id
```

#### Execute Task
```http
POST /tasks/:id/execute
```

Starts task execution:
- Changes status from `pending` to `running`
- Sets `started_at` timestamp
- Emits `task.execution.started` event

#### Cancel Task
```http
POST /tasks/:id/cancel
```

Cancels a running or pending task:
- Changes status to `cancelled`
- Sets `completed_at` and `duration` if task was running
- Emits `task.cancelled` event

Valid transitions:
- `pending` → `cancelled`
- `running` → `cancelled`

#### Retry Task
```http
POST /tasks/:id/retry
```

Retries a failed or cancelled task:
- Resets status to `pending`
- Clears error message and timing data
- Emits `task.retry` event

Valid transitions:
- `failed` → `pending`
- `cancelled` → `pending`

### Microservice Message Patterns

The service also responds to internal microservice messages:

- `{ cmd: 'create_task' }` - Create a new task
- `{ cmd: 'get_tasks' }` - List tasks with filters
- `{ cmd: 'get_task' }` - Get task by ID
- `{ cmd: 'update_task' }` - Update task
- `{ cmd: 'delete_task' }` - Delete task
- `{ cmd: 'execute_task' }` - Execute task
- `{ cmd: 'cancel_task' }` - Cancel task
- `{ cmd: 'retry_task' }` - Retry task
- `{ cmd: 'mark_task_completed' }` - Mark task as completed (internal use)
- `{ cmd: 'mark_task_failed' }` - Mark task as failed (internal use)

## Status Transitions

```
pending ──execute──> running ──┬──> completed
   │                           ├──> failed
   │                           └──> cancelled
   └──cancel──> cancelled

failed ──retry──> pending
cancelled ──retry──> pending
```

### Status Validation Rules

1. **Execute**: Only `pending` tasks can be executed
2. **Cancel**: Only `pending` or `running` tasks can be cancelled
3. **Retry**: Only `failed` or `cancelled` tasks can be retried
4. **Mark Completed**: Only `running` tasks can be marked as completed
5. **Mark Failed**: Only `running` tasks can be marked as failed

## Events

The service emits the following events for real-time updates:

- `task.created` - When a task is created
- `task.updated` - When a task is updated
- `task.deleted` - When a task is deleted
- `task.execution.started` - When task execution begins
- `task.cancelled` - When a task is cancelled
- `task.retry` - When a task is retried
- `task.completed` - When a task completes successfully
- `task.failed` - When a task fails

## Database Schema

The service uses TypeORM with PostgreSQL. The following indexes are created for optimal query performance:

- Composite index on `(status, created_at)`
- Composite index on `(agent_id, status)`
- Composite index on `(workspace_id, status)`
- Composite index on `(campaign_id, status)`
- Individual indexes on `agent_id`, `workspace_id`, `campaign_id`

## Environment Variables

```env
# Tasks Service
TASKS_SERVICE_HOST=localhost
TASKS_SERVICE_PORT=3006

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/funnel_agents

# Environment
NODE_ENV=development
```

## Running the Service

### Development
```bash
npm run serve tasks-service
```

### Build
```bash
npm run build tasks-service
```

### Test
```bash
npm run test tasks-service
```

## Future Enhancements

1. **Message Queue Integration**: Execute endpoint will trigger actual agent execution via RabbitMQ/Redis
2. **Task Scheduling**: Support for scheduled task execution
3. **Task Dependencies**: Support for task chains and dependencies
4. **Pagination**: Add pagination support for task listing
5. **Real-time Updates**: WebSocket support for live task status updates
6. **Task History**: Audit log for task state changes
7. **Bulk Operations**: Support for bulk task operations
