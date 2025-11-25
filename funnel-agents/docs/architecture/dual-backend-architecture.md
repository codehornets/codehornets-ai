# Dual-Backend Architecture

FunnelAgents supports two backend modes: **Base44** (external platform) and **NestJS** (local microservices). This document explains the architecture, how to switch between backends, and the implementation details.

## Overview

```
                    +-----------------+
                    |    Web UI       |
                    |  (React/Vite)   |
                    +-----------------+
                           |
                           v
                    +-----------------+
                    |  client.js      |
                    |  (Toggle Switch)|
                    +-----------------+
                          / \
                         /   \
                        /     \
                       v       v
         +----------------+  +------------------+
         | base44Client   |  |  nestjsClient    |
         | (Base44 SDK)   |  |  (HTTP/REST)     |
         +----------------+  +------------------+
                |                    |
                v                    v
         +----------------+  +------------------+
         | Base44 Platform|  | NestJS Backend   |
         | (External SaaS)|  | (Local Services) |
         +----------------+  +------------------+
```

## Backend Modes

### Base44 Mode (Default)

- Uses the `@base44/sdk` client library
- Connects to Base44's hosted platform
- Suitable for development without local infrastructure
- Requires `VITE_BASE44_APP_ID` and `VITE_BASE44_BACKEND_URL`

### NestJS Mode

- Uses custom `nestjsClient.js` that mimics the Base44 SDK interface
- Connects to local NestJS microservices via API Gateway
- Full control over the backend
- Requires local PostgreSQL, Redis, and microservices

## Switching Backends

### Configuration

Edit `apps/web-ui/.env`:

```env
# Set to 'nestjs' for local backend, 'base44' for external
VITE_BACKEND_MODE=nestjs

# Base44 Settings (when using base44 mode)
VITE_BASE44_APP_ID=your-app-id
VITE_BASE44_BACKEND_URL=https://api.base44.com

# NestJS Settings (when using nestjs mode)
VITE_NESTJS_API_URL=http://localhost:3000
VITE_NESTJS_WS_URL=ws://localhost:3000
```

### Runtime Detection

The client automatically detects which backend to use:

```javascript
// apps/web-ui/src/api/client.js
const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'base44';
export const client = BACKEND_MODE === 'nestjs' ? nestjsClient : base44;
```

## Client API Surface

Both clients expose an identical API surface, allowing seamless switching:

### Authentication

```javascript
// Login
const result = await client.auth.login({ email, password });
// Returns: { access_token, refresh_token, user }

// Register
const result = await client.auth.register({ email, password, name });

// Get current user
const user = await client.auth.me();

// Update profile
await client.auth.updateMe({ name, company_name, ... });

// Logout
client.auth.logout('/login');

// Check if authenticated
const isAuth = await client.auth.isAuthenticated();
```

### Entities

```javascript
// List entities
const agents = await client.entities.Agent.list();

// Get by ID
const agent = await client.entities.Agent.get(id);

// Create
const newAgent = await client.entities.Agent.create({ name, type, ... });

// Update
await client.entities.Agent.update(id, { name, ... });

// Delete
await client.entities.Agent.delete(id);

// Filter
const results = await client.entities.Agent.filter({ status: 'active' });
```

### Available Entities

| Entity               | NestJS Endpoint           | Description                |
|----------------------|---------------------------|----------------------------|
| Agent                | /api/agents               | AI agents                  |
| AgentFeedback        | /api/agents/feedback      | Agent performance feedback |
| AgentTemplate        | /api/agents/templates     | Agent templates            |
| Task                 | /api/tasks                | Task queue items           |
| Lead                 | /api/leads                | CRM leads                  |
| Contact              | /api/contacts             | CRM contacts               |
| Deal                 | /api/deals                | Sales deals                |
| Campaign             | /api/campaigns            | Marketing campaigns        |
| Content              | /api/content              | Content library            |
| Workflow             | /api/workflows            | Automation workflows       |
| WorkflowRun          | /api/workflow-runs        | Workflow execution logs    |
| Workspace            | /api/workspaces           | Client workspaces          |

### Integrations

```javascript
// Invoke LLM
await client.integrations.Core.InvokeLLM({ prompt, model, ... });

// Send Email
await client.integrations.Core.SendEmail({ to, subject, body, ... });

// Upload File
await client.integrations.Core.UploadFile(file, { folder, ... });
```

## Token Management

### Base44 Mode

Tokens are managed by the Base44 SDK internally.

### NestJS Mode

Tokens are stored in localStorage:

```javascript
// On login/register success
localStorage.setItem('nestjs_access_token', result.access_token);
localStorage.setItem('nestjs_refresh_token', result.refresh_token);

// On logout
localStorage.removeItem('nestjs_access_token');
localStorage.removeItem('nestjs_refresh_token');
localStorage.removeItem('nestjs_user');
```

Tokens are automatically included in API requests:

```javascript
const token = localStorage.getItem('nestjs_access_token');
const config = {
  headers: {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  },
};
```

## NestJS Backend Architecture

When using NestJS mode, requests flow through:

```
Web UI
   |
   v
API Gateway (port 3000)
   |
   +--> /api/auth/*     --> Auth Service (port 3001)
   +--> /api/leads/*    --> CRM Service (port 3002)
   +--> /api/campaigns/*--> Campaigns Service (port 3003)
   +--> /api/content/*  --> Content Service (port 3004)
   +--> /api/agents/*   --> Agents Service (port 3005)
   +--> /api/tasks/*    --> Tasks Service (port 3006)
   +--> /api/workflows/*--> Automations Service (port 3007)
   +--> /api/reports/*  --> Reports Service (port 3008)
```

### Service Communication

Services communicate via TCP transport using NestJS microservices:

```typescript
// API Gateway sends request to service
@Inject('AUTH_SERVICE') private authClient: ClientProxy;

this.authClient.send({ cmd: 'auth.login' }, loginDto);
```

## Helper Functions

```javascript
import { client, isNestJSBackend, isBase44Backend, getBackendMode } from '@/api/client';

// Check current mode
if (isNestJSBackend()) {
  console.log('Using local NestJS backend');
}

// Get mode string
const mode = getBackendMode(); // 'nestjs' or 'base44'
```

## Error Handling

Both clients return errors in a consistent format:

```javascript
try {
  await client.auth.login(credentials);
} catch (error) {
  // error.status: HTTP status code
  // error.message: Error message
  // error.data: Full error response
}
```

## Development Workflow

### Using NestJS Backend

1. Start infrastructure:
   ```bash
   docker compose up -d postgres redis
   ```

2. Start microservices:
   ```bash
   npx nx run-many -t serve -p api-gateway,auth-service,crm-service,...
   ```

3. Configure web-ui:
   ```bash
   # apps/web-ui/.env
   VITE_BACKEND_MODE=nestjs
   ```

4. Start web-ui:
   ```bash
   npx nx serve web-ui
   ```

### Using Base44 Backend

1. Configure web-ui:
   ```bash
   # apps/web-ui/.env
   VITE_BACKEND_MODE=base44
   VITE_BASE44_APP_ID=your-app-id
   VITE_BASE44_BACKEND_URL=https://api.base44.com
   ```

2. Start web-ui:
   ```bash
   npx nx serve web-ui
   ```

## Extending the Client

To add new entity types to `nestjsClient.js`:

```javascript
// Add to entities object
NewEntity: {
  ...createEntityClient('NewEntity', '/api/new-entities'),
  // Add custom methods
  customAction: (id, data) => apiRequest(`/api/new-entities/${id}/action`, { method: 'POST', body: data }),
},
```

Ensure the corresponding NestJS service and proxy controller exist.

## Security Considerations

1. **Token Storage**: NestJS mode stores tokens in localStorage. For production, consider:
   - HttpOnly cookies
   - Secure token refresh mechanism
   - Token rotation

2. **HTTPS**: Always use HTTPS in production for both backends

3. **CORS**: API Gateway is configured with CORS for allowed origins

4. **Environment Variables**: Never commit `.env` files with secrets
