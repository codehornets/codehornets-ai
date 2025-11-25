# Tasks Service Usage Examples

This document provides examples of how to interact with the Tasks Service.

## Starting the Service

```bash
# Development mode
npm run serve tasks-service

# Production build
npm run build tasks-service
node dist/apps/tasks-service/src/main.js
```

## HTTP API Examples

### 1. Create a Task

```bash
curl -X POST http://localhost:3006/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Extract customer data",
    "description": "Extract customer information from CRM",
    "agent_id": "550e8400-e29b-41d4-a716-446655440001",
    "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
    "priority": "high",
    "input_data": {
      "customerId": "12345",
      "dataSource": "salesforce"
    }
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "title": "Extract customer data",
  "description": "Extract customer information from CRM",
  "agent_id": "550e8400-e29b-41d4-a716-446655440001",
  "workspace_id": "550e8400-e29b-41d4-a716-446655440002",
  "status": "pending",
  "priority": "high",
  "input_data": {
    "customerId": "12345",
    "dataSource": "salesforce"
  },
  "created_at": "2025-11-25T10:30:00Z",
  "updated_at": "2025-11-25T10:30:00Z"
}
```

### 2. List Tasks

```bash
# Get all pending tasks
curl "http://localhost:3006/tasks?status=pending"

# Get tasks for specific agent
curl "http://localhost:3006/tasks?agent_id=550e8400-e29b-41d4-a716-446655440001"

# Get high priority running tasks
curl "http://localhost:3006/tasks?status=running&priority=high"

# Get tasks sorted by creation date
curl "http://localhost:3006/tasks?sort_by=created_at&sort_order=DESC"
```

### 3. Get Single Task

```bash
curl "http://localhost:3006/tasks/550e8400-e29b-41d4-a716-446655440003"
```

### 4. Update Task

```bash
curl -X PATCH http://localhost:3006/tasks/550e8400-e29b-41d4-a716-446655440003 \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "critical",
    "input_data": {
      "customerId": "67890",
      "dataSource": "hubspot"
    }
  }'
```

### 5. Execute Task

```bash
curl -X POST "http://localhost:3006/tasks/550e8400-e29b-41d4-a716-446655440003/execute"
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "status": "running",
  "started_at": "2025-11-25T10:35:00Z",
  ...
}
```

### 6. Cancel Task

```bash
curl -X POST "http://localhost:3006/tasks/550e8400-e29b-41d4-a716-446655440003/cancel"
```

### 7. Retry Task

```bash
curl -X POST "http://localhost:3006/tasks/550e8400-e29b-41d4-a716-446655440003/retry"
```

### 8. Delete Task

```bash
curl -X DELETE "http://localhost:3006/tasks/550e8400-e29b-41d4-a716-446655440003"
```

## Microservice Communication Examples

### Using NestJS Microservices Client

```typescript
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

// Create client
const client: ClientProxy = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    host: 'localhost',
    port: 3006,
  },
});

// Create task
const createTask = await client.send(
  { cmd: 'create_task' },
  {
    title: 'Process data',
    agent_id: '550e8400-e29b-41d4-a716-446655440001',
    priority: 'high',
  }
).toPromise();

// Get tasks
const tasks = await client.send(
  { cmd: 'get_tasks' },
  { status: 'pending', agent_id: '550e8400-e29b-41d4-a716-446655440001' }
).toPromise();

// Execute task
const runningTask = await client.send(
  { cmd: 'execute_task' },
  { id: '550e8400-e29b-41d4-a716-446655440003' }
).toPromise();

// Mark task completed (internal use)
const completedTask = await client.send(
  { cmd: 'mark_task_completed' },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    output_data: { result: 'success', recordsProcessed: 100 }
  }
).toPromise();

// Mark task failed (internal use)
const failedTask = await client.send(
  { cmd: 'mark_task_failed' },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    error_message: 'Connection timeout'
  }
).toPromise();
```

## Event Listeners

The service emits events that you can listen to:

```typescript
import { OnEvent } from '@nestjs/event-emitter';

export class TaskEventListener {
  @OnEvent('task.created')
  handleTaskCreated(task: Task) {
    console.log(`New task created: ${task.id}`);
  }

  @OnEvent('task.execution.started')
  handleTaskExecutionStarted(task: Task) {
    console.log(`Task ${task.id} started execution`);
    // Trigger agent via message queue
  }

  @OnEvent('task.completed')
  handleTaskCompleted(task: Task) {
    console.log(`Task ${task.id} completed in ${task.duration}ms`);
    // Send notification, update dependent tasks, etc.
  }

  @OnEvent('task.failed')
  handleTaskFailed(task: Task) {
    console.error(`Task ${task.id} failed: ${task.error_message}`);
    // Send alert, retry logic, etc.
  }
}
```

## Task Lifecycle Example

```javascript
// 1. Create task
POST /tasks
{ "title": "Data extraction", "agent_id": "...", "priority": "high" }
→ status: "pending"

// 2. Execute task
POST /tasks/{id}/execute
→ status: "running"
→ started_at: timestamp

// 3a. Success path
(Internal) POST { cmd: 'mark_task_completed' }
→ status: "completed"
→ completed_at: timestamp
→ duration: calculated
→ output_data: set

// 3b. Failure path
(Internal) POST { cmd: 'mark_task_failed' }
→ status: "failed"
→ error_message: set

// 4. Retry if needed
POST /tasks/{id}/retry
→ status: "pending"
→ started_at: null
→ error_message: null
```

## Integration with Worker Runner

The Worker Runner service would typically:

1. Listen for `task.execution.started` events
2. Execute the actual task logic
3. Call `mark_task_completed` or `mark_task_failed` based on result

```typescript
// In Worker Runner Service
@OnEvent('task.execution.started')
async handleTaskExecution(task: Task) {
  try {
    // Execute task with agent
    const result = await this.agentService.executeTask(task);

    // Mark completed
    await this.tasksClient.send(
      { cmd: 'mark_task_completed' },
      { id: task.id, output_data: result }
    ).toPromise();
  } catch (error) {
    // Mark failed
    await this.tasksClient.send(
      { cmd: 'mark_task_failed' },
      { id: task.id, error_message: error.message }
    ).toPromise();
  }
}
```

## Error Handling

The service validates status transitions and throws appropriate errors:

```bash
# Try to execute a running task
curl -X POST "http://localhost:3006/tasks/{id}/execute"
→ 400 Bad Request: "Cannot execute task with status: running. Task must be in pending state."

# Try to cancel a completed task
curl -X POST "http://localhost:3006/tasks/{id}/cancel"
→ 400 Bad Request: "Cannot cancel task with status: completed. Task must be running or pending."

# Try to retry a pending task
curl -X POST "http://localhost:3006/tasks/{id}/retry"
→ 400 Bad Request: "Cannot retry task with status: pending. Task must be failed or cancelled."
```

## Performance Considerations

- All filter queries use database indexes
- Sorting by `created_at`, `started_at`, `completed_at`, `priority`, and `status` is optimized
- Common query patterns (by agent, workspace, campaign + status) are indexed
- JSONB fields (`input_data`, `output_data`) support efficient storage and retrieval

## Database Setup

Run the migration to create the tasks table:

```bash
psql -U user -d funnel_agents -f apps/tasks-service/migrations/001_create_tasks_table.sql
```
