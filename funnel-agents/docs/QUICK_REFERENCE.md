# Quick Reference - Agent Templates & Workflows

One-page reference for developers working with the new database-backed system.

---

## 📁 File Locations

### Frontend
```
apps/web-ui/src/
├── pages/
│   ├── AgentTemplates.jsx          # Template browser
│   ├── Workflows.jsx                # Workflow management
│   └── WorkflowBuilder.jsx          # Visual editor
├── hooks/
│   ├── useAgentTemplates.js         # Agent template hooks
│   └── useWorkflows.js              # Workflow hooks
└── components/workflows/
    ├── WorkflowCard.jsx             # Workflow display
    ├── WorkflowCanvas.jsx           # Visual canvas
    └── WorkflowNode.jsx             # Node component
```

### Documentation
```
funnel-agents/
├── DATABASE_SCHEMA.md               # Complete schema
├── BACKEND_SETUP_GUIDE.md          # Backend instructions
├── IMPLEMENTATION_REPORT.md        # Implementation details
├── INTEGRATION_SUMMARY.md          # Project summary
└── database/seeds/                 # Sample data
    ├── agent_templates_seed.json
    └── workflow_templates_seed.json
```

---

## 🎣 Custom Hooks Reference

### Agent Templates

```javascript
import {
  useAgentTemplates,
  useAgentTemplate,
  useActivateTemplate,
  useCreateAgentFromTemplate
} from '@/hooks/useAgentTemplates';

// List all templates
const { data: templates, isLoading } = useAgentTemplates();

// Get single template
const { data: template } = useAgentTemplate(templateId);

// Activate template
const activateMutation = useActivateTemplate();
activateMutation.mutate(templateId);

// Create agent from template
const createMutation = useCreateAgentFromTemplate();
createMutation.mutate({ template, customizations });
```

### Workflows

```javascript
import {
  useWorkflows,
  useWorkflow,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useDuplicateWorkflow,
  useExecuteWorkflow,
  useWorkflowRuns
} from '@/hooks/useWorkflows';

// List workflows
const { data: workflows } = useWorkflows();

// Get single workflow
const { data: workflow } = useWorkflow(workflowId);

// CRUD operations
const createMutation = useCreateWorkflow();
const updateMutation = useUpdateWorkflow();
const deleteMutation = useDeleteWorkflow();
const duplicateMutation = useDuplicateWorkflow();

// Execute workflow
const executeMutation = useExecuteWorkflow();
executeMutation.mutate({ workflowId, workflow, triggerData });

// Get execution history
const { data: runs } = useWorkflowRuns(workflowId);
```

---

## 🗄️ Database Entities

### AgentTemplate
```javascript
{
  id: "tpl_xxx",
  name: "Market Researcher",
  description: "...",
  domain: "Marketing",
  persona: { firstName, lastName, title, initials },
  useCase: ["Research", "B2B"],
  defaultConfig: { tools, tone, audience },
  is_active: true,
  usage_count: 0,
  activation_count: 0
}
```

### Workflow
```javascript
{
  id: "wf_xxx",
  name: "Content Pipeline",
  description: "...",
  status: "draft" | "active" | "paused",
  nodes: [...],
  connections: [...],
  trigger_type: "manual" | "webhook" | "schedule",
  runs_count: 0,
  success_count: 0,
  last_run_at: "2025-01-01T00:00:00Z"
}
```

### WorkflowRun
```javascript
{
  id: "run_xxx",
  workflow_id: "wf_xxx",
  status: "pending" | "running" | "completed" | "failed",
  started_at: "2025-01-01T00:00:00Z",
  completed_at: "2025-01-01T00:01:00Z",
  execution_time: 60000, // ms
  result: {...},
  error: {...}
}
```

---

## 🔌 API Patterns

### Base44 Entity Pattern
```javascript
// Primary: Entity-based (preferred)
const result = await base44.entities.Workflow.list('-updated_date');

// Fallback: Function-based
const result = await base44.functions.invoke('getWorkflows', {});
```

### Error Handling
```javascript
try {
  const result = await base44.entities.Workflow.create(data);
  toast.success('Workflow created');
  return result;
} catch (err) {
  console.warn('Entity method failed, trying function...');
  const fallback = await base44.functions.invoke('createWorkflow', { workflow: data });
  return fallback?.data;
}
```

---

## ⚡ Common Operations

### Create Workflow from Template
```javascript
const { data: templates } = useWorkflowTemplates();
const createMutation = useCreateWorkflow();

const handleUseTemplate = (template) => {
  createMutation.mutate({
    name: template.name,
    description: template.description,
    nodes: template.nodes,
    connections: template.connections,
    status: 'draft'
  });
};
```

### Execute Workflow
```javascript
const executeMutation = useExecuteWorkflow();

const handleRun = (workflow) => {
  executeMutation.mutate({
    workflowId: workflow.id,
    workflow,
    triggerData: { type: 'manual', user_id: currentUser.id }
  });
};
```

### Duplicate Workflow
```javascript
const duplicateMutation = useDuplicateWorkflow();

const handleDuplicate = (workflow) => {
  duplicateMutation.mutate(workflow);
};
```

---

## 🎨 UI Patterns

### Loading State
```javascript
if (isLoading) {
  return (
    <div className="grid gap-6">
      {[1,2,3].map(i => <Skeleton key={i} className="h-64" />)}
    </div>
  );
}
```

### Error State
```javascript
if (isError) {
  return (
    <div className="text-center p-12">
      <AlertCircle className="w-16 h-16 mx-auto mb-4" />
      <h3>Failed to load</h3>
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );
}
```

### Empty State
```javascript
if (data.length === 0) {
  return (
    <div className="text-center p-12">
      <GitBranch className="w-16 h-16 mx-auto mb-4" />
      <h3>No workflows yet</h3>
      <Button onClick={handleCreate}>Create Workflow</Button>
    </div>
  );
}
```

---

## 🧪 Testing Snippets

### Test Hook
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWorkflows } from '@/hooks/useWorkflows';

test('fetches workflows', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  const { result } = renderHook(() => useWorkflows(), { wrapper });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(3);
});
```

### Test Component
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Workflows from '@/pages/Workflows';

test('creates workflow', async () => {
  render(<Workflows />);

  fireEvent.click(screen.getByText('Create Workflow'));

  await waitFor(() => {
    expect(screen.getByText('New Workflow')).toBeInTheDocument();
  });
});
```

---

## 🐛 Debugging

### Check Query Cache
```javascript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log('Cached workflows:', queryClient.getQueryData(['workflows']));
```

### Monitor Mutations
```javascript
const mutation = useCreateWorkflow();
console.log('Mutation status:', mutation.status);
console.log('Mutation error:', mutation.error);
```

### Network Debugging
```javascript
// In browser DevTools
localStorage.setItem('debug', 'base44:*');
// Reload page to see Base44 SDK logs
```

---

## 📊 Performance Tips

### Optimize Re-renders
```javascript
// Use React.memo for expensive components
export default React.memo(WorkflowCard);

// Use useMemo for expensive computations
const filteredWorkflows = React.useMemo(() => {
  return workflows.filter(w => w.status === filter);
}, [workflows, filter]);
```

### Prefetch Data
```javascript
const queryClient = useQueryClient();

// Prefetch on hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => base44.entities.Workflow.get(workflowId)
  });
};
```

---

## 🔒 Security

### Authentication
```javascript
// Hooks automatically include auth from Base44 context
// No need to manually pass tokens
```

### Authorization
```javascript
// Check user permissions before mutations
if (!user.can('workflow:create')) {
  return <div>You don't have permission</div>;
}
```

---

## 📝 Common Issues

### "Entity not found" error
**Fix:** Implement fallback function or create entity in Base44 admin

### Stale data showing
**Fix:** Reduce staleTime or call `invalidateQueries`
```javascript
queryClient.invalidateQueries({ queryKey: ['workflows'] });
```

### Slow initial load
**Fix:** Add loading skeleton and check network tab for slow endpoints

### Cache not updating after mutation
**Fix:** Ensure `onSuccess` calls `invalidateQueries`

---

## 🚀 Deployment Commands

```bash
# Build
npm run build

# Preview production build
npm run preview

# Deploy
npm run deploy

# Seed database
node scripts/seed-templates.js
```

---

## 📚 Resources

- **TanStack Query:** https://tanstack.com/query
- **Base44 SDK:** [Your internal docs]
- **Radix UI:** https://radix-ui.com
- **DATABASE_SCHEMA.md:** Complete schema reference
- **BACKEND_SETUP_GUIDE.md:** Backend implementation guide

---

## 💡 Tips

1. Always use hooks for data fetching, never call API directly in components
2. Let TanStack Query handle caching, don't implement your own
3. Use optimistic updates for better UX
4. Add loading skeletons for perceived performance
5. Implement proper error boundaries
6. Log errors to monitoring service (Sentry, etc.)

---

**Quick Reference Card**
**Version:** 1.0
**Last Updated:** 2025-11-25
