# Workflow Execution Engine

This document describes the Workflow Execution Engine implementation for FunnelAgents Automations Service.

## Overview

The Workflow Execution Engine is a complete, production-ready system for executing multi-step workflows with support for:

- **Node Types**: Trigger, Agent, Condition, Email, Delay, Webhook
- **Trigger Types**: Manual, Webhook, Event, Scheduled
- **Conditional Branching**: Expression evaluation and path selection
- **Real-time Logging**: Node-by-node execution tracking with timestamps
- **Error Handling**: Stack traces and detailed error messages
- **Context Management**: Variable passing between nodes

## Architecture

### Core Components

1. **WorkflowExecutionEngine** - Main orchestration engine
2. **WorkflowContext** - Stores variables and node outputs
3. **Node Handlers** - Type-specific execution logic
4. **Trigger Handlers** - Webhook, Event, and Scheduled triggers

### Directory Structure

```
src/workflows/
├── engine/
│   ├── workflow-context.ts              # Context management
│   ├── workflow-execution-engine.ts     # Main engine
│   ├── node-handlers/
│   │   ├── base-node-handler.ts         # Abstract handler
│   │   ├── trigger-node-handler.ts      # Trigger nodes
│   │   ├── agent-node-handler.ts        # Agent invocation
│   │   ├── condition-node-handler.ts    # Conditional logic
│   │   ├── email-node-handler.ts        # Email sending
│   │   ├── delay-node-handler.ts        # Time delays
│   │   ├── webhook-node-handler.ts      # HTTP requests
│   │   └── index.ts
│   └── index.ts
├── triggers/
│   ├── webhook-trigger.controller.ts    # Webhook endpoints
│   ├── event-trigger.listener.ts        # Event listeners
│   └── scheduled-trigger.service.ts     # Cron scheduler
```

## Node Types

### 1. Trigger Node

Entry point for workflows. Initializes context with trigger data.

**Supported Trigger Types:**
- `manual` - User-initiated execution
- `webhook` - HTTP webhook triggers
- `event` - Domain event triggers
- `scheduled` - Cron-based triggers

**Configuration Example:**
```json
{
  "id": "trigger-1",
  "type": "trigger",
  "data": {
    "triggerType": "webhook",
    "webhookPath": "lead-created",
    "webhookSecret": "secret-key"
  }
}
```

### 2. Agent Node

Invokes agents via the agents-service API.

**Configuration Example:**
```json
{
  "id": "agent-1",
  "type": "agent",
  "data": {
    "agentId": "uuid-here",
    "input": {
      "leadData": "${trigger.payload}"
    },
    "parameters": {
      "temperature": 0.7
    },
    "timeout": 30000
  }
}
```

**Features:**
- HTTP integration with agents-service
- Configurable timeout (default 30s)
- Context variable interpolation
- Error handling with retries

### 3. Condition Node

Evaluates boolean expressions for branching.

**Configuration Example:**
```json
{
  "id": "condition-1",
  "type": "condition",
  "data": {
    "operator": ">=",
    "leftValue": "${trigger.payload.score}",
    "rightValue": 80
  }
}
```

**Supported Operators:**
- Comparison: `===`, `!==`, `>`, `<`, `>=`, `<=`
- String: `contains`, `startsWith`, `endsWith`, `matches`

**Multiple Conditions:**
```json
{
  "id": "condition-2",
  "type": "condition",
  "data": {
    "conditions": [
      { "leftValue": "${trigger.payload.score}", "operator": ">=", "rightValue": 80 },
      { "leftValue": "${trigger.payload.status}", "operator": "===", "rightValue": "active" }
    ],
    "logicalOperator": "AND"
  }
}
```

### 4. Email Node

Sends emails via integration service.

**Configuration Example:**
```json
{
  "id": "email-1",
  "type": "email",
  "data": {
    "to": "${trigger.payload.email}",
    "subject": "Welcome to FunnelAgents!",
    "template": "welcome-email",
    "templateData": {
      "name": "${trigger.payload.name}",
      "score": "${node.agent-1.result.score}"
    }
  }
}
```

**Features:**
- Template support with variable interpolation
- Multiple recipients (to, cc, bcc)
- Attachments support
- HTML and plain text

### 5. Delay Node

Waits for a specified duration before continuing.

**Configuration Example:**
```json
{
  "id": "delay-1",
  "type": "delay",
  "data": {
    "duration": 5,
    "unit": "minutes"
  }
}
```

**Supported Units:**
- `milliseconds`, `ms`
- `seconds`, `s`
- `minutes`, `m`
- `hours`, `h`
- `days`, `d`

**Constraints:**
- Maximum delay: 24 hours
- Minimum delay: 1ms

### 6. Webhook Node

Calls external HTTP endpoints.

**Configuration Example:**
```json
{
  "id": "webhook-1",
  "type": "webhook",
  "data": {
    "url": "https://api.example.com/notify",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "X-API-Key": "${env.API_KEY}"
    },
    "body": {
      "event": "lead_qualified",
      "lead": "${trigger.payload}",
      "score": "${node.agent-1.result.score}"
    },
    "timeout": 10000
  }
}
```

**Authentication Support:**
```json
{
  "auth": {
    "type": "bearer",
    "token": "${env.API_TOKEN}"
  }
}
```

**Auth Types:**
- `bearer` - Bearer token authentication
- `basic` - Basic authentication
- `apiKey` - API key (header or query)

## Workflow Context

The `WorkflowContext` class manages data flow between nodes.

### Variable Access

**Trigger Data:**
```javascript
${trigger.payload.email}
${trigger.payload.name}
```

**Node Outputs:**
```javascript
${node.agent-1.result.score}
${node.condition-1.result}
```

**Custom Variables:**
```javascript
${myVariable}
${nested.property.value}
```

### Context Methods

```typescript
// Set variable
context.setVariable('key', value);

// Get variable
const value = context.getVariable('key');

// Store node output
context.setNodeOutput(nodeId, output);

// Get node output
const output = context.getNodeOutput(nodeId);

// Evaluate expression
const result = context.evaluateExpression('${trigger.payload.email}');

// Serialize context
const json = context.toJSON();

// Restore context
const context = WorkflowContext.fromJSON(json);
```

## Execution Flow

### 1. Workflow Execution

```typescript
// Execute workflow
const workflowRun = await executionEngine.executeWorkflow(
  workflowId,
  { email: 'user@example.com', score: 85 }
);

// Check status
console.log(workflowRun.status); // 'completed', 'failed', or 'running'
console.log(workflowRun.execution_log); // Node-by-node log
```

### 2. Execution Log

Each node execution is logged:

```typescript
{
  node_id: 'agent-1',
  node_type: 'agent',
  status: 'completed',
  started_at: '2024-11-25T10:00:00.000Z',
  completed_at: '2024-11-25T10:00:05.123Z',
  input: { leadData: {...} },
  output: { score: 85, recommendation: 'high-value' },
  error: null
}
```

### 3. Error Handling

Errors include full stack traces:

```typescript
{
  node_id: 'webhook-1',
  node_type: 'webhook',
  status: 'failed',
  error: 'Webhook call failed: HTTP 500: Internal Server Error\n\nStack trace:\n...'
}
```

## Triggers

### Webhook Triggers

**Endpoint:** `POST /webhooks/:path`

```bash
curl -X POST http://localhost:3002/webhooks/lead-created \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: secret-key" \
  -d '{"email": "user@example.com", "score": 85}'
```

**By Workflow ID:** `POST /webhooks/workflow/:workflowId`

```bash
curl -X POST http://localhost:3002/webhooks/workflow/uuid-here \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Event Triggers

Events are handled via EventEmitter:

```typescript
// Emit event
eventEmitter.emit('workflow.trigger.lead.created', {
  name: 'lead.created',
  payload: { email: 'user@example.com' },
  timestamp: new Date(),
  source: 'leads-service'
});
```

**Pre-configured Events:**
- `user.created`
- `user.updated`
- `lead.created`
- `lead.updated`
- `conversation.completed`
- `task.completed`
- `payment.received`

### Scheduled Triggers

Workflows with `trigger_type: 'scheduled'` are automatically registered:

```json
{
  "trigger_type": "scheduled",
  "trigger_config": {
    "schedule": "0 9 * * 1-5",
    "timezone": "America/New_York"
  }
}
```

**Cron Syntax:** `minute hour day month day-of-week`

**Examples:**
- `0 9 * * 1-5` - 9 AM on weekdays
- `*/15 * * * *` - Every 15 minutes
- `0 0 1 * *` - 1st day of month at midnight

**Management:**
```typescript
// Reschedule
await scheduledTriggerService.rescheduleWorkflow(workflowId);

// Unschedule
scheduledTriggerService.unscheduleWorkflow(workflowId);

// Reload all
await scheduledTriggerService.reloadSchedules();
```

## API Endpoints

### Workflows

```
GET    /workflows                    # List all workflows
GET    /workflows/:id                # Get workflow
POST   /workflows                    # Create workflow
PATCH  /workflows/:id                # Update workflow
DELETE /workflows/:id                # Delete workflow
POST   /workflows/:id/execute        # Execute workflow
GET    /workflows/:id/validate       # Validate workflow
POST   /workflows/:id/activate       # Activate workflow
POST   /workflows/:id/pause          # Pause workflow
POST   /workflows/:id/archive        # Archive workflow
```

### Workflow Runs

```
GET    /workflow-runs                # List all runs
GET    /workflow-runs/:id            # Get run
POST   /workflow-runs                # Create run
POST   /workflow-runs/:id/cancel     # Cancel running workflow
POST   /workflow-runs/:id/retry      # Retry failed workflow
GET    /workflow-runs/:id/stats      # Get execution statistics
```

### Webhooks

```
POST   /webhooks/:path               # Trigger by webhook path
POST   /webhooks/workflow/:id        # Trigger by workflow ID
```

## Configuration

### Environment Variables

```env
# Agents Service
AGENTS_SERVICE_URL=http://localhost:3001

# Email Service
EMAIL_SERVICE_URL=http://localhost:3003
DEFAULT_EMAIL_FROM=noreply@funnelagents.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/funnel_agents
```

### Service Integration

The execution engine integrates with:

1. **Agents Service** - For agent node execution
2. **Email Service** - For email node execution
3. **PostgreSQL** - For workflow and run persistence
4. **Event Emitter** - For event-based triggers

## Validation

Before execution, workflows are validated:

```typescript
const validation = await executionEngine.validateWorkflow(workflowId);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  // [
  //   'Workflow must have at least one trigger node',
  //   'Node agent-1: agentId is required',
  //   'Node email-1: Invalid email format: invalid@'
  // ]
}
```

**Validation Checks:**
- Trigger node existence and uniqueness
- Node configuration completeness
- Edge target existence
- Orphaned nodes detection
- Type-specific validations

## Error Handling

### Node Execution Errors

When a node fails:
1. Error is captured with full stack trace
2. Execution log is updated with error details
3. Workflow run status is set to `failed`
4. Subsequent nodes are not executed

### Retry Mechanism

Failed workflows can be retried:

```typescript
// Retry failed workflow
const newRun = await workflowRunsService.retry(failedRunId);
```

This creates a new run with the same configuration.

### Cancellation

Running workflows can be cancelled:

```typescript
const cancelledRun = await workflowRunsService.cancel(runId);
```

## Performance

### Execution Statistics

```typescript
const stats = await workflowRunsService.getExecutionStats(runId);

// Returns:
// {
//   totalNodes: 5,
//   completedNodes: 5,
//   failedNodes: 0,
//   skippedNodes: 0,
//   averageExecutionTime: 1234, // ms
//   totalExecutionTime: 6170     // ms
// }
```

### Optimization Tips

1. **Parallel Execution** - Use multiple edges from a single node
2. **Timeout Configuration** - Set appropriate timeouts for agent/webhook nodes
3. **Delay Minimization** - Avoid long delays in critical paths
4. **Context Size** - Minimize data stored in context

## Testing

### Unit Testing Example

```typescript
describe('ConditionNodeHandler', () => {
  it('should evaluate simple comparison', async () => {
    const context = new WorkflowContext({ score: 85 });
    const node = {
      id: 'test',
      type: 'condition',
      data: {
        operator: '>=',
        leftValue: '${trigger.score}',
        rightValue: 80
      }
    };

    const result = await handler.execute(node, context);

    expect(result.success).toBe(true);
    expect(result.output.result).toBe(true);
  });
});
```

### Integration Testing

```typescript
describe('Workflow Execution', () => {
  it('should execute complete workflow', async () => {
    const workflow = await createTestWorkflow();

    const workflowRun = await executionEngine.executeWorkflow(
      workflow.id,
      { email: 'test@example.com' }
    );

    expect(workflowRun.status).toBe('completed');
    expect(workflowRun.execution_log).toHaveLength(3);
  });
});
```

## Future Enhancements

Potential improvements:

1. **Parallel Execution** - Execute independent nodes in parallel
2. **Subworkflows** - Call other workflows as nodes
3. **Loop Nodes** - Iterate over arrays
4. **Data Transformation** - Built-in data mapping nodes
5. **Approval Nodes** - Human-in-the-loop approval
6. **SLA Monitoring** - Track and alert on execution times
7. **Retry Strategies** - Configurable retry logic per node
8. **Versioning** - Workflow version management
9. **A/B Testing** - Split traffic between workflow versions
10. **Metrics & Analytics** - Detailed execution metrics

## Troubleshooting

### Common Issues

**Issue: Workflow validation fails**
- Check all required fields are present
- Verify edge targets exist
- Ensure trigger node is present

**Issue: Agent node times out**
- Increase timeout in node configuration
- Check agents-service availability
- Verify network connectivity

**Issue: Scheduled workflow not running**
- Check cron syntax is valid
- Verify workflow is active
- Check service logs for errors

**Issue: Context variables not resolving**
- Verify variable path syntax: `${trigger.field}`
- Check node was executed before reference
- Validate node output structure

## Support

For issues or questions:
- Check logs in `/var/log/automations-service/`
- Review execution logs in database
- Enable debug logging: `LOG_LEVEL=debug`

---

**Version:** 1.0.0
**Last Updated:** 2024-11-25
