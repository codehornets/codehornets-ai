# FunnelAgents API Client

Production-ready API client with dual backend support for NestJS microservices and Base44 BaaS.

## Architecture

```
Application Code
       │
       ▼
client.js (auto-detects backend)
       │
       ├─► nestjsClient.js (native fetch, JWT auth)
       │
       └─► Base44 SDK (@base44/sdk)
```

## Files

- `client.js` - Main client export, auto-detects backend mode
- `nestjsClient.js` - NestJS REST API client with JWT auth
- `auth.js` - Authentication API (login, signup, password reset)
- `settings.js` - Settings API (requires Base44 backend currently)

## Environment Setup

Create `.env.local`:

```bash
# Backend mode: 'nestjs' (default) or 'base44'
VITE_BACKEND_MODE=nestjs

# NestJS API URL
VITE_API_URL=http://localhost:3000

# Optional: enable debug logging
VITE_ENABLE_DEBUG_LOGGING=true
```

## Quick Start

### Authentication

```javascript
import client from '@/api/client';

// Login
const { user, accessToken } = await client.auth.login(email, password);

// Get current user
const user = await client.auth.me();

// Logout
await client.auth.logout();

// Check if authenticated
const isAuth = client.auth.isAuthenticated();
```

### Entity Operations (NestJS mode)

```javascript
import client from '@/api/client';

// List entities
const leads = await client.get('/api/leads');
const leads = await client.get('/api/leads', { page: 1, limit: 10 });

// Get single entity
const lead = await client.get('/api/leads/123');

// Create entity
const newLead = await client.post('/api/leads', {
  name: 'John Doe',
  email: 'john@example.com',
  status: 'new'
});

// Update entity
const updated = await client.patch('/api/leads/123', {
  status: 'contacted'
});

// Delete entity
await client.delete('/api/leads/123');
```

### Entity Services (unified interface)

```javascript
import client from '@/api/client';

// Using entity services (works with both backends)
const agents = await client.entities.Agent.list();
const agent = await client.entities.Agent.get('123');
const newAgent = await client.entities.Agent.create({ name: 'My Agent' });
await client.entities.Agent.update('123', { status: 'active' });
await client.entities.Agent.delete('123');
```

## Available Entities

All entities support: `list()`, `get()`, `create()`, `update()`, `delete()`

### CRM
- `entities.Lead` - Lead management
- `entities.Contact` - Contact management
- `entities.Company` - Company/account management
- `entities.Deal` - Deal/opportunity management

### Automation
- `entities.Agent` - AI agent management
- `entities.Workflow` - Workflow automation
- `entities.Task` - Task management

### Marketing
- `entities.Campaign` - Campaign management
- `entities.Content` - Content management
- `entities.Template` - Template management

### Analytics
- `entities.Report` - Report management

## Authentication Flow

### Token Storage

Tokens are stored in localStorage:
- `nestjs_access_token` - JWT access token
- `nestjs_refresh_token` - JWT refresh token
- `nestjs_token_expiry` - Token expiry timestamp
- `nestjs_user_data` - User profile data

### Automatic Token Refresh

The client automatically:
1. Checks token expiry before each request (5-minute buffer)
2. Refreshes token if expired or about to expire
3. Retries failed 401 requests after refresh
4. Prevents simultaneous refresh attempts

## Error Handling

```javascript
try {
  const lead = await client.get('/api/leads/invalid-id');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Status:', error.status); // HTTP status code
  console.error('Data:', error.data); // Error response data
}
```

### Common Errors

- `401 Unauthorized` - Token expired or invalid, will auto-refresh
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Server Error` - Backend error

## Backend Switching

```javascript
import { isNestJS, isBase44, backendMode, healthCheck } from '@/api/client';

// Check current backend
console.log('Backend mode:', backendMode); // 'nestjs' or 'base44'

if (isNestJS()) {
  console.log('Using NestJS microservices');
}

// Health check
const health = await healthCheck();
console.log('Status:', health.status); // 'healthy' or 'unhealthy'
```

## Debugging

### Enable Logging

In `.env.local`:
```bash
VITE_ENABLE_DEBUG_LOGGING=true
```

### Console Output

All requests are logged in development:
```
[NestJS Client REQUEST] GET /api/leads
[NestJS Client RESPONSE] 200 OK (250ms)
```

### Browser DevTools

Access client in console:
```javascript
window.__apiClient      // Client instance
window.__backendMode    // Current backend mode
```

## Migration from Base44

### Step 1: Environment Setup
```bash
# Set backend mode in .env.local
VITE_BACKEND_MODE=nestjs
VITE_API_URL=http://localhost:3000
```

### Step 2: Update Imports
```javascript
// Before (Base44)
import { base44 } from '@/api/base44Client';
const leads = await base44.entities.Query.leads.find();

// After (Unified client)
import client from '@/api/client';
const leads = await client.get('/api/leads');
// OR
const leads = await client.entities.Lead.list();
```

### Step 3: Test Both Backends
```bash
# Test with NestJS
VITE_BACKEND_MODE=nestjs npm run dev

# Test with Base44
VITE_BACKEND_MODE=base44 npm run dev
```

## Performance Tips

### Use Bulk Operations
```javascript
// Bad - multiple requests
for (const id of ids) {
  await client.delete(`/api/leads/${id}`);
}

// Good - single bulk request
await client.post('/api/leads/bulk-delete', { ids });
```

### Client-Side Caching with React Query
```javascript
import { useQuery } from '@tanstack/react-query';
import client from '@/api/client';

const { data, isLoading } = useQuery({
  queryKey: ['leads', { page: 1 }],
  queryFn: () => client.get('/api/leads', { page: 1 }),
  staleTime: 5 * 60 * 1000 // 5 minutes
});
```

## Security Notes

- Tokens stored in localStorage (consider httpOnly cookies for production)
- Automatic token refresh minimizes exposure window
- Always use HTTPS in production
- Clear tokens on logout
- Backend should implement rate limiting

## Troubleshooting

### 401 Unauthorized
- Check token expiry
- Verify backend auth endpoint is working
- Clear tokens: `localStorage.clear()` and re-login

### CORS Error
- Verify backend CORS configuration allows your origin
- Check `VITE_API_URL` is correct
- Ensure credentials are included in requests

### Network Error
- Verify backend is running
- Test with `await healthCheck()`
- Check API URL in environment variables

### Token Not Refreshing
- Check refresh token exists in localStorage
- Verify `/auth/refresh` endpoint works
- Look for errors in browser console

## Testing

### Mock Fetch for Unit Tests
```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
    headers: new Headers({ 'content-type': 'application/json' })
  })
);

await client.get('/api/leads');
expect(fetch).toHaveBeenCalledWith(
  'http://localhost:3000/api/leads',
  expect.objectContaining({ method: 'GET' })
);
```

## API Endpoints (NestJS)

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### CRM
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/:id` - Get agent
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/execute` - Execute agent

### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow
- `PATCH /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

---

**Version:** 2.0.0
**Last Updated:** 2025-11-25
**Backend Support:** NestJS (primary), Base44 (legacy)
