# API Gateway Route Map

Base URL: `http://localhost:3000/api`

## Public Routes (No Authentication Required)

### Authentication Service
```
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email
```

### Health Checks
```
GET    /api/health           - Gateway health status
GET    /api/health/services  - All microservices health status
```

---

## Protected Routes (Authentication Required)

All routes below require `Authorization: Bearer <token>` header.

### CRM Service (port 3002)

#### Workspaces
```
GET    /api/workspaces           - List all workspaces
POST   /api/workspaces           - Create workspace
GET    /api/workspaces/:id       - Get workspace details
PUT    /api/workspaces/:id       - Update workspace
DELETE /api/workspaces/:id       - Delete workspace
```

#### Leads
```
GET    /api/leads                - List all leads
POST   /api/leads                - Create lead
GET    /api/leads/:id            - Get lead details
PUT    /api/leads/:id            - Update lead
DELETE /api/leads/:id            - Delete lead
PATCH  /api/leads/:id/status     - Update lead status
GET    /api/leads/:id/activities - Get lead activities
```

#### Contacts
```
GET    /api/contacts             - List all contacts
POST   /api/contacts             - Create contact
GET    /api/contacts/:id         - Get contact details
PUT    /api/contacts/:id         - Update contact
DELETE /api/contacts/:id         - Delete contact
```

#### Deals
```
GET    /api/deals                - List all deals
POST   /api/deals                - Create deal
GET    /api/deals/:id            - Get deal details
PUT    /api/deals/:id            - Update deal
DELETE /api/deals/:id            - Delete deal
PATCH  /api/deals/:id/stage      - Update deal stage
```

#### Lead Activities
```
GET    /api/lead-activities      - List activities
POST   /api/lead-activities      - Create activity
GET    /api/lead-activities/:id  - Get activity details
PUT    /api/lead-activities/:id  - Update activity
DELETE /api/lead-activities/:id  - Delete activity
```

#### Client Feedback
```
GET    /api/client-feedback      - List feedback
POST   /api/client-feedback      - Create feedback
GET    /api/client-feedback/:id  - Get feedback details
PUT    /api/client-feedback/:id  - Update feedback
DELETE /api/client-feedback/:id  - Delete feedback
```

### Campaigns Service (port 3003)

#### Campaigns
```
GET    /api/campaigns            - List all campaigns
POST   /api/campaigns            - Create campaign
GET    /api/campaigns/:id        - Get campaign details
PUT    /api/campaigns/:id        - Update campaign
DELETE /api/campaigns/:id        - Delete campaign
POST   /api/campaigns/:id/start  - Start campaign
POST   /api/campaigns/:id/pause  - Pause campaign
POST   /api/campaigns/:id/stop   - Stop campaign
GET    /api/campaigns/:id/stats  - Get campaign statistics
```

#### Campaign Templates
```
GET    /api/campaign-templates       - List templates
POST   /api/campaign-templates       - Create template
GET    /api/campaign-templates/:id   - Get template details
PUT    /api/campaign-templates/:id   - Update template
DELETE /api/campaign-templates/:id   - Delete template
POST   /api/campaign-templates/:id/clone - Clone template
```

### Content Service (port 3004)

#### Content
```
GET    /api/content              - List content items
POST   /api/content              - Create content
GET    /api/content/:id          - Get content details
PUT    /api/content/:id          - Update content
DELETE /api/content/:id          - Delete content
POST   /api/content/:id/publish  - Publish content
GET    /api/content/:id/versions - Get content versions
```

#### Files
```
GET    /api/files                - List files
POST   /api/files/upload         - Upload file
GET    /api/files/:id            - Get file details
DELETE /api/files/:id            - Delete file
GET    /api/files/:id/download   - Download file
```

### Agents Service (port 3005)

#### Agents
```
GET    /api/agents               - List AI agents
POST   /api/agents               - Create agent
GET    /api/agents/:id           - Get agent details
PUT    /api/agents/:id           - Update agent
DELETE /api/agents/:id           - Delete agent
POST   /api/agents/:id/train     - Train agent
POST   /api/agents/:id/execute   - Execute agent task
GET    /api/agents/:id/logs      - Get agent logs
```

#### AI Integrations
```
GET    /api/ai/models            - List available AI models
POST   /api/ai/chat              - Chat with AI
POST   /api/ai/complete          - Text completion
POST   /api/ai/analyze           - Analyze text/data
POST   /api/ai/generate          - Generate content
```

#### External Integrations
```
GET    /api/integrations                 - List integrations
POST   /api/integrations/email/send      - Send email
POST   /api/integrations/sms/send        - Send SMS
GET    /api/integrations/email/templates - Email templates
GET    /api/integrations/sms/templates   - SMS templates
POST   /api/integrations/webhook         - Configure webhook
```

### Tasks Service (port 3006)

#### Tasks
```
GET    /api/tasks                - List all tasks
POST   /api/tasks                - Create task
GET    /api/tasks/:id            - Get task details
PUT    /api/tasks/:id            - Update task
DELETE /api/tasks/:id            - Delete task
PATCH  /api/tasks/:id/status     - Update task status
PATCH  /api/tasks/:id/assign     - Assign task
GET    /api/tasks/assigned/me    - Get my assigned tasks
```

### Automations Service (port 3007)

#### Workflows
```
GET    /api/workflows            - List workflows
POST   /api/workflows            - Create workflow
GET    /api/workflows/:id        - Get workflow details
PUT    /api/workflows/:id        - Update workflow
DELETE /api/workflows/:id        - Delete workflow
POST   /api/workflows/:id/activate   - Activate workflow
POST   /api/workflows/:id/deactivate - Deactivate workflow
POST   /api/workflows/:id/execute    - Manually execute workflow
```

#### Workflow Runs
```
GET    /api/workflow-runs            - List workflow runs
GET    /api/workflow-runs/:id        - Get run details
GET    /api/workflow-runs/:id/logs   - Get run logs
POST   /api/workflow-runs/:id/retry  - Retry failed run
POST   /api/workflow-runs/:id/cancel - Cancel running workflow
```

### Reports Service (port 3008)

#### Analytics
```
GET    /api/analytics/dashboard       - Dashboard metrics
GET    /api/analytics/leads           - Lead analytics
GET    /api/analytics/campaigns       - Campaign analytics
GET    /api/analytics/conversions     - Conversion analytics
GET    /api/analytics/revenue         - Revenue analytics
POST   /api/analytics/custom          - Custom report
GET    /api/analytics/export          - Export analytics data
```

---

## Message Patterns

The gateway uses the following pattern format for TCP communication with microservices:

```
<service>.<method>.<resource>.<subPath>
```

Examples:
- `crm.get.leads.root` - GET /api/leads
- `crm.post.leads.root` - POST /api/leads
- `crm.get.leads.123` - GET /api/leads/123
- `campaigns.patch.campaigns.123/status` - PATCH /api/campaigns/123/status

---

## Request Payload Structure

All requests to microservices include:

```typescript
{
  body: object,      // Request body
  query: object,     // Query parameters
  params: object,    // Route parameters
  headers: object,   // Request headers
  user: object       // Authenticated user (if available)
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "No token provided"
}
```

### 500 Service Unavailable
```json
{
  "statusCode": 500,
  "message": "CRM service unavailable",
  "error": "Connection timeout"
}
```

---

## Testing Routes

### cURL Examples

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get leads (with auth)
curl http://localhost:3000/api/leads \
  -H "Authorization: Bearer <token>"

# Create campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Campaign","type":"email"}'
```

### HTTPie Examples

```bash
# Health check
http GET localhost:3000/api/health

# Login
http POST localhost:3000/api/auth/login email=user@example.com password=password123

# Get leads (with auth)
http GET localhost:3000/api/leads Authorization:"Bearer <token>"
```

---

## Rate Limiting

Rate limiting is handled by individual microservices. Check each service's documentation for limits.

## API Versioning

Current version: `v1` (implicitly, can be added to routes if needed)

Future versions can be added by:
1. Creating new controllers with version prefix
2. Updating route decorators: `@Controller('v2/leads')`
3. Maintaining backward compatibility

---

## WebSocket Support (Future)

For real-time features, WebSocket gateway can be added:
```
ws://localhost:3000/api/ws
```

Topics to consider:
- Lead updates
- Campaign status changes
- Agent activity
- Workflow execution status
