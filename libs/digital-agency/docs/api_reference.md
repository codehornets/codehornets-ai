# API Reference

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

All API requests (except health checks) require authentication using Bearer tokens.

```http
Authorization: Bearer <your_token_here>
```

## Health Endpoints

### GET /health

Basic health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "service": "digital-agency-api"
}
```

### GET /health/detailed

Detailed health check with component status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "components": {
    "api": "healthy",
    "database": "healthy",
    "cache": "healthy",
    "agents": "healthy"
  }
}
```

## Agent Endpoints

### GET /agents

List all agents with pagination and filtering.

**Query Parameters:**
- `domain` (optional): Filter by domain
- `status` (optional): Filter by status
- `skip` (optional, default: 0): Number of records to skip
- `limit` (optional, default: 100): Maximum records to return

**Response:**
```json
{
  "agents": [
    {
      "agent_id": "agent_1_1234567890",
      "name": "Campaign Creator",
      "domain": "marketing",
      "role": "Create marketing campaigns",
      "capabilities": ["campaign_creation", "content_generation"],
      "status": "active",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### GET /agents/{agent_id}

Get a specific agent by ID.

**Response:**
```json
{
  "agent_id": "agent_1_1234567890",
  "name": "Campaign Creator",
  "domain": "marketing",
  "role": "Create marketing campaigns",
  "capabilities": ["campaign_creation"],
  "model": "gpt-4",
  "temperature": 0.7,
  "tools": ["web_search"],
  "status": "active",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

### POST /agents

Create a new agent.

**Request Body:**
```json
{
  "name": "Campaign Creator",
  "domain": "marketing",
  "role": "Create marketing campaigns",
  "capabilities": ["campaign_creation"],
  "model": "gpt-4",
  "temperature": 0.7,
  "tools": ["web_search"]
}
```

**Response:** Same as GET /agents/{agent_id}

### PUT /agents/{agent_id}

Update an existing agent.

**Request Body:**
```json
{
  "name": "Updated Campaign Creator",
  "capabilities": ["campaign_creation", "analytics"]
}
```

**Response:** Updated agent data

### DELETE /agents/{agent_id}

Delete an agent.

**Response:** 204 No Content

### POST /agents/{agent_id}/activate

Activate an agent.

**Response:**
```json
{
  "agent_id": "agent_1_1234567890",
  "status": "active",
  "message": "Agent activated successfully"
}
```

### POST /agents/{agent_id}/deactivate

Deactivate an agent.

**Response:**
```json
{
  "agent_id": "agent_1_1234567890",
  "status": "inactive",
  "message": "Agent deactivated successfully"
}
```

### GET /agents/{agent_id}/metrics

Get performance metrics for an agent.

**Response:**
```json
{
  "agent_id": "agent_1_1234567890",
  "metrics": {
    "total_tasks": 42,
    "completed_tasks": 38,
    "failed_tasks": 2,
    "pending_tasks": 2,
    "success_rate": 0.95,
    "avg_completion_time": 125.5,
    "total_tokens_used": 15420
  }
}
```

## Task Endpoints

### GET /tasks

List all tasks with pagination and filtering.

**Query Parameters:**
- `agent_id` (optional): Filter by agent ID
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `skip` (optional, default: 0): Number of records to skip
- `limit` (optional, default: 100): Maximum records to return

**Response:**
```json
{
  "tasks": [
    {
      "task_id": "task_1_1234567890",
      "agent_id": "agent_1_1234567890",
      "type": "campaign_creation",
      "description": "Create campaign for product launch",
      "input_data": {},
      "priority": "high",
      "status": "completed",
      "result": {"success": true},
      "created_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T10:05:00Z"
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### GET /tasks/{task_id}

Get a specific task by ID.

**Response:**
```json
{
  "task_id": "task_1_1234567890",
  "agent_id": "agent_1_1234567890",
  "type": "campaign_creation",
  "description": "Create campaign",
  "input_data": {},
  "priority": "high",
  "status": "completed",
  "result": {
    "success": true,
    "output": "Campaign created"
  },
  "created_at": "2025-01-15T10:00:00Z",
  "started_at": "2025-01-15T10:01:00Z",
  "completed_at": "2025-01-15T10:05:00Z"
}
```

### POST /tasks

Create a new task.

**Request Body:**
```json
{
  "agent_id": "agent_1_1234567890",
  "type": "campaign_creation",
  "description": "Create marketing campaign",
  "input_data": {
    "product": "Widget Pro",
    "audience": "Tech professionals"
  },
  "priority": "high",
  "execute_immediately": false
}
```

**Response:** Task data with status "pending"

### PUT /tasks/{task_id}

Update a task.

**Request Body:**
```json
{
  "priority": "urgent",
  "description": "Updated description"
}
```

**Response:** Updated task data

### DELETE /tasks/{task_id}

Delete a task (only completed or failed tasks).

**Response:** 204 No Content

### POST /tasks/{task_id}/execute

Execute a pending task.

**Response:**
```json
{
  "task_id": "task_1_1234567890",
  "status": "running",
  "message": "Task execution started"
}
```

### POST /tasks/{task_id}/cancel

Cancel a running task.

**Response:**
```json
{
  "task_id": "task_1_1234567890",
  "status": "cancelled",
  "message": "Task cancelled successfully"
}
```

### POST /tasks/{task_id}/retry

Retry a failed task.

**Response:** Task data with reset status

## Webhook Endpoints

### POST /webhooks/workflow/completed

Handle workflow completion webhooks.

**Headers:**
- `X-Webhook-Signature`: HMAC-SHA256 signature

**Request Body:**
```json
{
  "workflow_id": "workflow_123",
  "status": "completed",
  "result": {}
}
```

**Response:**
```json
{
  "received": true,
  "workflow_id": "workflow_123",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### POST /webhooks/task/status

Handle task status change webhooks.

**Request Body:**
```json
{
  "task_id": "task_123",
  "status": "completed"
}
```

**Response:**
```json
{
  "received": true,
  "task_id": "task_123",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid input data",
  "details": {}
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authorization token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Agent not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 60 requests per minute allowed"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "path": "/api/v1/agents"
}
```

## Rate Limiting

- Default: 60 requests per minute per client
- Rate limit headers included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Timestamp when limit resets

## Pagination

List endpoints support pagination:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100, max: 1000)

Response includes pagination metadata:
```json
{
  "items": [],
  "total": 1000,
  "skip": 0,
  "limit": 100
}
```

## API Versioning

Current version: v1

Base path: `/api/v1/`

Future versions will be available at `/api/v2/`, etc.
