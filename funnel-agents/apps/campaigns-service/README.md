# Campaigns Service

The Campaigns Service is responsible for managing campaigns (projects) and campaign templates in the FunnelAgents platform.

## Features

### Campaigns (Projects)
- CRUD operations for campaigns
- Filter campaigns by workspace, status, and priority
- Search campaigns by name and description
- Track campaign progress (0-100%)
- Assign agents and team members to campaigns
- Create campaigns from templates

### Campaign Templates
- CRUD operations for campaign templates
- Categorize templates (e.g., lead_generation, product_launch, newsletter)
- Public/private templates
- Default settings and agent suggestions
- Task templates for automated task creation

## Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Communication**: TCP Microservice
- **Port**: 3003

## API Endpoints

### Campaigns

#### REST Endpoints
- `GET /campaigns` - List all campaigns with optional filters
- `GET /campaigns/:id` - Get campaign by ID
- `POST /campaigns` - Create a new campaign
- `PATCH /campaigns/:id` - Update a campaign
- `DELETE /campaigns/:id` - Delete a campaign
- `POST /campaigns/from-template` - Create campaign from template

#### Microservice Messages
- `{ cmd: 'campaigns.findAll' }`
- `{ cmd: 'campaigns.findById' }`
- `{ cmd: 'campaigns.create' }`
- `{ cmd: 'campaigns.update' }`
- `{ cmd: 'campaigns.delete' }`
- `{ cmd: 'campaigns.createFromTemplate' }`

### Campaign Templates

#### REST Endpoints
- `GET /campaign-templates` - List all templates with optional filters
- `GET /campaign-templates/:id` - Get template by ID
- `POST /campaign-templates` - Create a new template
- `PATCH /campaign-templates/:id` - Update a template
- `DELETE /campaign-templates/:id` - Delete a template

#### Microservice Messages
- `{ cmd: 'campaign-templates.findAll' }`
- `{ cmd: 'campaign-templates.findById' }`
- `{ cmd: 'campaign-templates.create' }`
- `{ cmd: 'campaign-templates.update' }`
- `{ cmd: 'campaign-templates.delete' }`

## Query Parameters

### Campaign Filters
- `workspace_id` - Filter by workspace ID
- `status` - Filter by status (draft, planning, active, on_hold, completed, archived)
- `priority` - Filter by priority (low, medium, high, critical)
- `search` - Search in name and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort order (asc, desc)

### Template Filters
- `category` - Filter by category
- `is_public` - Filter by public status (true, false)
- `search` - Search in name and description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Field to sort by
- `sortOrder` - Sort order (asc, desc)

## Data Models

### Campaign
```typescript
{
  id: string;
  name: string;
  description?: string;
  workspace_id?: string;
  status: 'draft' | 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  goal?: string;
  start_date?: Date;
  end_date?: Date;
  team_members?: string[];
  agent_ids?: string[];
  settings?: Record<string, any>;
  progress?: number; // 0-100
  created_at: Date;
  updated_at: Date;
}
```

### Campaign Template
```typescript
{
  id: string;
  name: string;
  description?: string;
  category: string;
  default_settings?: Record<string, any>;
  default_agents?: string[];
  default_tasks?: TaskTemplate[];
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Task Template
```typescript
{
  title: string;
  description?: string;
  agent_domain?: string;
  priority?: string;
}
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Service
CAMPAIGNS_SERVICE_HOST=0.0.0.0
CAMPAIGNS_SERVICE_PORT=3003

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=funnelagents
DATABASE_SYNC=false
DATABASE_LOGGING=false
```

## Development

### Build
```bash
nx build campaigns-service
```

### Run
```bash
nx serve campaigns-service
```

### Test
```bash
nx test campaigns-service
```

### Lint
```bash
nx lint campaigns-service
```

## Database Setup

### Development
For development, you can set `DATABASE_SYNC=true` to automatically sync the schema. However, this is NOT recommended for production.

### Production
For production, use TypeORM migrations:

```bash
# Generate migration
npm run typeorm migration:generate -- -n CampaignsMigration

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

## Integration Notes

### Creating Campaigns from Templates
When creating a campaign from a template using `POST /campaigns/from-template`:

1. The template's `default_settings` are merged with provided settings
2. The template's `default_agents` are assigned to the campaign
3. If `create_default_tasks: true`, task templates are stored in campaign settings as `pending_tasks`
4. Integration with tasks-service would be needed to actually create the tasks

### Future Enhancements
- Event-driven task creation when using templates
- Campaign analytics and reporting
- Campaign duplication
- Bulk operations
- Advanced filtering and search
- Campaign archival and restoration
