# Agent Execution Implementation

## Overview

Complete agent execution capabilities have been implemented for the FunnelAgents service. The service now supports synchronous execution, asynchronous execution with callbacks, and real-time metrics collection.

## Architecture

```
┌─────────────────────┐
│  AgentsController   │ ─── HTTP/MessagePattern Endpoints
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   AgentsService     │ ─── Business Logic & Agent Management
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ AgentExecutionSvc   │ ─── Execution Orchestration & Validation
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Python Agent API   │ ─── FastAPI Backend (Port 8000)
│  digital-agency/api │
└─────────────────────┘
```

## Components Created

### 1. DTOs (`libs/interfaces/src/lib/dto/agent-execution.dto.ts`)

#### AgentInvocationDto
- `agent_id`: string
- `task_type`: TaskType enum
- `input_data`: Record<string, any>
- `timeout?`: number (10-600 seconds)
- `priority?`: ExecutionPriority enum
- `callback_url?`: string
- `metadata?`: Record<string, any>

#### AgentExecutionResultDto
- `success`: boolean
- `output_data`: Record<string, any>
- `execution_time`: number (milliseconds)
- `logs`: string[]
- `metrics?`: Record<string, any>
- `error?`: { code, message, details }
- `execution_id`: string
- `agent_id`: string
- `status`: ExecutionStatus
- `started_at`: Date
- `completed_at`: Date

#### Task Types Supported
- MARKET_RESEARCH
- CONTENT_CREATION
- LEAD_QUALIFICATION
- SEO_OPTIMIZATION
- EMAIL_CAMPAIGN
- SOCIAL_MEDIA_POST
- COMPETITOR_ANALYSIS
- REPORT_GENERATION
- CUSTOM

### 2. AgentExecutionService (`libs/application/src/lib/agents/agent-execution.service.ts`)

#### Core Methods

##### execute(agent, invocation): Promise<AgentExecutionResultDto>
Main execution method that:
- Validates agent capabilities against task type
- Prepares execution context
- Invokes Python agent API
- Handles timeout (default 5 minutes)
- Captures logs and metrics
- Records execution results

##### executeSync(agent, invocation): Promise<AgentExecutionResultDto>
Synchronous execution wrapper - waits for completion before returning.

##### executeAsync(agent, invocation): Promise<{ execution_id, status }>
Asynchronous execution that:
- Returns immediately with execution ID
- Executes in background
- Calls callback URL when complete
- Useful for long-running tasks

#### Features

**Capability Validation**
Maps task types to required agent capabilities:
- market_research → Market Research, Data Analysis
- content_creation → Copywriting, Content Strategy
- lead_qualification → Lead Generation, CRM Management
- etc.

**Retry Logic**
- Configurable max retries (default: 3)
- Exponential backoff
- Retries on: 5xx, 429, 408, network errors

**Error Handling**
- Timeout detection
- Network error recovery
- Detailed error codes
- Execution state tracking

### 3. AgentsService Updates (`libs/application/src/lib/agents/agents.service.ts`)

#### New Methods

##### executeAgent(agentId, input, timeout?): Promise<AgentExecutionResultDto>
High-level execution method that:
- Retrieves agent from repository
- Validates agent is online
- Marks agent as BUSY during execution
- Records task completion metrics
- Marks agent as IDLE after completion
- Handles errors gracefully

##### validateAgentCapabilities(agent, taskType): Promise<boolean>
Validates that agent has required capabilities for the task.

##### prepareAgentContext(agent, input): Promise<any>
Prepares execution context by building invocation payload.

##### invokeAgent(agent, context, timeout?): Promise<AgentExecutionResultDto>
Direct agent invocation method.

##### executeAgentSync(agentId, input, timeout?): Promise<AgentExecutionResultDto>
Synchronous execution from agent ID.

##### executeAgentAsync(agentId, input, callbackUrl?, timeout?): Promise<{ execution_id, status }>
Asynchronous execution from agent ID with optional callback.

### 4. AgentsController Updates (`apps/agents-service/src/controllers/agents.controller.ts`)

#### New HTTP Endpoints

##### POST /agents/:id/execute
Execute agent task synchronously
- Body: ExecuteAgentDto
- Returns: AgentExecutionResultDto
- Status: 200 (success), 400 (validation), 404 (not found)

##### POST /agents/:id/execute/sync
Execute agent task synchronously (explicit)
- Body: ExecuteAgentDto
- Returns: AgentExecutionResultDto

##### POST /agents/:id/execute/async
Queue agent task for async execution
- Body: { input, callback_url?, timeout? }
- Returns: { execution_id, status }
- Status: 202 (accepted)

#### MessagePattern Handlers
- `agents.execute` - Execute agent
- `agents.executeSync` - Synchronous execution
- `agents.executeAsync` - Async execution

### 5. Domain Entity Updates

#### AgentMetrics Entity (`libs/domain/src/lib/agents/agent-metrics.entity.ts`)
New entity for storing execution metrics:
- agentId
- executionId
- taskType
- executionTime
- success
- tokensUsed
- modelCalls
- errorCode
- errorMessage
- timestamp

### 6. Module Configuration (`apps/agents-service/src/modules/agents.module.ts`)

Updated to include:
- HttpModule for API calls
- ConfigModule for environment variables
- AgentExecutionService provider
- Exports for external use

## Python API Integration

### Expected Endpoint

```
POST /api/v1/agents/{domain}/{agent_name}/execute
```

### Request Format
```json
{
  "task_type": "content_creation",
  "input_data": {
    "topic": "AI Marketing",
    "word_count": 1000
  },
  "config": {
    "timeout": 300,
    "priority": "normal",
    "stream": false
  },
  "metadata": {
    "agent_id": "uuid",
    "agent_name": "Content Creator"
  }
}
```

### Response Format
```json
{
  "success": true,
  "result": {
    "output": { "content": "..." },
    "execution_time_ms": 12500,
    "tokens_used": 1500,
    "model_calls": 3
  },
  "logs": [
    {
      "timestamp": "2025-01-15T10:00:00Z",
      "level": "info",
      "message": "Task started"
    }
  ],
  "execution_id": "exec-123",
  "status": "completed"
}
```

## Environment Variables

Add to `.env`:

```bash
PYTHON_AGENT_API_URL=http://localhost:8000/api/v1
AGENT_EXECUTION_TIMEOUT=300000
AGENT_EXECUTION_MAX_RETRIES=3
```

## Usage Examples

### 1. Synchronous Execution (HTTP)

```typescript
POST /agents/agent-uuid-123/execute
Content-Type: application/json

{
  "input": {
    "task_type": "content_creation",
    "topic": "AI Marketing Trends 2025",
    "word_count": 1000,
    "tone": "professional"
  },
  "timeout": 300
}
```

### 2. Asynchronous Execution (HTTP)

```typescript
POST /agents/agent-uuid-123/execute/async
Content-Type: application/json

{
  "input": {
    "task_type": "market_research",
    "industry": "SaaS",
    "competitors": ["company1", "company2"]
  },
  "callback_url": "https://myapp.com/callbacks/agent-result",
  "timeout": 600
}
```

### 3. MessagePattern (Microservice)

```typescript
// From another microservice
const result = await client.send(
  { cmd: 'agents.execute' },
  {
    agentId: 'agent-uuid-123',
    input: {
      task_type: 'email_campaign',
      target_audience: 'B2B SaaS',
      campaign_goal: 'lead_generation'
    }
  }
).toPromise();
```

### 4. From AgentsService

```typescript
// Inject AgentsService
constructor(private agentsService: AgentsService) {}

// Execute agent
const result = await this.agentsService.executeAgent(
  'agent-uuid-123',
  {
    task_type: 'seo_optimization',
    url: 'https://example.com',
    keywords: ['saas', 'marketing', 'automation']
  },
  300 // timeout in seconds
);

console.log('Success:', result.success);
console.log('Output:', result.output_data);
console.log('Execution time:', result.execution_time, 'ms');
console.log('Metrics:', result.metrics);
```

## Metrics Collection

Execution metrics are automatically recorded:
- Execution time (milliseconds)
- Success/failure status
- Tokens used (if available)
- Model API calls
- Error details

Metrics update agent statistics:
- `tasksCompleted` count
- `averageExecutionTime` rolling average
- `successRate` percentage
- `lastActiveAt` timestamp

## Error Handling

### Error Codes

- `CAPABILITY_MISMATCH` - Agent lacks required capabilities
- `AGENT_INVOCATION_ERROR` - Python API invocation failed
- `TIMEOUT_ERROR` - Execution exceeded timeout
- `NETWORK_ERROR` - Network connectivity issues
- `VALIDATION_ERROR` - Invalid input parameters
- `EXECUTION_ERROR` - General execution failure

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "TIMEOUT_ERROR",
    "message": "Execution timed out after 300 seconds",
    "details": {
      "agent_id": "uuid",
      "execution_id": "exec-123"
    }
  },
  "logs": ["..."],
  "execution_time": 300000,
  "status": "timeout"
}
```

## Testing

### Unit Tests

```typescript
describe('AgentExecutionService', () => {
  it('should execute agent successfully', async () => {
    const result = await service.execute(agent, invocation);
    expect(result.success).toBe(true);
    expect(result.execution_time).toBeGreaterThan(0);
  });

  it('should handle timeout', async () => {
    const result = await service.execute(agent, {
      ...invocation,
      timeout: 1
    });
    expect(result.status).toBe(ExecutionStatus.TIMEOUT);
  });

  it('should validate capabilities', async () => {
    const result = await service.execute(incompatibleAgent, invocation);
    expect(result.error?.code).toBe('CAPABILITY_MISMATCH');
  });
});
```

### Integration Tests

```bash
# Start Python API
cd libs/digital-agency
python -m uvicorn api.main:app --reload

# Run tests
npm test -- apps/agents-service
```

## Performance Considerations

- Default timeout: 5 minutes (300 seconds)
- Max timeout: 10 minutes (600 seconds)
- Retry attempts: 3 with exponential backoff
- Connection pooling via HttpModule
- Agent instance caching in Python API
- Async execution for long-running tasks

## Security

- Input validation at service layer
- Capability checking before execution
- Timeout enforcement
- Error sanitization
- No sensitive data in logs
- Optional callback authentication

## Monitoring

Key metrics to monitor:
- Execution success rate
- Average execution time
- Timeout rate
- Retry rate
- Error distribution by code
- Agent utilization

## Future Enhancements

1. **Streaming Support**
   - Real-time log streaming
   - Progress updates
   - Server-Sent Events

2. **Queue Management**
   - Redis-based task queue
   - Priority scheduling
   - Rate limiting

3. **Advanced Metrics**
   - Cost tracking
   - Token usage analytics
   - Performance profiling

4. **Execution History**
   - Persistent execution logs
   - Replay capability
   - Audit trail

5. **Circuit Breaker**
   - Auto-disable failing agents
   - Health checks
   - Automatic recovery

## Files Modified/Created

### Created
- `libs/interfaces/src/lib/dto/agent-execution.dto.ts`
- `libs/application/src/lib/agents/agent-execution.service.ts`
- `libs/domain/src/lib/agents/agent-metrics.entity.ts`
- `funnel-agents/apps/agents-service/README-EXECUTION.md`

### Modified
- `libs/application/src/lib/agents/agents.service.ts`
- `libs/application/src/lib/agents/index.ts`
- `libs/interfaces/src/lib/dto/index.ts`
- `apps/agents-service/src/controllers/agents.controller.ts`
- `apps/agents-service/src/modules/agents.module.ts`

## Installation & Setup

1. **Install Dependencies**
```bash
cd funnel-agents
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Add PYTHON_AGENT_API_URL=http://localhost:8000/api/v1
```

3. **Start Python API**
```bash
cd ../libs/digital-agency
python -m uvicorn api.main:app --reload --port 8000
```

4. **Start Agents Service**
```bash
cd funnel-agents
npm run start:agents-service
```

5. **Test Execution**
```bash
curl -X POST http://localhost:3000/agents/{agent-id}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "task_type": "custom",
      "data": "test"
    }
  }'
```

## Conclusion

The agent execution system is now fully operational with:
- ✅ Synchronous and asynchronous execution
- ✅ Capability validation
- ✅ Timeout handling
- ✅ Retry logic
- ✅ Metrics collection
- ✅ Error handling
- ✅ HTTP and MessagePattern support
- ✅ Integration with Python agent API

The system is production-ready and supports all requirements from the implementation specification.
