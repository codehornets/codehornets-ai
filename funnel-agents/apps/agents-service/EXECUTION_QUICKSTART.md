# Agent Execution - Quick Start Guide

## 5-Minute Setup

### 1. Start Python API

```bash
cd /home/anga/workspace/beta/codehornets-ai/libs/digital-agency
python -m uvicorn api.main:app --reload --port 8000
```

### 2. Configure Environment

```bash
# Add to .env or environment
export PYTHON_AGENT_API_URL=http://localhost:8000/api/v1
export AGENT_EXECUTION_TIMEOUT=300000
export AGENT_EXECUTION_MAX_RETRIES=3
```

### 3. Start Agents Service

```bash
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents
npm run start:agents-service
```

## Usage Examples

### HTTP - Synchronous Execution

```bash
curl -X POST http://localhost:3000/agents/{agent-uuid}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "task_type": "content_creation",
      "topic": "AI Marketing Trends 2025",
      "tone": "professional"
    },
    "timeout": 300
  }'
```

### HTTP - Asynchronous Execution

```bash
curl -X POST http://localhost:3000/agents/{agent-uuid}/execute/async \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "task_type": "market_research",
      "industry": "SaaS"
    },
    "callback_url": "https://myapp.com/callbacks/result",
    "timeout": 600
  }'
```

### TypeScript - From Service

```typescript
import { AgentsService } from '@funnelagents/application';

// Inject in constructor
constructor(private agentsService: AgentsService) {}

// Execute agent
async executeTask() {
  const result = await this.agentsService.executeAgent(
    'agent-uuid-123',
    {
      task_type: 'email_campaign',
      target_audience: 'B2B SaaS',
      campaign_goal: 'lead_generation'
    },
    300 // timeout in seconds
  );

  if (result.success) {
    console.log('Output:', result.output_data);
    console.log('Time:', result.execution_time, 'ms');
  } else {
    console.error('Error:', result.error);
  }
}
```

### TypeScript - Microservice Pattern

```typescript
import { ClientProxy } from '@nestjs/microservices';

// Inject client
constructor(@Inject('AGENT_SERVICE') private client: ClientProxy) {}

// Call via MessagePattern
async executeViaRPC() {
  const result = await this.client.send(
    { cmd: 'agents.execute' },
    {
      agentId: 'agent-uuid-123',
      input: {
        task_type: 'seo_optimization',
        url: 'https://example.com'
      },
      timeout: 300
    }
  ).toPromise();

  return result;
}
```

## Task Types

| Type                  | Required Capabilities                    |
|-----------------------|------------------------------------------|
| `market_research`     | Market Research, Data Analysis           |
| `content_creation`    | Copywriting, Content Strategy            |
| `lead_qualification`  | Lead Generation, CRM Management          |
| `seo_optimization`    | SEO, Web Analytics                       |
| `email_campaign`      | Email Marketing, Copywriting             |
| `social_media_post`   | Social Media, Copywriting                |
| `competitor_analysis` | Competitor Analysis, Market Research     |
| `report_generation`   | Data Analysis, Web Analytics             |
| `custom`              | Any                                      |

## Response Format

```typescript
{
  success: boolean;
  output_data: {
    // Agent-specific output
  };
  execution_time: number; // milliseconds
  logs: string[];
  metrics: {
    tokens_used: number;
    model_calls: number;
  };
  error?: {
    code: string;
    message: string;
  };
  execution_id: string;
  status: 'completed' | 'failed' | 'timeout';
  started_at: Date;
  completed_at: Date;
}
```

## Error Codes

- `CAPABILITY_MISMATCH` - Agent can't perform this task
- `TIMEOUT_ERROR` - Execution took too long
- `NETWORK_ERROR` - Can't reach Python API
- `VALIDATION_ERROR` - Invalid input
- `EXECUTION_ERROR` - Task failed

## HTTP Endpoints

| Method | Path                           | Description                |
|--------|--------------------------------|----------------------------|
| POST   | `/agents/:id/execute`          | Synchronous execution      |
| POST   | `/agents/:id/execute/sync`     | Synchronous execution      |
| POST   | `/agents/:id/execute/async`    | Async execution + callback |

## MessagePattern Commands

| Command               | Description           |
|-----------------------|-----------------------|
| `agents.execute`      | Execute agent task    |
| `agents.executeSync`  | Sync execution        |
| `agents.executeAsync` | Async execution       |

## Common Issues

### Python API not responding
```bash
# Check if running
curl http://localhost:8000/api/v1/health

# Restart if needed
python -m uvicorn api.main:app --reload --port 8000
```

### Timeout errors
```typescript
// Increase timeout for long-running tasks
await agentsService.executeAgent(
  agentId,
  input,
  600 // 10 minutes
);
```

### Capability mismatch
```typescript
// Check agent capabilities first
const agent = await agentsService.findById(agentId);
const canExecute = await agentsService.validateAgentCapabilities(
  agent,
  'market_research'
);
```

## Testing

```bash
# Unit tests
npm test -- apps/agents-service

# Integration test
npm run test:e2e -- agents-execution.e2e-spec.ts

# Manual test
curl -X POST http://localhost:3000/agents/test-uuid/execute \
  -H "Content-Type: application/json" \
  -d '{"input":{"task_type":"custom","test":"data"}}'
```

## Documentation

- Full Implementation: `README-EXECUTION.md`
- Detailed Report: `IMPLEMENTATION_REPORT.md`
- API Docs: http://localhost:3000/api/docs (when running)

## Support

For issues or questions:
1. Check logs: `npm run logs:agents-service`
2. Review error codes above
3. Consult full documentation
4. Check Python API logs

---

**Quick Links**:
- Python API: http://localhost:8000/docs
- NestJS API: http://localhost:3000/api
- Health Check: http://localhost:8000/api/v1/health
