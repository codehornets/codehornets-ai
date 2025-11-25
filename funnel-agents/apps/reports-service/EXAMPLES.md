# Reports Service - API Examples

## Prerequisites

Ensure the service is running:
```bash
nx serve reports-service
```

The service will be available at `http://localhost:3008`

## Example API Calls

### 1. Get Task Analytics

**Basic Request:**
```bash
curl -X GET "http://localhost:3008/analytics/tasks"
```

**With Date Range:**
```bash
curl -X GET "http://localhost:3008/analytics/tasks?start_date=2024-01-01&end_date=2024-12-31"
```

**With Workspace Filter:**
```bash
curl -X GET "http://localhost:3008/analytics/tasks?workspace_id=550e8400-e29b-41d4-a716-446655440000"
```

**With Agent Filter:**
```bash
curl -X GET "http://localhost:3008/analytics/tasks?agent_id=550e8400-e29b-41d4-a716-446655440001"
```

**Combined Filters:**
```bash
curl -X GET "http://localhost:3008/analytics/tasks?start_date=2024-01-01&end_date=2024-12-31&workspace_id=550e8400-e29b-41d4-a716-446655440000&agent_id=550e8400-e29b-41d4-a716-446655440001"
```

**Expected Response:**
```json
{
  "total": 150,
  "completed": 120,
  "failed": 15,
  "pending": 10,
  "running": 5,
  "success_rate": 80.0,
  "avg_completion_time": 45.5,
  "tasks_by_status": {
    "COMPLETED": 120,
    "FAILED": 15,
    "PENDING": 10,
    "RUNNING": 5
  },
  "tasks_by_day": [
    {
      "date": "2024-01-01",
      "count": 25,
      "completed": 20,
      "failed": 5
    },
    {
      "date": "2024-01-02",
      "count": 30,
      "completed": 25,
      "failed": 5
    }
  ]
}
```

### 2. Get Agent Analytics

**Basic Request:**
```bash
curl -X GET "http://localhost:3008/analytics/agents"
```

**With Domain Filter:**
```bash
curl -X GET "http://localhost:3008/analytics/agents?domain=sales"
```

**With Date Range and Workspace:**
```bash
curl -X GET "http://localhost:3008/analytics/agents?start_date=2024-01-01&end_date=2024-12-31&workspace_id=550e8400-e29b-41d4-a716-446655440000"
```

**Expected Response:**
```json
{
  "total_agents": 10,
  "active_agents": 7,
  "agents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Sales Agent 1",
      "domain": "sales",
      "status": "IDLE",
      "tasks_completed": 45,
      "tasks_failed": 5,
      "success_rate": 90.0,
      "avg_completion_time": 42.3,
      "avg_feedback_rating": 0
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Support Agent 1",
      "domain": "support",
      "status": "BUSY",
      "tasks_completed": 60,
      "tasks_failed": 3,
      "success_rate": 95.24,
      "avg_completion_time": 38.7,
      "avg_feedback_rating": 0
    }
  ]
}
```

### 3. Get Domain Analytics

**Basic Request:**
```bash
curl -X GET "http://localhost:3008/analytics/domains"
```

**With Workspace Filter:**
```bash
curl -X GET "http://localhost:3008/analytics/domains?workspace_id=550e8400-e29b-41d4-a716-446655440000"
```

**With Date Range:**
```bash
curl -X GET "http://localhost:3008/analytics/domains?start_date=2024-01-01&end_date=2024-12-31"
```

**Expected Response:**
```json
{
  "domains": [
    {
      "domain": "sales",
      "agent_count": 5,
      "active_count": 4,
      "total_tasks": 225,
      "completed_tasks": 200,
      "success_rate": 88.89,
      "avg_completion_time": 43.2
    },
    {
      "domain": "support",
      "agent_count": 3,
      "active_count": 2,
      "total_tasks": 180,
      "completed_tasks": 170,
      "success_rate": 94.44,
      "avg_completion_time": 35.6
    },
    {
      "domain": "marketing",
      "agent_count": 2,
      "active_count": 1,
      "total_tasks": 95,
      "completed_tasks": 85,
      "success_rate": 89.47,
      "avg_completion_time": 52.1
    }
  ]
}
```

### 4. Export Analytics

**Export as JSON:**
```bash
curl -X GET "http://localhost:3008/analytics/export/json"
```

**Export as CSV:**
```bash
curl -X GET "http://localhost:3008/analytics/export/csv" --output analytics.csv
```

**Export with Filters:**
```bash
curl -X GET "http://localhost:3008/analytics/export/json?start_date=2024-01-01&end_date=2024-12-31&workspace_id=550e8400-e29b-41d4-a716-446655440000"
```

**Expected Response (JSON format):**
```json
{
  "format": "json",
  "data": {
    "tasks": { /* task analytics */ },
    "agents": { /* agent analytics */ },
    "domains": { /* domain analytics */ },
    "generated_at": "2024-11-25T10:30:00.000Z",
    "filters": {
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "workspace_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  },
  "contentType": "application/json",
  "filename": "analytics-1732531800000.json"
}
```

**Expected Response (CSV format):**
```json
{
  "format": "csv",
  "data": "TASK ANALYTICS\nMetric,Value\nTotal,150\n...",
  "contentType": "text/csv",
  "filename": "analytics-1732531800000.csv"
}
```

**Expected CSV Content:**
```csv
TASK ANALYTICS
Metric,Value
Total,150
Completed,120
Failed,15
Pending,10
Running,5
Success Rate,80%
Avg Completion Time,45.5s

TASKS BY DAY
Date,Total,Completed,Failed
2024-01-01,25,20,5
2024-01-02,30,25,5

AGENT ANALYTICS
ID,Name,Domain,Status,Tasks Completed,Tasks Failed,Success Rate,Avg Completion Time,Avg Feedback
550e8400-e29b-41d4-a716-446655440001,Sales Agent 1,sales,IDLE,45,5,90%,42.3s,0

DOMAIN ANALYTICS
Domain,Agent Count,Active Count,Total Tasks,Completed Tasks,Success Rate,Avg Completion Time
sales,5,4,225,200,88.89%,43.2s
support,3,2,180,170,94.44%,35.6s
```

## Using with JavaScript/TypeScript

```typescript
// Get task analytics
const response = await fetch('http://localhost:3008/analytics/tasks?start_date=2024-01-01');
const taskAnalytics = await response.json();

console.log(`Total tasks: ${taskAnalytics.total}`);
console.log(`Success rate: ${taskAnalytics.success_rate}%`);

// Get agent analytics with domain filter
const agentResponse = await fetch('http://localhost:3008/analytics/agents?domain=sales');
const agentAnalytics = await agentResponse.json();

console.log(`Active agents: ${agentAnalytics.active_agents}`);

// Export as CSV
const exportResponse = await fetch('http://localhost:3008/analytics/export/csv');
const csvData = await exportResponse.json();

// Create download link
const blob = new Blob([csvData.data], { type: csvData.contentType });
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = csvData.filename;
a.click();
```

## Using with Python

```python
import requests
from datetime import datetime, timedelta

# Calculate date range
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

# Get task analytics
response = requests.get(
    'http://localhost:3008/analytics/tasks',
    params={
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
    }
)
task_analytics = response.json()

print(f"Total tasks: {task_analytics['total']}")
print(f"Success rate: {task_analytics['success_rate']}%")

# Export as CSV
export_response = requests.get('http://localhost:3008/analytics/export/csv')
csv_data = export_response.json()

# Save to file
with open(csv_data['filename'], 'w') as f:
    f.write(csv_data['data'])
```

## Testing with Sample Data

To test the endpoints, you'll need to have some data in the database. You can:

1. **Use the API Gateway** to create tasks and agents
2. **Insert test data directly** into the database
3. **Use the seed script** (if available)

Example seed data SQL:

```sql
-- Insert test agents
INSERT INTO agents (id, name, type, status, domain, capabilities, config, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sales Agent 1', 'WORKER', 'IDLE', 'sales', '[]', '{}', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Support Agent 1', 'WORKER', 'BUSY', 'support', '[]', '{}', NOW(), NOW());

-- Insert test tasks
INSERT INTO tasks (id, name, status, priority, agent_id, input, started_at, completed_at, created_at, updated_at)
VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Test Task 1', 'COMPLETED', 'HIGH', '550e8400-e29b-41d4-a716-446655440001', '{}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '2 hours', NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', 'Test Task 2', 'FAILED', 'MEDIUM', '550e8400-e29b-41d4-a716-446655440001', '{}', NOW() - INTERVAL '2 hours', NULL, NOW() - INTERVAL '3 hours', NOW());
```

## Error Handling

### Invalid Format
```bash
curl -X GET "http://localhost:3008/analytics/export/xml"
```

Response:
```json
{
  "statusCode": 400,
  "message": "Supported formats: csv, pdf, json",
  "error": "Bad Request"
}
```

### Invalid Date
```bash
curl -X GET "http://localhost:3008/analytics/tasks?start_date=invalid-date"
```

Response:
```json
{
  "statusCode": 400,
  "message": ["start_date must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

## Performance Tips

1. **Use Date Ranges**: Always specify date ranges to limit query scope
2. **Filter by Workspace**: Use workspace_id to scope queries
3. **Cache Results**: Consider caching analytics results on the client side
4. **Use Domain Filters**: For agent analytics, filter by domain to reduce data

## Monitoring

Monitor the service logs for performance:

```bash
tail -f logs/reports-service.log
```

Look for:
- Query execution times
- Large result sets
- Memory usage
- Error rates
