# CRM Service

The CRM (Customer Relationship Management) Service is a core microservice of the FunnelAgents platform that handles all CRM-related functionality including Workspaces, Leads, Contacts, Deals, and Activities.

## Overview

- **Port**: 3002
- **Transport**: TCP (NestJS Microservices)
- **Database**: PostgreSQL (via TypeORM)
- **Framework**: NestJS

## Entities

### 1. Workspaces
Client accounts/organizations that use the platform.

**Fields**:
- `id`: UUID
- `name`: string
- `description`: string (optional)
- `color`: string (optional)
- `status`: enum ('active', 'inactive', 'archived')
- `team_members`: string array (optional)
- `settings`: JSON object (optional)
- `created_at`: timestamp
- `updated_at`: timestamp

**Message Patterns**:
- `workspace.findAll` - List all workspaces
- `workspace.findOne` - Get workspace by ID
- `workspace.create` - Create new workspace
- `workspace.update` - Update workspace
- `workspace.remove` - Delete workspace
- `workspace.onboard` - AI-powered workspace onboarding

### 2. Leads
Potential customers in the sales pipeline.

**Fields**:
- `id`: UUID
- `name`: string
- `email`: string
- `phone`: string (optional)
- `company`: string (optional)
- `status`: enum ('new', 'enriched', 'qualified', 'contacted', 'in_conversation', 'proposal_sent', 'won', 'lost')
- `score`: float (optional)
- `score_breakdown`: JSON object with icp_fit, engagement, recency, confidence scores
- `source`: string (optional)
- `notes`: text (optional)
- `created_at`: timestamp
- `updated_at`: timestamp

**Message Patterns**:
- `lead.findAll` - List all leads (with filtering, sorting, pagination)
- `lead.findOne` - Get lead by ID
- `lead.create` - Create new lead
- `lead.update` - Update lead
- `lead.remove` - Delete lead
- `lead.qualify` - AI-powered lead qualification
- `lead.convert` - Convert lead to client

**Filters**: status, source, minScore, maxScore, search, page, limit

### 3. Lead Activities
Activity tracking for leads (calls, emails, meetings, notes).

**Fields**:
- `id`: UUID
- `lead_id`: UUID (foreign key to leads)
- `type`: enum ('call', 'email', 'meeting', 'note', 'ai_action', 'status_change')
- `description`: text
- `metadata`: JSON object (optional)
- `created_at`: timestamp

**Message Patterns**:
- `leadActivity.findAll` - List all activities (with filtering)
- `leadActivity.findOne` - Get activity by ID
- `leadActivity.create` - Create new activity
- `leadActivity.findByLeadId` - Get all activities for a specific lead

**Filters**: lead_id, type, page, limit

### 4. Contacts
All contacts in the system (leads, clients, partners, etc.).

**Fields**:
- `id`: UUID
- `name`: string
- `email`: string
- `phone`: string (optional)
- `company`: string (optional)
- `type`: enum ('lead', 'client', 'partner', 'other')
- `workspace_id`: UUID (optional)
- `linkedin_url`: string (optional)
- `notes`: text (optional)
- `created_at`: timestamp
- `updated_at`: timestamp

**Message Patterns**:
- `contact.findAll` - List all contacts (with filtering)
- `contact.findOne` - Get contact by ID
- `contact.create` - Create new contact
- `contact.update` - Update contact
- `contact.remove` - Delete contact

**Filters**: type, workspace_id, search, page, limit

### 5. Deals
Sales opportunities and deal tracking.

**Fields**:
- `id`: UUID
- `name`: string
- `workspace_id`: UUID (optional)
- `contact_id`: UUID (optional)
- `value`: decimal
- `stage`: enum ('discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
- `expected_close_date`: timestamp (optional)
- `notes`: text (optional)
- `created_at`: timestamp
- `updated_at`: timestamp

**Message Patterns**:
- `deal.findAll` - List all deals (with filtering)
- `deal.findOne` - Get deal by ID
- `deal.create` - Create new deal
- `deal.update` - Update deal
- `deal.remove` - Delete deal
- `deal.updateStage` - Update deal stage

**Filters**: stage, workspace_id, contact_id, page, limit

### 6. Client Feedback
Client satisfaction and feedback tracking.

**Fields**:
- `id`: UUID
- `workspace_id`: UUID
- `contact_id`: UUID (optional)
- `subject`: string
- `feedback`: text
- `sentiment`: enum ('positive', 'neutral', 'negative') (optional)
- `rating`: integer 1-10 (optional)
- `status`: enum ('new', 'in_review', 'addressed', 'closed')
- `response`: text (optional)
- `metadata`: JSON object (optional)
- `created_at`: timestamp
- `updated_at`: timestamp

**Message Patterns**:
- `clientFeedback.findAll` - List all feedback (with filtering)
- `clientFeedback.findOne` - Get feedback by ID
- `clientFeedback.create` - Create new feedback
- `clientFeedback.update` - Update feedback
- `clientFeedback.remove` - Delete feedback

**Filters**: workspace_id, contact_id, sentiment, status, page, limit

## Architecture

```
apps/crm-service/
├── src/
│   ├── workspaces/
│   │   ├── workspace.entity.ts
│   │   ├── workspaces.service.ts
│   │   ├── workspaces.controller.ts
│   │   ├── workspaces.module.ts
│   │   └── dto/
│   │       ├── create-workspace.dto.ts
│   │       ├── update-workspace.dto.ts
│   │       └── onboard-workspace.dto.ts
│   ├── leads/
│   │   ├── lead.entity.ts
│   │   ├── leads.service.ts
│   │   ├── leads.controller.ts
│   │   ├── leads.module.ts
│   │   └── dto/
│   ├── lead-activities/
│   ├── contacts/
│   ├── deals/
│   ├── client-feedback/
│   ├── app.module.ts
│   └── main.ts
```

## Environment Variables

Required environment variables:

```env
# CRM Service
CRM_SERVICE_HOST=localhost
CRM_SERVICE_PORT=3002

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/funnel_agents

# Environment
NODE_ENV=development
```

## Running the Service

### Development
```bash
npm run serve crm-service
# or
npx nx serve crm-service
```

### Build
```bash
npm run build crm-service
# or
npx nx build crm-service
```

### Testing
```bash
npm run test crm-service
# or
npx nx test crm-service
```

## Database Setup

The service uses TypeORM with PostgreSQL. Database synchronization is enabled in development mode (auto-creates tables).

For production, you should:
1. Disable `synchronize` in TypeORM config
2. Use proper migrations
3. Run migrations before deployment

## Usage from API Gateway

The API Gateway communicates with this service using NestJS microservices TCP transport:

```typescript
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

// Create client
const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    host: 'localhost',
    port: 3002,
  },
});

// Example: Get all leads
const leads = await client.send({ cmd: 'lead.findAll' }, {
  status: 'qualified',
  page: 1,
  limit: 10
}).toPromise();

// Example: Create a workspace
const workspace = await client.send({ cmd: 'workspace.create' }, {
  name: 'Acme Corp',
  status: 'active'
}).toPromise();
```

## Features

### Filtering & Pagination
All list endpoints support filtering and pagination:
- Page-based pagination (default: page 1, limit 10)
- Search by multiple fields (where applicable)
- Filter by status, type, and other entity-specific fields
- Returns: `{ data: [], total: number, page: number, limit: number }`

### Validation
All DTOs use class-validator decorators for input validation:
- Email validation
- UUID validation
- Enum validation
- Required vs optional fields
- Number ranges (e.g., rating 1-10)

### Error Handling
- `NotFoundException` for missing entities
- Proper error propagation through microservices
- Validation errors automatically handled by NestJS

### Database Relations
- Lead Activities → Leads (CASCADE delete)
- Soft references between entities using UUIDs

## Future Enhancements

- [ ] Implement actual AI qualification logic in `leads.qualify()`
- [ ] Implement AI onboarding in `workspaces.onboard()`
- [ ] Add full-text search capabilities
- [ ] Add export functionality (CSV, Excel)
- [ ] Add bulk operations
- [ ] Add audit logging
- [ ] Add rate limiting
- [ ] Add caching layer (Redis)
- [ ] Add webhooks for entity changes
- [ ] Add email templates integration
- [ ] Add document attachments
- [ ] Add tags/labels system
- [ ] Add custom fields support

## License

MIT
