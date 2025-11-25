# Reports Service - Complete API Guide

## Table of Contents
1. [Analytics APIs](#analytics-apis)
2. [Export APIs](#export-apis)
3. [Custom Reports](#custom-reports)
4. [Scheduled Reports](#scheduled-reports)
5. [Report Templates](#report-templates)
6. [Feedback System](#feedback-system)
7. [Cache Management](#cache-management)

---

## Analytics APIs

### Get Task Analytics

```bash
GET /analytics/tasks?workspace_id={uuid}&start_date=2024-01-01&end_date=2024-12-31&agent_id={uuid}
```

**Query Parameters:**
- `workspace_id` (optional): Filter by workspace
- `start_date` (optional): ISO date string
- `end_date` (optional): ISO date string
- `agent_id` (optional): Filter by specific agent

**Response:**
```json
{
  "total": 1250,
  "completed": 1000,
  "failed": 50,
  "pending": 150,
  "running": 50,
  "success_rate": 80.0,
  "avg_completion_time": 45.5,
  "tasks_by_status": {
    "COMPLETED": 1000,
    "FAILED": 50,
    "PENDING": 150,
    "RUNNING": 50
  },
  "tasks_by_day": [
    {
      "date": "2024-01-01",
      "count": 50,
      "completed": 40,
      "failed": 2
    }
  ]
}
```

### Get Agent Analytics

```bash
GET /analytics/agents?workspace_id={uuid}&domain=sales
```

**Response:**
```json
{
  "total_agents": 25,
  "active_agents": 20,
  "agents": [
    {
      "id": "agent-123",
      "name": "Sales Agent 1",
      "domain": "sales",
      "status": "IDLE",
      "tasks_completed": 150,
      "tasks_failed": 5,
      "success_rate": 96.77,
      "avg_completion_time": 42.3,
      "avg_feedback_rating": 4.65
    }
  ]
}
```

### Get Domain Analytics

```bash
GET /analytics/domains?workspace_id={uuid}
```

**Response:**
```json
{
  "domains": [
    {
      "domain": "sales",
      "agent_count": 10,
      "active_count": 8,
      "total_tasks": 500,
      "completed_tasks": 450,
      "success_rate": 90.0,
      "avg_completion_time": 38.5
    }
  ]
}
```

---

## Export APIs

### Export as PDF

```bash
GET /analytics/export/pdf?workspace_id={uuid}&start_date=2024-01-01
```

**Returns:** PDF file with formatted report

**cURL Example:**
```bash
curl -X GET "http://localhost:3004/analytics/export/pdf?workspace_id=test-123" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output analytics-report.pdf
```

### Export as Excel

```bash
GET /analytics/export/excel?workspace_id={uuid}
```

**Returns:** Excel workbook (.xlsx) with multiple sheets

**Features:**
- Summary sheet with key metrics
- Task analytics sheet
- Agent performance sheet
- Domain analytics sheet
- Daily trends sheet
- Conditional formatting
- Auto-filtering

### Export as CSV

```bash
GET /analytics/export/csv?workspace_id={uuid}
```

**Returns:** CSV file with all analytics data

### Export as JSON

```bash
GET /analytics/export/json?workspace_id={uuid}
```

**Returns:** JSON file with complete analytics data

---

## Custom Reports

### Generate Custom Report

```bash
POST /analytics/custom
Content-Type: application/json
```

**Request Body:**
```json
{
  "entity": "tasks",
  "metrics": ["count", "success_rate", "avg_completion_time"],
  "filters": {
    "status": "COMPLETED",
    "workspace_id": "workspace-123"
  },
  "groupBy": ["agent_id"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Supported Entities:**
- `tasks` - Task data
- `agents` - Agent data
- `leads` - Lead data
- `campaigns` - Campaign data
- `deals` - Deal data

**Supported Metrics by Entity:**

**For Tasks:**
- `count` - Total count
- `success_rate` - Percentage of completed tasks
- `avg_completion_time` - Average time to complete (seconds)

**For Leads:**
- `count` - Total leads
- `avg_score` - Average lead score
- `conversion_rate` - Percentage converted

**For Campaigns:**
- `count` - Total campaigns
- `total_budget` - Sum of budgets
- `total_spent` - Sum of spent amounts
- `roi` - Return on investment

**For Deals:**
- `count` - Total deals
- `total_value` - Sum of deal amounts
- `avg_deal_size` - Average deal amount
- `conversion_rate` - Percentage won

**Response:**
```json
{
  "entity": "tasks",
  "metrics": {
    "count": 1250,
    "success_rate": 80.0,
    "avg_completion_time": 45.5
  },
  "data": [
    {
      "agent_id": "agent-123",
      "count": 150,
      "items": [...]
    }
  ],
  "summary": {
    "totalRecords": 1250,
    "count": 1250,
    "success_rate": 80.0
  },
  "generatedAt": "2024-11-25T10:00:00.000Z"
}
```

**Example: Campaign ROI Report**
```json
{
  "entity": "campaigns",
  "metrics": ["count", "total_budget", "total_spent", "roi"],
  "filters": {
    "status": "active",
    "workspace_id": "workspace-123"
  },
  "groupBy": ["status"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Example: Lead Conversion Funnel**
```json
{
  "entity": "leads",
  "metrics": ["count", "conversion_rate", "avg_score"],
  "filters": {
    "workspace_id": "workspace-123"
  },
  "groupBy": ["status", "source"]
}
```

---

## Scheduled Reports

### Create Scheduled Report

```bash
POST /scheduled-reports
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Weekly Team Performance",
  "reportType": "custom",
  "workspaceId": "workspace-123",
  "schedule": "0 9 * * 1",
  "recipients": ["manager@company.com", "admin@company.com"],
  "format": "pdf",
  "config": {
    "start_date": "7daysAgo",
    "end_date": "now"
  },
  "templateId": "template-123"
}
```

**Report Types:**
- `task_analytics` - Task analytics report
- `agent_analytics` - Agent analytics report
- `domain_analytics` - Domain analytics report
- `custom` - Custom report with config
- `template` - Use predefined template

**Formats:**
- `pdf` - PDF document
- `excel` - Excel workbook
- `csv` - CSV file
- `json` - JSON file

**Cron Schedule Examples:**
```bash
"0 9 * * *"      # Daily at 9 AM
"0 9 * * 1"      # Every Monday at 9 AM
"0 9 1 * *"      # First day of month at 9 AM
"0 */6 * * *"    # Every 6 hours
"0 0 * * 0"      # Every Sunday at midnight
"0 9 * * 1-5"    # Weekdays at 9 AM
"0 8 1,15 * *"   # 1st and 15th of month at 8 AM
```

**Response:**
```json
{
  "id": "report-123",
  "name": "Weekly Team Performance",
  "reportType": "custom",
  "schedule": "0 9 * * 1",
  "recipients": ["manager@company.com"],
  "format": "pdf",
  "isActive": true,
  "lastSentAt": null,
  "nextSendAt": "2024-11-26T09:00:00.000Z",
  "sendCount": 0,
  "createdAt": "2024-11-25T10:00:00.000Z"
}
```

### List Scheduled Reports

```bash
GET /scheduled-reports?workspace_id={uuid}
```

### Get Scheduled Report

```bash
GET /scheduled-reports/{id}
```

### Update Scheduled Report

```bash
PUT /scheduled-reports/{id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Report Name",
  "schedule": "0 10 * * 1",
  "isActive": false
}
```

### Delete Scheduled Report

```bash
DELETE /scheduled-reports/{id}
```

### Manually Trigger Report

```bash
POST /scheduled-reports/{id}/trigger
```

**Response:**
```json
{
  "message": "Report generation triggered"
}
```

---

## Report Templates

### Create Custom Template

```bash
POST /report-templates
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Custom Sales Dashboard",
  "description": "Weekly sales performance metrics",
  "reportType": "custom",
  "workspaceId": "workspace-123",
  "isPublic": false,
  "metrics": ["count", "total_value", "conversion_rate"],
  "filters": {
    "status": "active"
  },
  "groupBy": ["agent_id", "status"],
  "charts": {
    "sales_funnel": {
      "type": "funnel",
      "metric": "count",
      "groupBy": "stage"
    },
    "revenue_trend": {
      "type": "line",
      "metric": "total_value"
    }
  }
}
```

### List Templates

```bash
GET /report-templates?workspace_id={uuid}
```

**Returns all public templates + workspace-specific templates**

### Get Templates by Type

```bash
GET /report-templates/type/{type}?workspace_id={uuid}
```

**Types:**
- `task_analytics`
- `agent_analytics`
- `domain_analytics`
- `custom`

### Get Template

```bash
GET /report-templates/{id}?workspace_id={uuid}
```

### Update Template

```bash
PUT /report-templates/{id}
Content-Type: application/json
```

### Delete Template

```bash
DELETE /report-templates/{id}?workspace_id={uuid}
```

### Clone Template

```bash
POST /report-templates/clone
Content-Type: application/json
```

**Request Body:**
```json
{
  "templateId": "template-123",
  "name": "My Custom Copy",
  "workspaceId": "workspace-456"
}
```

### Seed Default Templates

```bash
POST /report-templates/seed
```

**Creates 5 default templates:**
1. Weekly Summary
2. Agent Performance
3. Campaign ROI
4. Sales Pipeline
5. Lead Generation

---

## Feedback System

### Submit Agent Feedback

```bash
POST /feedback
Content-Type: application/json
```

**Request Body:**
```json
{
  "agentId": "agent-123",
  "workspaceId": "workspace-123",
  "taskId": "task-456",
  "rating": 5,
  "comment": "Excellent job handling the customer inquiry!",
  "userId": "user-789",
  "metadata": {
    "category": "customer_service",
    "sentiment": "positive"
  }
}
```

**Rating:** 1-5 (integer)

**Response:**
```json
{
  "id": "feedback-123",
  "agentId": "agent-123",
  "rating": 5,
  "comment": "Excellent job...",
  "createdAt": "2024-11-25T10:00:00.000Z"
}
```

### Get Agent Feedback

```bash
GET /feedback/agent/{agentId}
```

**Returns:** Array of all feedback for the agent

### Get Agent Feedback Statistics

```bash
GET /feedback/agent/{agentId}/stats?start_date=2024-01-01&end_date=2024-12-31
```

**Response:**
```json
{
  "agentId": "agent-123",
  "totalFeedback": 150,
  "averageRating": 4.65,
  "ratingDistribution": {
    "1": 2,
    "2": 5,
    "3": 18,
    "4": 45,
    "5": 80
  },
  "trend": [
    {
      "date": "2024-01-15",
      "averageRating": 4.5,
      "count": 10
    },
    {
      "date": "2024-01-16",
      "averageRating": 4.8,
      "count": 12
    }
  ]
}
```

### Get Workspace Feedback Statistics

```bash
GET /feedback/workspace/{workspaceId}/stats
```

**Response:**
```json
{
  "totalFeedback": 1250,
  "averageRating": 4.55
}
```

---

## Cache Management

### View Cache Statistics

```bash
GET /analytics/cache/stats
```

**Response:**
```json
{
  "size": 42,
  "keys": [
    "task-analytics:workspace-123:a1b2c3",
    "agent-analytics:workspace-123:d4e5f6"
  ]
}
```

### Clear Workspace Cache

```bash
GET /analytics/cache/clear?workspace_id={uuid}
```

**Response:**
```json
{
  "message": "Cache cleared for workspace: workspace-123"
}
```

### Clear All Cache

```bash
GET /analytics/cache/clear
```

**Response:**
```json
{
  "message": "All cache cleared"
}
```

---

## Error Responses

All endpoints follow standard HTTP status codes:

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "rating must be between 1 and 5"
  ]
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Report not found: report-123"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limiting

**Recommendations (not yet implemented):**
- Analytics endpoints: 100 requests/minute
- Export endpoints: 10 requests/minute
- Custom reports: 20 requests/minute
- Feedback: 50 requests/minute

---

## Authentication

All endpoints should be protected with JWT authentication (not yet implemented):

```bash
curl -X GET "http://localhost:3004/analytics/tasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Webhooks (Future)

Planned webhook events:
- `report.generated` - Scheduled report completed
- `report.failed` - Report generation failed
- `feedback.submitted` - New feedback received
- `template.created` - New template created

---

## Best Practices

1. **Use Caching**: Analytics data is cached for 5 minutes. Clear cache after data updates.

2. **Workspace Isolation**: Always filter by workspace_id in multi-tenant environments.

3. **Date Ranges**: Use ISO 8601 format for dates: `2024-11-25T10:00:00.000Z`

4. **Scheduled Reports**: Test cron expressions before production: https://crontab.guru

5. **Custom Reports**: Cache results are shared across similar queries. Use specific filters for better cache hits.

6. **Large Exports**: For datasets >10k records, consider pagination or streaming (future feature).

7. **Feedback**: Encourage users to provide feedback immediately after task completion for accurate ratings.

8. **Templates**: Start with seeded templates and clone for customization rather than creating from scratch.

---

## Support

For questions or issues:
- Email: support@funnelagents.com
- Documentation: /docs
- GitHub Issues: repository-url/issues
