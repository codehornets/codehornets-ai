# Quick Start Guide - Workflow Execution Engine

This guide will help you quickly test the Workflow Execution Engine.

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database running
- Required services (optional): agents-service, email-service

## 1. Environment Setup

Create `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/funnel_agents

# Services (optional - workflows will run but external calls will fail gracefully)
AGENTS_SERVICE_URL=http://localhost:3001
EMAIL_SERVICE_URL=http://localhost:3003

# Configuration
DEFAULT_EMAIL_FROM=noreply@funnelagents.com
PORT=3002
NODE_ENV=development
LOG_LEVEL=debug
```

## 2. Install & Start

```bash
# Install dependencies (from project root)
npm install

# Start the service
npm run serve automations-service

# Or with NX
npx nx serve automations-service
```

Service will start on http://localhost:3002

## 3. Test Workflow Execution

### Option A: Manual Execution (Simplest)

Create a simple workflow:

```bash
curl -X POST http://localhost:3002/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Simple Test Workflow",
    "description": "Test the execution engine",
    "status": "active",
    "trigger_type": "manual",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": { "triggerType": "manual" }
      },
      {
        "id": "delay-1",
        "type": "delay",
        "position": { "x": 300, "y": 100 },
        "data": {
          "duration": 2,
          "unit": "seconds"
        }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "trigger-1",
        "target": "delay-1"
      }
    ]
  }'
```

Execute the workflow (replace WORKFLOW_ID):

```bash
curl -X POST http://localhost:3002/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_data": {
      "testField": "Hello World",
      "timestamp": "2024-11-25T10:00:00Z"
    }
  }'
```

Check the run status:

```bash
curl http://localhost:3002/workflow-runs
```

### Option B: Webhook Trigger

Create a webhook-triggered workflow:

```bash
curl -X POST http://localhost:3002/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Webhook Test Workflow",
    "status": "active",
    "trigger_type": "webhook",
    "trigger_config": {
      "webhookPath": "test-webhook",
      "webhookSecret": "my-secret-123"
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": {
          "triggerType": "webhook",
          "webhookPath": "test-webhook"
        }
      },
      {
        "id": "delay-1",
        "type": "delay",
        "position": { "x": 300, "y": 100 },
        "data": { "duration": 1, "unit": "seconds" }
      }
    ],
    "edges": [
      { "id": "e1", "source": "trigger-1", "target": "delay-1" }
    ]
  }'
```

Trigger via webhook:

```bash
curl -X POST http://localhost:3002/webhooks/test-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: my-secret-123" \
  -d '{
    "email": "user@example.com",
    "score": 85,
    "source": "webhook-test"
  }'
```

### Option C: Scheduled Trigger

Create a scheduled workflow (runs every minute):

```bash
curl -X POST http://localhost:3002/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scheduled Test Workflow",
    "status": "active",
    "trigger_type": "scheduled",
    "trigger_config": {
      "schedule": "* * * * *",
      "timezone": "UTC"
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": {
          "triggerType": "scheduled",
          "schedule": "* * * * *"
        }
      },
      {
        "id": "delay-1",
        "type": "delay",
        "position": { "x": 300, "y": 100 },
        "data": { "duration": 1, "unit": "seconds" }
      }
    ],
    "edges": [
      { "id": "e1", "source": "trigger-1", "target": "delay-1" }
    ]
  }'
```

Wait 1 minute and check runs:

```bash
curl http://localhost:3002/workflow-runs
```

## 4. Test Conditional Branching

Create a workflow with conditions:

```bash
curl -X POST http://localhost:3002/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conditional Test Workflow",
    "status": "active",
    "trigger_type": "manual",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": { "triggerType": "manual" }
      },
      {
        "id": "condition-1",
        "type": "condition",
        "position": { "x": 300, "y": 100 },
        "data": {
          "operator": ">=",
          "leftValue": "${trigger.score}",
          "rightValue": 75
        }
      },
      {
        "id": "delay-high",
        "type": "delay",
        "position": { "x": 500, "y": 50 },
        "data": { "duration": 1, "unit": "seconds" }
      },
      {
        "id": "delay-low",
        "type": "delay",
        "position": { "x": 500, "y": 150 },
        "data": { "duration": 1, "unit": "seconds" }
      }
    ],
    "edges": [
      { "id": "e1", "source": "trigger-1", "target": "condition-1" },
      { "id": "e2", "source": "condition-1", "target": "delay-high", "condition": "true" },
      { "id": "e3", "source": "condition-1", "target": "delay-low", "condition": "false" }
    ]
  }'
```

Execute with high score (takes "true" path):

```bash
curl -X POST http://localhost:3002/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{ "trigger_data": { "score": 85 } }'
```

Execute with low score (takes "false" path):

```bash
curl -X POST http://localhost:3002/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{ "trigger_data": { "score": 45 } }'
```

## 5. Test Complex Example

Use the pre-made example:

```bash
# Load the example workflow
cat apps/automations-service/examples/lead-qualification-workflow.json | \
  jq 'del(.name) | . + {"name": "Lead Qualification Test"}' | \
  curl -X POST http://localhost:3002/workflows \
    -H "Content-Type: application/json" \
    -d @-
```

Trigger it:

```bash
curl -X POST http://localhost:3002/webhooks/lead-created \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: my-secret-key" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "budget": 50000,
    "industry": "Technology"
  }'
```

## 6. Monitor Execution

### View All Runs

```bash
curl http://localhost:3002/workflow-runs | jq
```

### View Specific Run

```bash
curl http://localhost:3002/workflow-runs/RUN_ID | jq
```

### View Execution Statistics

```bash
curl http://localhost:3002/workflow-runs/RUN_ID/stats | jq
```

### View Execution Log

```bash
curl http://localhost:3002/workflow-runs/RUN_ID | jq '.execution_log'
```

## 7. Test Error Handling

Create a workflow that will fail (invalid webhook URL):

```bash
curl -X POST http://localhost:3002/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Error Test Workflow",
    "status": "active",
    "trigger_type": "manual",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": { "triggerType": "manual" }
      },
      {
        "id": "webhook-1",
        "type": "webhook",
        "position": { "x": 300, "y": 100 },
        "data": {
          "url": "http://invalid-url-that-does-not-exist.local",
          "method": "POST",
          "body": { "test": "data" }
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "trigger-1", "target": "webhook-1" }
    ]
  }'
```

Execute and check error logging:

```bash
curl -X POST http://localhost:3002/workflows/WORKFLOW_ID/execute \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# Check the run for error details
curl http://localhost:3002/workflow-runs/RUN_ID | jq '.error_message'
```

## 8. Test Workflow Operations

### Validate Workflow

```bash
curl http://localhost:3002/workflows/WORKFLOW_ID/validate | jq
```

### Activate Workflow

```bash
curl -X POST http://localhost:3002/workflows/WORKFLOW_ID/activate | jq
```

### Pause Workflow

```bash
curl -X POST http://localhost:3002/workflows/WORKFLOW_ID/pause | jq
```

### Cancel Running Workflow

```bash
curl -X POST http://localhost:3002/workflow-runs/RUN_ID/cancel | jq
```

### Retry Failed Workflow

```bash
curl -X POST http://localhost:3002/workflow-runs/RUN_ID/retry | jq
```

## 9. Watch Logs

To see detailed execution logs:

```bash
# Terminal 1: Start service with debug logging
LOG_LEVEL=debug npx nx serve automations-service

# Terminal 2: Execute workflows and watch logs
```

Look for log entries like:
- `Executing workflow: ...`
- `Executing node: ...`
- `Node executed successfully: ...`
- `Workflow execution completed: ...`

## 10. Database Inspection

Connect to PostgreSQL to inspect data:

```sql
-- View all workflows
SELECT id, name, status, trigger_type, created_at FROM workflows;

-- View all runs
SELECT id, workflow_id, status, started_at, completed_at FROM workflow_runs;

-- View execution log for a run
SELECT execution_log FROM workflow_runs WHERE id = 'RUN_ID';

-- Count runs by status
SELECT status, COUNT(*) FROM workflow_runs GROUP BY status;
```

## Troubleshooting

### Service won't start
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check port 3002 is not in use

### Workflow validation fails
- Ensure workflow has exactly one trigger node
- Check all edge targets exist
- Verify node configurations are complete

### Scheduled workflows not running
- Check cron syntax is valid
- Verify workflow status is 'active'
- Check service logs for scheduler errors

### Webhook triggers not working
- Verify webhook path matches trigger_config
- Check X-Webhook-Secret header if secret is configured
- Ensure workflow status is 'active'

## Next Steps

1. Review [EXECUTION_ENGINE.md](./EXECUTION_ENGINE.md) for complete documentation
2. Check [examples/](./examples/) for more complex workflows
3. Explore [IMPLEMENTATION_REPORT.md](./IMPLEMENTATION_REPORT.md) for technical details

## Support

For issues:
1. Check service logs with `LOG_LEVEL=debug`
2. Inspect workflow_runs table in database
3. Review execution_log field for detailed node execution data
