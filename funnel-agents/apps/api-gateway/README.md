# API Gateway

The API Gateway is the main entry point for all FunnelAgents platform requests. It routes requests to the appropriate microservices using NestJS microservices pattern with TCP transport.

## Features

- Route proxying to all microservices
- Authentication guard for protected routes
- Request/response logging
- CORS configuration for web clients
- Health check endpoints
- Service availability monitoring

## Routes Configuration

All routes are prefixed with `/api`:

### Authentication Service (port 3001)
- `POST /api/auth/*` - All authentication endpoints

### CRM Service (port 3002)
- `/api/workspaces/*` - Workspace management
- `/api/leads/*` - Lead management
- `/api/contacts/*` - Contact management
- `/api/deals/*` - Deal management
- `/api/lead-activities/*` - Lead activity tracking
- `/api/client-feedback/*` - Client feedback management

### Campaigns Service (port 3003)
- `/api/campaigns/*` - Campaign management
- `/api/campaign-templates/*` - Campaign template management

### Content Service (port 3004)
- `/api/content/*` - Content management
- `/api/files/*` - File storage and retrieval

### Agents Service (port 3005)
- `/api/agents/*` - AI agent management
- `/api/ai/*` - AI integration endpoints
- `/api/integrations/*` - Email, SMS, and other integrations

### Tasks Service (port 3006)
- `/api/tasks/*` - Task management

### Automations Service (port 3007)
- `/api/workflows/*` - Workflow management
- `/api/workflow-runs/*` - Workflow execution tracking

### Reports Service (port 3008)
- `/api/analytics/*` - Analytics and reporting

## Health Check Endpoints

- `GET /api/health` - Gateway health status
- `GET /api/health/services` - All microservices health status

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Gateway Configuration
API_GATEWAY_PORT=3000

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:4200

# Microservice Hosts (default: localhost)
AUTH_SERVICE_HOST=localhost
CRM_SERVICE_HOST=localhost
CAMPAIGNS_SERVICE_HOST=localhost
CONTENT_SERVICE_HOST=localhost
AGENTS_SERVICE_HOST=localhost
TASKS_SERVICE_HOST=localhost
AUTOMATIONS_SERVICE_HOST=localhost
REPORTS_SERVICE_HOST=localhost

# Microservice Ports
AUTH_SERVICE_PORT=3001
CRM_SERVICE_PORT=3002
CAMPAIGNS_SERVICE_PORT=3003
CONTENT_SERVICE_PORT=3004
AGENTS_SERVICE_PORT=3005
TASKS_SERVICE_PORT=3006
AUTOMATIONS_SERVICE_PORT=3007
REPORTS_SERVICE_PORT=3008
```

## Running the Gateway

```bash
# Development
npm run dev:api-gateway

# Production
npm run start:api-gateway

# With Docker
docker-compose up api-gateway
```

## Architecture

The gateway uses:

1. **NestJS Controllers** - Handle HTTP requests
2. **ClientProxy** - Communicate with microservices via TCP
3. **Guards** - Authentication and authorization
4. **Interceptors** - Logging and response transformation
5. **Filters** - Error handling

### Request Flow

```
Client Request
    ↓
API Gateway (port 3000)
    ↓
Authentication Guard (if required)
    ↓
Proxy Controller
    ↓
ClientProxy (TCP)
    ↓
Target Microservice
    ↓
Response
```

## Authentication

Most routes are protected by the `AuthGuard` which:

1. Extracts JWT token from `Authorization: Bearer <token>` header
2. Validates token with auth-service via TCP
3. Attaches user object to request
4. Passes through authentication headers to downstream services

Exception: `/api/auth/*` routes are public for login/signup.

## Error Handling

The gateway handles service unavailability gracefully:

- Returns 500 status with descriptive error message
- Logs errors for debugging
- Includes timeout handling (30s default)
- Service health checks available via `/api/health/services`

## Development

### Adding a New Service Route

1. Create a new proxy controller in `src/proxy/`
2. Inject the service's ClientProxy
3. Create route handlers with `@All()` decorator
4. Add controller to `ProxyModule`
5. Register service client in `AppModule`

### Example:

```typescript
import { All, Controller, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthGuard } from '../bootstrap/guards/auth.guard';

@Controller('new-service')
@UseGuards(AuthGuard)
export class NewServiceProxyController {
  constructor(
    @Inject('NEW_SERVICE') private readonly client: ClientProxy,
  ) {}

  @All('*')
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    // Proxy logic
  }
}
```

## Monitoring

The gateway provides monitoring capabilities:

- Request/response logging via `LoggingInterceptor`
- Service health checks
- Response time tracking
- Error rate monitoring

Check logs for:
```
[HTTP] GET /api/leads 200 - 45ms - ::1 - Mozilla/5.0...
```

## CORS Configuration

CORS is configured to allow:
- Origins: Configurable via `CORS_ORIGINS` environment variable
- Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With
- Credentials: Enabled

Default allowed origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:4200` (Angular dev server)
