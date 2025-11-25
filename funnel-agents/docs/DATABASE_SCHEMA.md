# Database Schema Documentation

This document describes the required database schema for the Agent Templates and Workflow Templates features.

## Entities Overview

1. **AgentTemplate** - Stores reusable agent configuration templates
2. **AgentTemplateCategory** - Categorizes agent templates
3. **WorkflowTemplate** - Stores reusable workflow templates
4. **Workflow** - Stores user-created workflows
5. **WorkflowRun** - Tracks workflow execution history

---

## Entity Definitions

### 1. AgentTemplate

Stores reusable agent configuration templates.

**Fields:**

```javascript
{
  id: String (UUID, auto-generated),
  name: String (required),
  description: String,
  domain: String (required), // e.g., "Marketing", "Sales", "Operations"

  // Persona configuration
  persona: {
    firstName: String,
    lastName: String,
    title: String,
    initials: String,
    avatar: String (URL)
  },

  // Use cases and tags
  useCase: Array<String>, // e.g., ["Research", "Top-of-funnel", "B2B"]
  typicalTasks: Array<String>,
  popularityLabel: String, // e.g., "Popular", "Top-rated", "Recommended"

  // Template details
  overview: Array<String>, // List of bullet points
  exampleTasks: Array<String>,

  // Default configuration
  defaultConfig: {
    tools: Array<String>,
    tone: String,
    audience: String,
    dataAccess: Array<String>,
    requiresApproval: Boolean
  },

  // Related templates
  commonlyUsedWith: Array<String>, // Template names or IDs

  // Metadata
  is_active: Boolean (default: true),
  activation_count: Number (default: 0),
  usage_count: Number (default: 0),
  last_activated_at: Date,
  created_at: Date (auto),
  updated_at: Date (auto),
  created_by: String (user ID)
}
```

**Indexes:**
- `domain` (for filtering)
- `useCase` (for filtering)
- `is_active` (for queries)
- `created_at` (for sorting)

---

### 2. AgentTemplateCategory

Categorizes agent templates for better organization.

**Fields:**

```javascript
{
  id: String (UUID, auto-generated),
  name: String (required), // e.g., "Marketing", "Sales"
  domain: String (required), // Matches AgentTemplate.domain
  description: String,
  icon: String, // Icon name or URL
  color: String, // Hex color code for UI
  sort_order: Number (default: 0),
  is_active: Boolean (default: true),
  created_at: Date (auto),
  updated_at: Date (auto)
}
```

**Indexes:**
- `domain` (unique)
- `sort_order`

---

### 3. WorkflowTemplate

Stores reusable workflow templates.

**Fields:**

```javascript
{
  id: String (UUID, auto-generated),
  name: String (required),
  description: String,

  // Workflow definition
  nodes: Array<Object>, // Workflow nodes configuration
  connections: Array<Object>, // Node connections
  trigger_type: String, // "manual", "webhook", "schedule", "event"
  variables: Object, // Default variables

  // Template metadata
  steps: Number, // Number of steps/nodes
  agents: Array<String>, // Agent names involved
  outcome: String, // Expected outcome description

  // Categorization
  category: String,
  tags: Array<String>,
  difficulty: String, // "beginner", "intermediate", "advanced"

  // Popularity metrics
  popularity: String, // "Popular", "Trending", etc.
  usage_count: Number (default: 0),
  rating: Number, // Average rating (0-5)

  // Status
  is_active: Boolean (default: true),
  is_featured: Boolean (default: false),

  // Metadata
  created_at: Date (auto),
  updated_at: Date (auto),
  created_by: String (user ID)
}
```

**Node Structure Example:**

```javascript
{
  id: String,
  type: String, // "trigger", "agent", "condition", "delay", "action"
  config: {
    name: String,
    description: String,
    // Type-specific configuration
    agent_id: String, // For agent nodes
    condition: String, // For condition nodes
    duration: Number, // For delay nodes
    // ... other type-specific fields
  },
  position: { x: Number, y: Number }
}
```

**Connection Structure Example:**

```javascript
{
  id: String,
  from: String, // Source node ID
  to: String // Target node ID
}
```

**Indexes:**
- `category`
- `is_active`
- `popularity` (for sorting)
- `usage_count` (for sorting)
- `created_at`

---

### 4. Workflow

Stores user-created workflows (instances).

**Fields:**

```javascript
{
  id: String (UUID, auto-generated),
  name: String (required),
  description: String,

  // Workflow definition (same structure as WorkflowTemplate)
  nodes: Array<Object>,
  connections: Array<Object>,
  trigger_type: String,
  variables: Object,

  // Trigger configuration
  trigger: {
    type: String, // "manual", "webhook", "schedule", "event"
    config: Object, // Type-specific configuration
    conditions: Array<Object> // Trigger conditions
  },

  // Status and execution
  status: String, // "draft", "active", "paused", "archived"
  runs_count: Number (default: 0),
  success_count: Number (default: 0),
  failure_count: Number (default: 0),
  last_run_at: Date,
  next_run_at: Date, // For scheduled workflows

  // Performance metrics
  avg_execution_time: Number, // In milliseconds
  success_rate: Number, // Percentage

  // Scope
  workspace_id: String, // Optional: client-specific or global

  // Template reference
  template_id: String, // Reference to WorkflowTemplate if created from template

  // Metadata
  created_at: Date (auto),
  updated_at: Date (auto),
  created_by: String (user ID),
  updated_by: String (user ID)
}
```

**Indexes:**
- `status` (for filtering)
- `workspace_id` (for scoping)
- `created_by` (for user workflows)
- `updated_at` (for sorting)
- `template_id` (for template tracking)

---

### 5. WorkflowRun

Tracks individual workflow execution instances.

**Fields:**

```javascript
{
  id: String (UUID, auto-generated),
  workflow_id: String (required, foreign key to Workflow),
  workflow_name: String, // Cached for historical reference

  // Execution details
  status: String, // "pending", "running", "completed", "failed", "cancelled"
  trigger_type: String, // "manual", "webhook", "schedule", "event"
  trigger_data: Object, // Data that triggered the execution

  // Timing
  started_at: Date,
  completed_at: Date,
  execution_time: Number, // In milliseconds

  // Results
  result: Object, // Execution result data
  error: Object, // Error details if failed

  // Node execution tracking
  node_executions: Array<Object>, // Individual node execution results

  // Metadata
  executed_by: String (user ID or system),
  created_at: Date (auto)
}
```

**Node Execution Structure:**

```javascript
{
  node_id: String,
  node_name: String,
  status: String, // "pending", "running", "completed", "failed", "skipped"
  started_at: Date,
  completed_at: Date,
  execution_time: Number,
  input: Object,
  output: Object,
  error: Object
}
```

**Indexes:**
- `workflow_id` (for workflow history)
- `status` (for filtering)
- `started_at` (for sorting)
- `created_at` (for sorting)

---

## Relationships

```
AgentTemplate
├─ belongsTo: AgentTemplateCategory (via domain)
└─ hasMany: Agent (via template_id)

WorkflowTemplate
└─ hasMany: Workflow (via template_id)

Workflow
├─ belongsTo: WorkflowTemplate (via template_id)
├─ belongsTo: User (via created_by)
└─ hasMany: WorkflowRun (via workflow_id)

WorkflowRun
├─ belongsTo: Workflow (via workflow_id)
└─ belongsTo: User (via executed_by)
```

---

## Backend Functions Required

### Agent Templates

1. **getAgentTemplates()** - List all agent templates
2. **getAgentTemplate(template_id)** - Get single template
3. **createAgentTemplate(template)** - Create new template
4. **updateAgentTemplate(template_id, updates)** - Update template
5. **deleteAgentTemplate(template_id)** - Delete template
6. **activateAgentTemplate(template_id)** - Activate template
7. **createAgentFromTemplate(template_id, customizations)** - Create agent from template

### Workflow Templates

1. **getWorkflowTemplates()** - List all workflow templates
2. **getWorkflowTemplate(template_id)** - Get single template
3. **createWorkflowTemplate(template)** - Create new template
4. **updateWorkflowTemplate(template_id, updates)** - Update template
5. **deleteWorkflowTemplate(template_id)** - Delete template

### Workflows

1. **getWorkflows()** - List all user workflows
2. **getWorkflow(workflow_id)** - Get single workflow
3. **createWorkflow(workflow)** - Create new workflow
4. **updateWorkflow(workflow_id, updates)** - Update workflow
5. **deleteWorkflow(workflow_id)** - Delete workflow
6. **duplicateWorkflow(workflow_id)** - Duplicate workflow
7. **executeWorkflow(workflow_id, trigger_data)** - Execute workflow
8. **getWorkflowRuns(workflow_id)** - Get execution history

---

## API Endpoints (REST)

### Agent Templates
- `GET /api/agents/templates` - List templates
- `GET /api/agents/templates/:id` - Get template
- `POST /api/agents/templates` - Create template
- `PUT /api/agents/templates/:id` - Update template
- `DELETE /api/agents/templates/:id` - Delete template
- `POST /api/agents/templates/:id/activate` - Activate template
- `POST /api/agents/templates/:id/create-agent` - Create agent from template

### Workflow Templates
- `GET /api/workflows/templates` - List templates
- `GET /api/workflows/templates/:id` - Get template
- `POST /api/workflows/templates` - Create template
- `PUT /api/workflows/templates/:id` - Update template
- `DELETE /api/workflows/templates/:id` - Delete template

### Workflows
- `GET /api/workflows` - List user workflows
- `GET /api/workflows/:id` - Get workflow
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/duplicate` - Duplicate workflow
- `POST /api/workflows/:id/execute` - Execute workflow
- `GET /api/workflows/:id/runs` - Get execution history
- `GET /api/workflows/:id/runs/:run_id` - Get specific run

---

## WebSocket Events (Optional for Real-time Updates)

### Workflow Execution Events

```javascript
// Client subscribes
socket.emit('subscribe:workflow', { workflow_id: 'xxx' });

// Server emits
socket.emit('workflow:status', {
  workflow_id: 'xxx',
  status: 'running',
  progress: 0.5
});

socket.emit('workflow:completed', {
  workflow_id: 'xxx',
  run_id: 'yyy',
  status: 'completed',
  result: { ... }
});

socket.emit('workflow:failed', {
  workflow_id: 'xxx',
  run_id: 'yyy',
  status: 'failed',
  error: { ... }
});

socket.emit('workflow:node-executed', {
  workflow_id: 'xxx',
  run_id: 'yyy',
  node_id: 'zzz',
  status: 'completed',
  output: { ... }
});
```

---

## Migration Script Example (SQL)

```sql
-- AgentTemplate table
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(100) NOT NULL,
  persona JSONB,
  use_case TEXT[],
  typical_tasks TEXT[],
  popularity_label VARCHAR(50),
  overview TEXT[],
  example_tasks TEXT[],
  default_config JSONB,
  commonly_used_with TEXT[],
  is_active BOOLEAN DEFAULT true,
  activation_count INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX idx_agent_templates_domain ON agent_templates(domain);
CREATE INDEX idx_agent_templates_use_case ON agent_templates USING GIN(use_case);
CREATE INDEX idx_agent_templates_is_active ON agent_templates(is_active);
CREATE INDEX idx_agent_templates_created_at ON agent_templates(created_at DESC);

-- WorkflowTemplate table
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  connections JSONB NOT NULL DEFAULT '[]',
  trigger_type VARCHAR(50) DEFAULT 'manual',
  variables JSONB DEFAULT '{}',
  steps INTEGER DEFAULT 0,
  agents TEXT[],
  outcome TEXT,
  category VARCHAR(100),
  tags TEXT[],
  difficulty VARCHAR(50),
  popularity VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255)
);

CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_is_active ON workflow_templates(is_active);
CREATE INDEX idx_workflow_templates_usage_count ON workflow_templates(usage_count DESC);
CREATE INDEX idx_workflow_templates_created_at ON workflow_templates(created_at DESC);

-- Workflow table
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  nodes JSONB NOT NULL DEFAULT '[]',
  connections JSONB NOT NULL DEFAULT '[]',
  trigger_type VARCHAR(50) DEFAULT 'manual',
  variables JSONB DEFAULT '{}',
  trigger JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  runs_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  avg_execution_time INTEGER,
  success_rate DECIMAL(5,2),
  workspace_id VARCHAR(255),
  template_id UUID REFERENCES workflow_templates(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_workspace_id ON workflows(workspace_id);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_updated_at ON workflows(updated_at DESC);
CREATE INDEX idx_workflows_template_id ON workflows(template_id);

-- WorkflowRun table
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  workflow_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  trigger_type VARCHAR(50),
  trigger_data JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  execution_time INTEGER,
  result JSONB,
  error JSONB,
  node_executions JSONB DEFAULT '[]',
  executed_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_workflow_runs_started_at ON workflow_runs(started_at DESC);
CREATE INDEX idx_workflow_runs_created_at ON workflow_runs(created_at DESC);
```

---

## Initial Data Seeding

See separate seeding scripts in `/database/seeds/` for:
- `agent_templates_seed.js` - Sample agent templates
- `workflow_templates_seed.js` - Sample workflow templates

---

## Notes

- All dates are stored in ISO 8601 format
- JSONB fields are used for flexible nested data structures
- UUIDs are used for all primary keys for distributed systems
- Indexes are optimized for common query patterns (filtering, sorting)
- Foreign keys maintain referential integrity
- ON DELETE CASCADE ensures cleanup of related workflow runs
