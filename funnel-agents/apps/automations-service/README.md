# Automations Service

The Automations Service handles workflow automation for the FunnelAgents platform. It manages workflow definitions, node configuration, and workflow execution tracking.

## Features

- **Workflow Management**: Create, update, and manage workflows
- **Workflow Execution**: Execute workflows with different trigger types
- **Run Tracking**: Track workflow execution history and status
- **Node-based Architecture**: Support for various node types (trigger, agent, condition, email, delay, webhook)

## Port

- TCP: **3007** (default)

## Environment Variables

```env
# Service Configuration
AUTOMATIONS_SERVICE_HOST=0.0.0.0
AUTOMATIONS_SERVICE_PORT=3007

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=funnelagents
DB_SYNCHRONIZE=true
DB_LOGGING=false
```

## Database Schema

### Workflows Table

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB,
  nodes JSONB DEFAULT '[]',
  edges JSONB DEFAULT '[]',
  workspace_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Workflow Runs Table

```sql
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  status VARCHAR(50) DEFAULT 'pending',
  trigger_type VARCHAR(50) NOT NULL,
  trigger_data JSONB,
  current_node_id UUID,
  execution_log JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Workflows

#### List All Workflows
```
GET /workflows
Query Parameters:
  - status?: 'draft' | 'active' | 'paused' | 'archived'
  - trigger_type?: 'manual' | 'webhook' | 'event' | 'scheduled'
  - workspace_id?: string

Response: Array<Workflow>
```

#### Get Workflow by ID
```
GET /workflows/:id

Response: Workflow
```

#### Create Workflow
```
POST /workflows
Body: {
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: 'manual' | 'webhook' | 'event' | 'scheduled';
  trigger_config?: Record<string, any>;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  workspace_id?: string;
}

Response: Workflow
```

#### Update Workflow
```
PATCH /workflows/:id
Body: {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type?: 'manual' | 'webhook' | 'event' | 'scheduled';
  trigger_config?: Record<string, any>;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  workspace_id?: string;
}

Response: Workflow
```

#### Delete Workflow
```
DELETE /workflows/:id

Response: 204 No Content
```

#### Execute Workflow
```
POST /workflows/:id/execute
Body: {
  trigger_data?: Record<string, any>;
}

Response: WorkflowRun
```

### Workflow Runs

#### List All Workflow Runs
```
GET /workflow-runs
Query Parameters:
  - workflow_id?: string
  - status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  - trigger_type?: string

Response: Array<WorkflowRun>
```

#### Get Workflow Run by ID
```
GET /workflow-runs/:id

Response: WorkflowRun
```

#### Create Workflow Run (Internal)
```
POST /workflow-runs
Body: {
  workflow_id: string;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_type: string;
  trigger_data?: Record<string, any>;
}

Response: WorkflowRun
```

## Data Models

### Workflow

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  trigger_type: 'manual' | 'webhook' | 'event' | 'scheduled';
  trigger_config?: Record<string, any>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  workspace_id?: string;
  created_at: Date;
  updated_at: Date;
}

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'agent' | 'condition' | 'email' | 'delay' | 'webhook';
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string; // node id
  target: string; // node id
  condition?: string;
}
```

### WorkflowRun

```typescript
interface WorkflowRun {
  id: string;
  workflow_id: string;
  workflow?: Workflow;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_type: string;
  trigger_data?: Record<string, any>;
  current_node_id?: string;
  execution_log: ExecutionLogEntry[];
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

interface ExecutionLogEntry {
  node_id: string;
  node_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}
```

## Microservices Patterns

The service supports both HTTP REST and TCP message-based communication:

### Message Patterns

```typescript
// Workflows
{ cmd: 'workflows.findAll' }
{ cmd: 'workflows.findById' }
{ cmd: 'workflows.create' }
{ cmd: 'workflows.update' }
{ cmd: 'workflows.delete' }
{ cmd: 'workflows.execute' }

// Workflow Runs
{ cmd: 'workflowRuns.findAll' }
{ cmd: 'workflowRuns.findById' }
{ cmd: 'workflowRuns.create' }
```

## Development

### Build
```bash
npx nx build automations-service
```

### Test
```bash
npx nx test automations-service
```

### Serve (Development)
```bash
npx nx serve automations-service
```

### Lint
```bash
npx nx lint automations-service
```

## Architecture

The service follows NestJS best practices with a modular architecture:

```
apps/automations-service/
├── src/
│   ├── workflows/
│   │   ├── dto/
│   │   │   ├── create-workflow.dto.ts
│   │   │   ├── update-workflow.dto.ts
│   │   │   └── execute-workflow.dto.ts
│   │   ├── entities/
│   │   │   └── workflow.entity.ts
│   │   ├── workflows.controller.ts
│   │   ├── workflows.service.ts
│   │   ├── workflows.repository.ts
│   │   └── workflows.module.ts
│   ├── workflow-runs/
│   │   ├── dto/
│   │   │   └── create-workflow-run.dto.ts
│   │   ├── entities/
│   │   │   └── workflow-run.entity.ts
│   │   ├── workflow-runs.controller.ts
│   │   ├── workflow-runs.service.ts
│   │   ├── workflow-runs.repository.ts
│   │   └── workflow-runs.module.ts
│   ├── app.module.ts
│   └── main.ts
└── README.md
```

## Workflow Execution Engine ✅

The service now includes a **complete, production-ready execution engine** with:

### Implemented Features

- ✅ **Node Execution Engine** - Full implementation with 6 node types
- ✅ **Conditional Branching** - Complex condition-based routing
- ✅ **Error Handling** - Stack traces and error recovery
- ✅ **Scheduling** - Cron-based scheduled triggers
- ✅ **Event Listeners** - Event-based workflow triggers
- ✅ **Webhook Triggers** - HTTP webhook support with secrets
- ✅ **Real-time Logging** - Node-by-node execution tracking
- ✅ **Context Management** - Variable interpolation between nodes

### Documentation

- [Execution Engine Details](./EXECUTION_ENGINE.md) - Complete documentation
- [Implementation Report](./IMPLEMENTATION_REPORT.md) - Technical summary
- [Examples](./examples/) - Sample workflow configurations

### Additional Endpoints

```
GET    /workflows/:id/validate       # Validate workflow
POST   /workflows/:id/activate       # Activate workflow
POST   /workflows/:id/pause          # Pause workflow
POST   /workflows/:id/archive        # Archive workflow
POST   /webhooks/:path               # Webhook trigger
POST   /webhook/workflow/:id         # Trigger by ID
POST   /workflow-runs/:id/cancel     # Cancel execution
POST   /workflow-runs/:id/retry      # Retry failed run
GET    /workflow-runs/:id/stats      # Execution stats
```

## Future Enhancements

1. **Parallel Execution**: Execute independent nodes concurrently
2. **Subworkflows**: Call other workflows as nodes
3. **Loop Nodes**: Iterate over arrays/collections
4. **Workflow Templates**: Pre-built workflow templates
5. **Real-time Updates**: WebSocket support for live updates
6. **Workflow Versioning**: Version control for workflows
7. **Visual Builder Integration**: Enhanced UI support
8. **A/B Testing**: Split traffic between workflow versions
9. **Advanced Analytics**: Detailed performance metrics
10. **Approval Nodes**: Human-in-the-loop workflows

## License

MIT
