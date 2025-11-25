# Backend Setup Guide - Agent Templates & Workflows

This guide helps backend developers set up the database and API endpoints required for the Agent Templates and Workflows features.

---

## Quick Start

1. **Apply Database Schema** - See `DATABASE_SCHEMA.md` for complete schema
2. **Seed Initial Data** - Load sample templates from `/database/seeds/`
3. **Implement Backend Functions** - See function signatures below
4. **Test API Endpoints** - Use provided test cases

---

## Step 1: Database Setup

### Using Base44

If using Base44's entity system, create these entities in your Base44 admin panel:

#### 1. AgentTemplate Entity

```javascript
{
  name: "AgentTemplate",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "text" },
    { name: "domain", type: "string", required: true },
    { name: "persona", type: "json" },
    { name: "useCase", type: "array:string" },
    { name: "typicalTasks", type: "array:string" },
    { name: "popularityLabel", type: "string" },
    { name: "overview", type: "array:string" },
    { name: "exampleTasks", type: "array:string" },
    { name: "defaultConfig", type: "json" },
    { name: "commonlyUsedWith", type: "array:string" },
    { name: "is_active", type: "boolean", default: true },
    { name: "activation_count", type: "number", default: 0 },
    { name: "usage_count", type: "number", default: 0 },
    { name: "last_activated_at", type: "datetime" },
    { name: "created_at", type: "datetime", auto: true },
    { name: "updated_at", type: "datetime", auto: true },
    { name: "created_by", type: "string" }
  ]
}
```

#### 2. WorkflowTemplate Entity

```javascript
{
  name: "WorkflowTemplate",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "text" },
    { name: "nodes", type: "json", required: true },
    { name: "connections", type: "json", required: true },
    { name: "trigger_type", type: "string", default: "manual" },
    { name: "variables", type: "json", default: {} },
    { name: "steps", type: "number", default: 0 },
    { name: "agents", type: "array:string" },
    { name: "outcome", type: "text" },
    { name: "category", type: "string" },
    { name: "tags", type: "array:string" },
    { name: "difficulty", type: "string" },
    { name: "popularity", type: "string" },
    { name: "usage_count", type: "number", default: 0 },
    { name: "rating", type: "number" },
    { name: "is_active", type: "boolean", default: true },
    { name: "is_featured", type: "boolean", default: false },
    { name: "created_at", type: "datetime", auto: true },
    { name: "updated_at", type: "datetime", auto: true },
    { name: "created_by", type: "string" }
  ]
}
```

#### 3. Workflow Entity

```javascript
{
  name: "Workflow",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "text" },
    { name: "nodes", type: "json", required: true },
    { name: "connections", type: "json", required: true },
    { name: "trigger_type", type: "string", default: "manual" },
    { name: "variables", type: "json", default: {} },
    { name: "trigger", type: "json" },
    { name: "status", type: "string", default: "draft" },
    { name: "runs_count", type: "number", default: 0 },
    { name: "success_count", type: "number", default: 0 },
    { name: "failure_count", type: "number", default: 0 },
    { name: "last_run_at", type: "datetime" },
    { name: "next_run_at", type: "datetime" },
    { name: "avg_execution_time", type: "number" },
    { name: "success_rate", type: "number" },
    { name: "workspace_id", type: "string" },
    { name: "template_id", type: "reference:WorkflowTemplate" },
    { name: "created_at", type: "datetime", auto: true },
    { name: "updated_at", type: "datetime", auto: true },
    { name: "created_by", type: "string" },
    { name: "updated_by", type: "string" }
  ]
}
```

#### 4. WorkflowRun Entity

```javascript
{
  name: "WorkflowRun",
  fields: [
    { name: "workflow_id", type: "reference:Workflow", required: true },
    { name: "workflow_name", type: "string" },
    { name: "status", type: "string", default: "pending" },
    { name: "trigger_type", type: "string" },
    { name: "trigger_data", type: "json" },
    { name: "started_at", type: "datetime" },
    { name: "completed_at", type: "datetime" },
    { name: "execution_time", type: "number" },
    { name: "result", type: "json" },
    { name: "error", type: "json" },
    { name: "node_executions", type: "json", default: [] },
    { name: "executed_by", type: "string" },
    { name: "created_at", type: "datetime", auto: true }
  ]
}
```

### Using Direct SQL

See `DATABASE_SCHEMA.md` section "Migration Script Example" for complete SQL.

---

## Step 2: Seed Initial Data

### Using Node.js Script

```javascript
// scripts/seed-templates.js
const fs = require('fs');
const { base44 } = require('./base44-client');

async function seedAgentTemplates() {
  const templates = JSON.parse(
    fs.readFileSync('./database/seeds/agent_templates_seed.json', 'utf8')
  );

  for (const template of templates) {
    try {
      await base44.entities.AgentTemplate.create(template);
      console.log(`✓ Created template: ${template.name}`);
    } catch (error) {
      console.error(`✗ Failed to create ${template.name}:`, error.message);
    }
  }
}

async function seedWorkflowTemplates() {
  const templates = JSON.parse(
    fs.readFileSync('./database/seeds/workflow_templates_seed.json', 'utf8')
  );

  for (const template of templates) {
    try {
      await base44.entities.WorkflowTemplate.create(template);
      console.log(`✓ Created workflow template: ${template.name}`);
    } catch (error) {
      console.error(`✗ Failed to create ${template.name}:`, error.message);
    }
  }
}

async function main() {
  console.log('Starting seed process...');
  await seedAgentTemplates();
  await seedWorkflowTemplates();
  console.log('Seed complete!');
}

main().catch(console.error);
```

Run: `node scripts/seed-templates.js`

---

## Step 3: Implement Backend Functions

### Agent Template Functions

#### getAgentTemplates

```javascript
// Function: getAgentTemplates
// Method: GET
// Path: /api/agents/templates

export async function getAgentTemplates(request, context) {
  const templates = await context.db.AgentTemplate.list({
    where: { is_active: true },
    orderBy: '-created_at',
  });

  return {
    data: templates,
    count: templates.length,
  };
}
```

#### activateAgentTemplate

```javascript
// Function: activateAgentTemplate
// Method: POST
// Path: /api/agents/templates/:id/activate

export async function activateAgentTemplate(request, context) {
  const { template_id } = request.body;

  const template = await context.db.AgentTemplate.get(template_id);
  if (!template) {
    throw new Error('Template not found');
  }

  const updated = await context.db.AgentTemplate.update(template_id, {
    is_active: true,
    activation_count: (template.activation_count || 0) + 1,
    last_activated_at: new Date().toISOString(),
  });

  return {
    data: updated,
    message: 'Template activated successfully',
  };
}
```

### Workflow Functions

#### getWorkflows

```javascript
// Function: getWorkflows
// Method: GET
// Path: /api/workflows

export async function getWorkflows(request, context) {
  const user = context.user;

  const workflows = await context.db.Workflow.list({
    where: { created_by: user.id },
    orderBy: '-updated_at',
  });

  return {
    data: workflows,
    count: workflows.length,
  };
}
```

#### createWorkflow

```javascript
// Function: createWorkflow
// Method: POST
// Path: /api/workflows

export async function createWorkflow(request, context) {
  const { workflow } = request.body;
  const user = context.user;

  const newWorkflow = await context.db.Workflow.create({
    ...workflow,
    created_by: user.id,
    updated_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    data: newWorkflow,
    message: 'Workflow created successfully',
  };
}
```

#### duplicateWorkflow

```javascript
// Function: duplicateWorkflow
// Method: POST
// Path: /api/workflows/:id/duplicate

export async function duplicateWorkflow(request, context) {
  const { workflow_id } = request.body;
  const user = context.user;

  const original = await context.db.Workflow.get(workflow_id);
  if (!original) {
    throw new Error('Workflow not found');
  }

  const duplicated = await context.db.Workflow.create({
    ...original,
    id: undefined, // Generate new ID
    name: `${original.name} (Copy)`,
    status: 'draft',
    runs_count: 0,
    success_count: 0,
    failure_count: 0,
    last_run_at: null,
    created_by: user.id,
    updated_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return {
    data: duplicated,
    message: 'Workflow duplicated successfully',
  };
}
```

#### executeWorkflow

```javascript
// Function: executeWorkflow
// Method: POST
// Path: /api/workflows/:id/execute

export async function executeWorkflow(request, context) {
  const { workflow_id, run_id, trigger_data } = request.body;
  const user = context.user;

  const workflow = await context.db.Workflow.get(workflow_id);
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  // Update run status
  await context.db.WorkflowRun.update(run_id, {
    status: 'running',
    started_at: new Date().toISOString(),
  });

  try {
    // Execute workflow logic here
    const result = await processWorkflow(workflow, trigger_data);

    // Update run with success
    await context.db.WorkflowRun.update(run_id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      execution_time: Date.now() - new Date(run.started_at).getTime(),
      result,
    });

    // Update workflow stats
    await context.db.Workflow.update(workflow_id, {
      runs_count: (workflow.runs_count || 0) + 1,
      success_count: (workflow.success_count || 0) + 1,
      last_run_at: new Date().toISOString(),
    });

    return {
      data: result,
      message: 'Workflow executed successfully',
    };
  } catch (error) {
    // Update run with failure
    await context.db.WorkflowRun.update(run_id, {
      status: 'failed',
      completed_at: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
      },
    });

    // Update workflow stats
    await context.db.Workflow.update(workflow_id, {
      runs_count: (workflow.runs_count || 0) + 1,
      failure_count: (workflow.failure_count || 0) + 1,
      last_run_at: new Date().toISOString(),
    });

    throw error;
  }
}

// Workflow execution engine (implement based on your needs)
async function processWorkflow(workflow, triggerData) {
  // 1. Validate workflow structure
  // 2. Execute nodes in order based on connections
  // 3. Handle conditions and branching
  // 4. Collect results from each node
  // 5. Return final result

  // Placeholder implementation
  return {
    completed_nodes: workflow.nodes.length,
    output: {},
  };
}
```

---

## Step 4: Testing

### API Test Cases

Use these cURL commands or Postman to test:

#### List Agent Templates
```bash
curl -X GET http://localhost:3000/api/agents/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Activate Template
```bash
curl -X POST http://localhost:3000/api/agents/templates/tpl_market_researcher/activate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"template_id": "tpl_market_researcher"}'
```

#### List Workflows
```bash
curl -X GET http://localhost:3000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Workflow
```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "name": "Test Workflow",
      "description": "Testing",
      "status": "draft",
      "nodes": [],
      "connections": []
    }
  }'
```

#### Execute Workflow
```bash
curl -X POST http://localhost:3000/api/workflows/WORKFLOW_ID/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "WORKFLOW_ID",
    "trigger_data": {
      "type": "manual",
      "user_id": "USER_ID"
    }
  }'
```

---

## Step 5: Deployment

### Pre-deployment Checklist

- [ ] All database migrations applied
- [ ] Seed data loaded
- [ ] All backend functions implemented
- [ ] API endpoints tested
- [ ] Permissions and authentication configured
- [ ] Rate limiting configured
- [ ] Error logging set up
- [ ] Monitoring dashboard configured

### Environment Variables

Add these to your `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Base44 (if applicable)
BASE44_APP_ID=your_app_id
BASE44_SERVER_URL=https://api.base44.io
BASE44_API_KEY=your_api_key

# Feature Flags
ENABLE_WORKFLOW_EXECUTION=true
ENABLE_TEMPLATE_CREATION=true
```

---

## Troubleshooting

### Common Issues

**Issue:** "Entity not found" errors in frontend
- **Solution:** Ensure entities are created in Base44 admin panel or fallback functions are implemented

**Issue:** Workflow execution hangs
- **Solution:** Add timeout handling and proper error catching in execution engine

**Issue:** Slow template loading
- **Solution:** Add database indexes on frequently queried fields (see DATABASE_SCHEMA.md)

**Issue:** Duplicate workflow creation fails
- **Solution:** Ensure IDs are properly removed before creating copy

---

## Support

For questions or issues:
- Check `DATABASE_SCHEMA.md` for schema details
- Check `IMPLEMENTATION_REPORT.md` for frontend integration
- Review seed data in `/database/seeds/`
- Contact frontend team for API contract questions

---

## Next Steps

1. Implement workflow execution engine
2. Add WebSocket support for real-time updates
3. Implement workflow scheduling
4. Add workflow analytics
5. Create admin dashboard for template management

---

**Backend Setup Guide**
**Version:** 1.0
**Last Updated:** 2025-11-25
