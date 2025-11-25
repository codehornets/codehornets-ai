# API Client Quick Reference

## Import

```javascript
import apiClient from '@/api/client';
// or
import { auth, entities, integrations } from '@/api/client';
```

## Authentication

```javascript
// Login
await apiClient.auth.login('user@example.com', 'password');

// Register
await apiClient.auth.register({ email, password, name });

// Get current user
const user = await apiClient.auth.getCurrentUser();

// Logout
await apiClient.auth.logout();

// Check auth status
const isAuth = apiClient.auth.isAuthenticated();
```

## CRUD Operations

```javascript
// List with pagination
const result = await apiClient.entities.leads.list({
  page: 1,
  limit: 20,
  sort: '-createdAt'
});

// Get by ID
const lead = await apiClient.entities.leads.get('123');

// Create
const newLead = await apiClient.entities.leads.create({
  name: 'John Doe',
  email: 'john@example.com'
});

// Update
await apiClient.entities.leads.update('123', {
  status: 'contacted'
});

// Delete
await apiClient.entities.leads.delete('123');
```

## Advanced Queries

```javascript
const results = await apiClient.entities.leads.query({
  where: {
    status: { $in: ['new', 'contacted'] },
    score: { $gte: 70 }
  },
  populate: ['company', 'assignedTo'],
  fields: ['name', 'email', 'score'],
  sort: '-score',
  page: 1,
  limit: 50
});
```

## Bulk Operations

```javascript
// Bulk create
await apiClient.entities.leads.bulkCreate([...items]);

// Bulk update
await apiClient.entities.leads.bulkUpdate([...updates]);

// Bulk delete
await apiClient.entities.leads.bulkDelete(['id1', 'id2', 'id3']);
```

## Integrations

```javascript
// LLM
const response = await apiClient.integrations.Core.InvokeLLM({
  model: 'gpt-4',
  prompt: 'Generate email'
});

// Email
await apiClient.integrations.Core.SendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Message'
});

// SMS
await apiClient.integrations.Core.SendSMS({
  to: '+1234567890',
  message: 'Hello'
});

// File upload
const result = await apiClient.integrations.Core.UploadFile(file, {
  folder: 'documents'
});
```

## Available Entities

| Entity | Path | Description |
|--------|------|-------------|
| `leads` | `/crm/leads` | Lead management |
| `contacts` | `/crm/contacts` | Contact management |
| `companies` | `/crm/companies` | Company management |
| `deals` | `/crm/deals` | Deal management |
| `tasks` | `/tasks` | Task management |
| `campaigns` | `/campaigns` | Campaign management |
| `sequences` | `/campaigns/sequences` | Email/SMS sequences |
| `content` | `/content` | Content management |
| `templates` | `/content/templates` | Template management |
| `agents` | `/agents` | AI agent management |
| `workflows` | `/automations/workflows` | Workflow automation |
| `automations` | `/automations` | Automation rules |
| `reports` | `/reports` | Report management |

## Backend Switching

```javascript
import { isNestJS, isBase44, healthCheck } from '@/api/client';

// Check backend
console.log(isNestJS()); // true if using NestJS
console.log(isBase44()); // true if using Base44

// Health check
const health = await healthCheck();
console.log(health.status); // 'healthy' or 'unhealthy'
```

## Environment Variables

```bash
# .env.local
VITE_BACKEND_MODE=nestjs              # 'nestjs' or 'base44'
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Error Handling

```javascript
try {
  await apiClient.entities.leads.create(data);
} catch (error) {
  console.error(error.message);  // Error message
  console.error(error.status);   // HTTP status code
  console.error(error.data);     // Error response data
}
```

## Migration from Base44

```javascript
// Before (Base44)
import { base44 } from '@/api/base44Client';
const leads = await base44.entities.Query.leads.find();

// After (Unified)
import apiClient from '@/api/client';
const leads = await apiClient.entities.leads.list();
```

## React Query Integration

```javascript
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['leads', { page: 1 }],
  queryFn: () => apiClient.entities.leads.list({ page: 1 })
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => apiClient.entities.leads.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['leads']);
  }
});
```

## Debug Mode

```javascript
// Development only - access via console
window.__apiClient          // API client instance
window.__backendMode        // Current backend mode
window.__apiMigration       // Migration utilities

// Get migration steps
window.__apiMigration.getMigrationSteps()
```

## Common Patterns

### Authenticated Requests
```javascript
// Tokens are automatically attached to all requests
// after login - no manual handling needed
await apiClient.auth.login(email, password);
const data = await apiClient.entities.leads.list();
```

### Pagination
```javascript
const [page, setPage] = useState(1);
const limit = 20;

const { data } = useQuery({
  queryKey: ['leads', page],
  queryFn: () => apiClient.entities.leads.list({ page, limit })
});

// data.meta contains: { total, page, limit, totalPages }
```

### Filtering
```javascript
const filters = {
  where: {
    status: 'new',
    createdAt: { $gte: startDate, $lte: endDate }
  },
  sort: '-createdAt'
};

const results = await apiClient.entities.leads.query(filters);
```

### Population (Relations)
```javascript
const lead = await apiClient.entities.leads.get('123', {
  populate: ['company', 'assignedTo', 'activities']
});

// lead.company and lead.assignedTo are now full objects
```

## Service URLs

| Service | Default Port | Environment Variable |
|---------|-------------|---------------------|
| API Gateway | 3000 | `VITE_API_URL` |
| Auth Service | 3001 | `VITE_AUTH_SERVICE_URL` |
| CRM Service | 3002 | `VITE_CRM_SERVICE_URL` |
| Campaigns Service | 3003 | `VITE_CAMPAIGNS_SERVICE_URL` |
| Content Service | 3004 | `VITE_CONTENT_SERVICE_URL` |
| Agents Service | 3005 | `VITE_AGENTS_SERVICE_URL` |
| Tasks Service | 3006 | `VITE_TASKS_SERVICE_URL` |
| Automations Service | 3007 | `VITE_AUTOMATIONS_SERVICE_URL` |
| Reports Service | 3008 | `VITE_REPORTS_SERVICE_URL` |

---

**For detailed documentation, see [README.md](./README.md)**
