# Automations Service - Examples

This document provides practical examples of using the Automations Service API.

## Prerequisites

Ensure the service is running and PostgreSQL is configured:

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=funnelagents
export AUTOMATIONS_SERVICE_PORT=3007

# Start the service
npx nx serve automations-service
```

## Example 1: Create a Simple Email Workflow

### Step 1: Create the Workflow

```bash
curl -X POST http://localhost:3007/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Email Workflow",
    "description": "Send welcome email to new users",
    "trigger_type": "event",
    "trigger_config": {
      "event_name": "user.registered"
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "event": "user.registered"
        }
      },
      {
        "id": "email-1",
        "type": "email",
        "position": { "x": 200, "y": 0 },
        "data": {
          "template": "welcome_email",
          "to": "{{user.email}}",
          "subject": "Welcome to FunnelAgents!"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "trigger-1",
        "target": "email-1"
      }
    ]
  }'
```

### Step 2: Activate the Workflow

```bash
curl -X PATCH http://localhost:3007/workflows/{workflow_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### Step 3: Execute the Workflow

```bash
curl -X POST http://localhost:3007/workflows/{workflow_id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_data": {
      "user": {
        "email": "newuser@example.com",
        "name": "John Doe"
      }
    }
  }'
```

## Example 2: Conditional Workflow with Agent

```bash
curl -X POST http://localhost:3007/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Qualification Workflow",
    "description": "Qualify leads and assign to sales reps",
    "trigger_type": "webhook",
    "trigger_config": {
      "url": "/webhooks/lead-created"
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "webhook_path": "/webhooks/lead-created"
        }
      },
      {
        "id": "agent-1",
        "type": "agent",
        "position": { "x": 200, "y": 0 },
        "data": {
          "agent_type": "lead_qualifier",
          "prompt": "Analyze this lead and determine if they are qualified based on company size and budget"
        }
      },
      {
        "id": "condition-1",
        "type": "condition",
        "position": { "x": 400, "y": 0 },
        "data": {
          "field": "qualified",
          "operator": "equals",
          "value": true
        }
      },
      {
        "id": "email-qualified",
        "type": "email",
        "position": { "x": 600, "y": -100 },
        "data": {
          "template": "qualified_lead",
          "to": "sales@company.com",
          "subject": "New Qualified Lead"
        }
      },
      {
        "id": "email-not-qualified",
        "type": "email",
        "position": { "x": 600, "y": 100 },
        "data": {
          "template": "nurture_lead",
          "to": "marketing@company.com",
          "subject": "New Lead for Nurturing"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "trigger-1",
        "target": "agent-1"
      },
      {
        "id": "edge-2",
        "source": "agent-1",
        "target": "condition-1"
      },
      {
        "id": "edge-3",
        "source": "condition-1",
        "target": "email-qualified",
        "condition": "qualified === true"
      },
      {
        "id": "edge-4",
        "source": "condition-1",
        "target": "email-not-qualified",
        "condition": "qualified === false"
      }
    ]
  }'
```

## Example 3: Scheduled Workflow with Delay

```bash
curl -X POST http://localhost:3007/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Report Workflow",
    "description": "Generate and send weekly reports",
    "trigger_type": "scheduled",
    "trigger_config": {
      "cron": "0 9 * * MON",
      "timezone": "America/New_York"
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "schedule": "0 9 * * MON"
        }
      },
      {
        "id": "agent-1",
        "type": "agent",
        "position": { "x": 200, "y": 0 },
        "data": {
          "agent_type": "report_generator",
          "prompt": "Generate weekly performance report"
        }
      },
      {
        "id": "email-1",
        "type": "email",
        "position": { "x": 400, "y": 0 },
        "data": {
          "template": "weekly_report",
          "to": "team@company.com",
          "subject": "Weekly Performance Report"
        }
      },
      {
        "id": "delay-1",
        "type": "delay",
        "position": { "x": 600, "y": 0 },
        "data": {
          "duration": "3d"
        }
      },
      {
        "id": "email-2",
        "type": "email",
        "position": { "x": 800, "y": 0 },
        "data": {
          "template": "follow_up",
          "to": "team@company.com",
          "subject": "Weekly Report Follow-up"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "trigger-1",
        "target": "agent-1"
      },
      {
        "id": "edge-2",
        "source": "agent-1",
        "target": "email-1"
      },
      {
        "id": "edge-3",
        "source": "email-1",
        "target": "delay-1"
      },
      {
        "id": "edge-4",
        "source": "delay-1",
        "target": "email-2"
      }
    ]
  }'
```

## Example 4: Query Workflows and Runs

### Get All Active Workflows

```bash
curl -X GET "http://localhost:3007/workflows?status=active"
```

### Get Workflows by Trigger Type

```bash
curl -X GET "http://localhost:3007/workflows?trigger_type=scheduled"
```

### Get All Runs for a Specific Workflow

```bash
curl -X GET "http://localhost:3007/workflow-runs?workflow_id={workflow_id}"
```

### Get Failed Workflow Runs

```bash
curl -X GET "http://localhost:3007/workflow-runs?status=failed"
```

### Get Detailed Run Information

```bash
curl -X GET "http://localhost:3007/workflow-runs/{run_id}"
```

## Example 5: Update and Manage Workflows

### Update Workflow Status

```bash
curl -X PATCH http://localhost:3007/workflows/{workflow_id} \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paused"
  }'
```

### Add New Nodes to Workflow

```bash
curl -X PATCH http://localhost:3007/workflows/{workflow_id} \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "id": "new-node-1",
        "type": "webhook",
        "position": { "x": 1000, "y": 0 },
        "data": {
          "url": "https://api.example.com/webhook",
          "method": "POST"
        }
      }
    ]
  }'
```

### Delete Workflow

```bash
curl -X DELETE http://localhost:3007/workflows/{workflow_id}
```

## Example 6: Manual Trigger Workflow

```bash
# Create a manual workflow
curl -X POST http://localhost:3007/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Processing Workflow",
    "description": "Process data manually",
    "trigger_type": "manual",
    "status": "active",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 0, "y": 0 },
        "data": {}
      },
      {
        "id": "agent-1",
        "type": "agent",
        "position": { "x": 200, "y": 0 },
        "data": {
          "agent_type": "data_processor",
          "prompt": "Process the provided data"
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "trigger-1",
        "target": "agent-1"
      }
    ]
  }'

# Execute manually with custom data
curl -X POST http://localhost:3007/workflows/{workflow_id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_data": {
      "data": {
        "records": [
          {"id": 1, "value": "test1"},
          {"id": 2, "value": "test2"}
        ]
      }
    }
  }'
```

## Example 7: Webhook Integration

```bash
# Create webhook-triggered workflow
curl -X POST http://localhost:3007/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "External Event Handler",
    "description": "Handle external webhook events",
    "trigger_type": "webhook",
    "status": "active",
    "trigger_config": {
      "url": "/webhooks/external-event",
      "method": "POST",
      "secret": "your-webhook-secret"
    },
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 0, "y": 0 },
        "data": {
          "webhook_path": "/webhooks/external-event"
        }
      },
      {
        "id": "agent-1",
        "type": "agent",
        "position": { "x": 200, "y": 0 },
        "data": {
          "agent_type": "event_processor",
          "prompt": "Process external event data"
        }
      },
      {
        "id": "webhook-1",
        "type": "webhook",
        "position": { "x": 400, "y": 0 },
        "data": {
          "url": "https://api.external.com/callback",
          "method": "POST",
          "headers": {
            "Authorization": "Bearer token"
          }
        }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "trigger-1",
        "target": "agent-1"
      },
      {
        "id": "edge-2",
        "source": "agent-1",
        "target": "webhook-1"
      }
    ]
  }'
```

## Response Examples

### Workflow Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Welcome Email Workflow",
  "description": "Send welcome email to new users",
  "status": "active",
  "trigger_type": "event",
  "trigger_config": {
    "event_name": "user.registered"
  },
  "nodes": [...],
  "edges": [...],
  "workspace_id": null,
  "created_at": "2024-11-25T10:00:00Z",
  "updated_at": "2024-11-25T10:00:00Z"
}
```

### Workflow Run Response

```json
{
  "id": "650e8400-e29b-41d4-a716-446655440000",
  "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "trigger_type": "event",
  "trigger_data": {
    "user": {
      "email": "newuser@example.com",
      "name": "John Doe"
    }
  },
  "current_node_id": null,
  "execution_log": [
    {
      "node_id": "trigger-1",
      "node_type": "trigger",
      "status": "completed",
      "started_at": "2024-11-25T10:01:00Z",
      "completed_at": "2024-11-25T10:01:01Z",
      "input": {},
      "output": { "success": true }
    },
    {
      "node_id": "email-1",
      "node_type": "email",
      "status": "completed",
      "started_at": "2024-11-25T10:01:01Z",
      "completed_at": "2024-11-25T10:01:05Z",
      "input": { "to": "newuser@example.com" },
      "output": { "success": true, "message_id": "msg-123" }
    }
  ],
  "error_message": null,
  "started_at": "2024-11-25T10:01:00Z",
  "completed_at": "2024-11-25T10:01:05Z",
  "created_at": "2024-11-25T10:01:00Z"
}
```

## Testing Tips

1. **Start Simple**: Begin with manual trigger workflows to test the basic flow
2. **Test Each Node Type**: Create workflows for each node type to ensure compatibility
3. **Monitor Execution Logs**: Check the execution_log in workflow runs to debug issues
4. **Use Filters**: Leverage query parameters to find specific workflows and runs
5. **Status Management**: Test all status transitions (draft → active → paused → archived)

## Common Patterns

### Pattern 1: Try-Catch with Condition

Use condition nodes to check for errors and route accordingly.

### Pattern 2: Fan-out/Fan-in

Create multiple parallel paths from a single node and converge them later.

### Pattern 3: Retry Logic

Use delay nodes with conditions to implement retry mechanisms.

### Pattern 4: Multi-stage Approval

Create workflows with multiple condition nodes for approval stages.

## Notes

- Workflows must be in "active" status to be executed
- Node execution is currently simulated (marks all nodes as completed)
- Future versions will implement actual node execution logic
- Workflow runs are automatically created when executing workflows
- Use workspace_id for multi-tenancy scenarios
