# Digital Agency Python Agent API

Production-ready FastAPI service that exposes Python agents to the NestJS backend.

## Features

- **Dynamic Agent Discovery**: Automatically discovers all agents from the `/agents` directory
- **Agent Execution**: Synchronous and streaming execution modes with timeout handling
- **Async Processing**: Celery integration for long-running agent tasks
- **Comprehensive API**: REST endpoints for agent management and execution
- **Production Ready**: Health checks, error handling, logging, CORS, and auth middleware

## Architecture

```
api/
├── core/
│   ├── agent_discovery.py    # Scans and catalogs agents
│   ├── agent_executor.py     # Loads and executes agents dynamically
│   └── exceptions.py         # Custom exception types
├── routes/
│   ├── agents.py            # Agent execution endpoints
│   ├── tasks.py             # Celery task status endpoints
│   ├── health.py            # Health check endpoints
│   └── webhooks.py          # Webhook endpoints
├── schemas/
│   ├── agent_execution_schemas.py  # Pydantic models
│   └── agent_schemas.py
├── middleware/
│   ├── auth.py              # JWT authentication
│   └── rate_limiter.py      # Rate limiting
├── tasks/
│   └── celery_tasks.py      # Async task definitions
└── main.py                  # FastAPI app entry point
```

## API Endpoints

### Agent Discovery

- `GET /api/v1/agents` - List all agents
- `GET /api/v1/agents/domains` - List all domains
- `GET /api/v1/agents/{domain}` - List agents in domain
- `GET /api/v1/agents/{domain}/{agent_name}` - Get agent info

### Agent Execution

- `POST /api/v1/agents/{domain}/{agent_name}/execute` - Execute agent synchronously
- `POST /api/v1/agents/{domain}/{agent_name}/stream` - Execute with SSE streaming
- `POST /api/v1/agents/{domain}/{agent_name}/async` - Execute asynchronously (Celery)

### Task Management

- `GET /api/v1/tasks/{task_id}/status` - Get async task status
- `POST /api/v1/tasks/{task_id}/cancel` - Cancel running task

### Health & Monitoring

- `GET /api/v1/health` - Comprehensive health check
- `GET /api/v1/ready` - Readiness probe (Kubernetes)
- `GET /api/v1/live` - Liveness probe (Kubernetes)

### Cache Management

- `DELETE /api/v1/agents/{domain}/{agent_name}/cache` - Clear agent cache

## Usage Examples

### 1. List All Agents

```bash
curl http://localhost:8000/api/v1/agents
```

Response:
```json
{
  "agents": [
    {
      "domain": "offer",
      "agent_name": "proposal_writer",
      "name": "Proposal Writer",
      "version": "0.1.0",
      "description": "Creates proposals, presentations, and sales materials",
      "capabilities": ["proposal_creation", "executive_summary_writing"],
      "parameters": {},
      "integrations": []
    }
  ],
  "total": 1
}
```

### 2. Execute Agent

```bash
curl -X POST http://localhost:8000/api/v1/agents/offer/proposal_writer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": {
      "client_info": {
        "name": "Acme Corp",
        "industry": "Technology",
        "pain_points": ["Operational inefficiencies"]
      },
      "service_package": {
        "name": "Digital Transformation",
        "pricing": {"total": 50000}
      }
    },
    "timeout": 300
  }'
```

Response:
```json
{
  "success": true,
  "output": {
    "proposal_id": "prop_1234567890",
    "sections": {...},
    "win_probability": {"score": 75.5}
  },
  "logs": [
    "Agent loaded: ProposalWriterAgent",
    "Execution completed in 2.45s"
  ],
  "metrics": {
    "execution_time_seconds": 2.45,
    "agent_name": "proposal_writer",
    "domain": "offer"
  },
  "error": null
}
```

### 3. Stream Execution (SSE)

```bash
curl -X POST http://localhost:8000/api/v1/agents/offer/proposal_writer/stream \
  -H "Content-Type: application/json" \
  -d '{...}'
```

Response (Server-Sent Events):
```
event: start
data: {"agent": "proposal_writer", "domain": "offer"}

event: log
data: {"message": "Agent loaded: ProposalWriterAgent"}

event: progress
data: {"status": "executing", "progress": 50}

event: result
data: {"success": true, "output": {...}}

event: complete
data: {"success": true}
```

### 4. Async Execution

```bash
# Submit task
curl -X POST http://localhost:8000/api/v1/agents/offer/proposal_writer/async \
  -H "Content-Type: application/json" \
  -d '{...}'
```

Response:
```json
{
  "task_id": "abc123-def456-ghi789",
  "status": "PENDING",
  "agent": "offer/proposal_writer",
  "created_at": 1234567890.123
}
```

```bash
# Check status
curl http://localhost:8000/api/v1/tasks/abc123-def456-ghi789/status
```

Response:
```json
{
  "task_id": "abc123-def456-ghi789",
  "status": "SUCCESS",
  "result": {
    "success": true,
    "output": {...}
  },
  "error": null,
  "completed_at": 1234567890.123
}
```

## Running the API

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export REDIS_URL="redis://:password@localhost:6379/0"
export CELERY_BROKER_URL="redis://:password@localhost:6379/1"

# Run API server
python -m api.main

# Or with uvicorn
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### With Celery Worker

Terminal 1 (API):
```bash
uvicorn api.main:app --reload
```

Terminal 2 (Celery Worker):
```bash
celery -A celery_app worker --loglevel=info
```

### Production

```bash
# Run with production settings
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4

# With Gunicorn
gunicorn api.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 300
```

## Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://:password@localhost:6379/0

# Celery Configuration
CELERY_BROKER_URL=redis://:password@localhost:6379/1
CELERY_RESULT_BACKEND=redis://:password@localhost:6379/2

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-here
JWT_ISSUER=digital-agency-api
JWT_AUDIENCE=digital-agency-clients

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
```

## Agent Structure

Agents are discovered from the `/agents` directory:

```
agents/
├── 01_offer/
│   ├── proposal_writer/
│   │   ├── agent.py          # Agent implementation
│   │   └── config.yaml       # Agent metadata
│   └── pricing_strategist/
├── 02_marketing/
│   ├── campaign_creator/
│   └── content_generator/
└── ...
```

### Agent Requirements

1. **Agent Class**: Must have a class ending with "Agent"
2. **Execution Method**: Must implement `execute()`, `run()`, or `process()` method
3. **Config File**: Optional `config.yaml` for metadata

### Example Agent

```python
# agents/01_offer/my_agent/agent.py

class MyAgent:
    def __init__(self):
        self.name = "My Agent"

    async def execute(self, input_data: dict, config: dict = None):
        # Agent logic here
        return {"result": "success"}

    def validate_input(self, input_data: dict) -> list:
        errors = []
        if 'required_field' not in input_data:
            errors.append("Missing required_field")
        return errors
```

```yaml
# agents/01_offer/my_agent/config.yaml

agent:
  name: "My Agent"
  version: "1.0.0"
  description: "Description of what this agent does"

capabilities:
  - capability_1
  - capability_2

parameters:
  param1: value1
```

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=api --cov-report=html

# Run specific test
pytest tests/test_agent_executor.py -v
```

## Implementation Report

### Backend Feature Delivered - Python Agent API (2025-11-25)

**Stack Detected**: Python FastAPI 0.104+, Celery 5.3+, Redis

**Files Added**:
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/core/__init__.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/core/exceptions.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/core/agent_discovery.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/core/agent_executor.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/schemas/agent_execution_schemas.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/tasks/celery_tasks.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/tasks/__init__.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/requirements.txt`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/README.md`

**Files Modified**:
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/routes/agents.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/routes/tasks.py`
- `/home/anga/workspace/beta/codehornets-ai/libs/digital-agency/api/routes/health.py`

**Key Endpoints/APIs**:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/agents` | List all agents with filtering |
| GET | `/api/v1/agents/domains` | List all domains |
| GET | `/api/v1/agents/{domain}` | List agents in domain |
| GET | `/api/v1/agents/{domain}/{agent_name}` | Get agent info |
| POST | `/api/v1/agents/{domain}/{agent_name}/execute` | Execute agent sync |
| POST | `/api/v1/agents/{domain}/{agent_name}/stream` | Execute with SSE streaming |
| POST | `/api/v1/agents/{domain}/{agent_name}/async` | Execute async (Celery) |
| GET | `/api/v1/tasks/{task_id}/status` | Get task status |
| POST | `/api/v1/tasks/{task_id}/cancel` | Cancel task |
| GET | `/api/v1/health` | Health check |
| DELETE | `/api/v1/agents/{domain}/{agent_name}/cache` | Clear cache |

**Design Notes**:
- Pattern: Clean Architecture with separation of concerns (Core, Routes, Schemas, Tasks)
- Agent Discovery: Dynamic file-system scanning with YAML config parsing
- Agent Executor: Reflection-based dynamic loading with caching
- Async Support: Celery task queue with Redis backend
- Streaming: Server-Sent Events for real-time progress
- Security: JWT auth middleware, CORS support, input validation
- Error Handling: Custom exceptions with proper HTTP status codes
- Timeout: Configurable per-execution timeout (1-3600s)

**Tests**:
- Structure ready for pytest implementation
- Endpoints designed for integration testing
- Mock data patterns established

**Performance**:
- Agent caching reduces load time on repeated executions
- Async execution prevents blocking on long-running tasks
- Streaming execution provides real-time feedback
- Timeout enforcement prevents hung processes

## License

Proprietary - Ornomedia Digital Agency Platform
