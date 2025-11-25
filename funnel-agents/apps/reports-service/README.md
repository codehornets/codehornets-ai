# Reports Service

The Reports Service handles analytics and aggregations for the FunnelAgents platform.

## Features

- Task Analytics
- Agent Performance Metrics
- Domain Comparison
- Data Export (CSV, JSON, PDF)

## Architecture

- **Framework**: NestJS with Microservices
- **Database**: PostgreSQL via TypeORM
- **Port**: 3008
- **Transport**: TCP

## API Endpoints

### Analytics Endpoints

#### Get Task Analytics
```http
GET /analytics/tasks?start_date=2024-01-01&end_date=2024-12-31&workspace_id=xxx&agent_id=xxx
```

Returns statistics about tasks including:
- Total, completed, failed, pending, running counts
- Success rate
- Average completion time
- Tasks by status
- Tasks by day

#### Get Agent Analytics
```http
GET /analytics/agents?start_date=2024-01-01&end_date=2024-12-31&workspace_id=xxx&domain=sales
```

Returns agent performance metrics:
- Total and active agent counts
- Per-agent metrics (tasks completed, failed, success rate, avg completion time)

#### Get Domain Analytics
```http
GET /analytics/domains?start_date=2024-01-01&end_date=2024-12-31&workspace_id=xxx
```

Returns domain-level aggregations:
- Agent counts per domain
- Task statistics per domain
- Success rates and completion times

#### Export Analytics
```http
GET /analytics/export/:format?start_date=2024-01-01&end_date=2024-12-31&workspace_id=xxx
```

Supported formats:
- `csv` - CSV format with all analytics data
- `json` - JSON format with all analytics data
- `pdf` - Returns JSON for client-side PDF generation (to be implemented)

## Query Parameters

All analytics endpoints support:

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | ISO Date String | Filter from date |
| `end_date` | ISO Date String | Filter to date |
| `workspace_id` | UUID | Filter by workspace |
| `domain` | String | Filter by domain (agents/domains endpoints) |
| `agent_id` | UUID | Filter by agent (tasks endpoint) |

## Response Formats

### Task Analytics Response
```typescript
{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  success_rate: number;
  avg_completion_time: number;
  tasks_by_status: Record<string, number>;
  tasks_by_day: Array<{
    date: string;
    count: number;
    completed: number;
    failed: number;
  }>;
}
```

### Agent Analytics Response
```typescript
{
  total_agents: number;
  active_agents: number;
  agents: Array<{
    id: string;
    name: string;
    domain: string;
    status: string;
    tasks_completed: number;
    tasks_failed: number;
    success_rate: number;
    avg_completion_time: number;
    avg_feedback_rating: number;
  }>;
}
```

### Domain Analytics Response
```typescript
{
  domains: Array<{
    domain: string;
    agent_count: number;
    active_count: number;
    total_tasks: number;
    completed_tasks: number;
    success_rate: number;
    avg_completion_time: number;
  }>;
}
```

## Database Schema

The service connects to the same PostgreSQL database as other services and queries:

- `tasks` table - For task analytics
- `agents` table - For agent performance metrics

## Development

### Running the Service

```bash
# Development
nx serve reports-service

# Production build
nx build reports-service
```

### Testing

```bash
# Unit tests
nx test reports-service

# Test with coverage
nx test reports-service --coverage
```

### Environment Variables

```env
REPORTS_SERVICE_HOST=localhost
REPORTS_SERVICE_PORT=3008
DATABASE_URL=postgresql://user:password@localhost:5432/funnel_agents
NODE_ENV=development
```

## Microservice Patterns

The service implements both HTTP REST endpoints and NestJS microservice message patterns:

```typescript
// Message patterns
{ cmd: 'get_task_analytics' }
{ cmd: 'get_agent_analytics' }
{ cmd: 'get_domain_analytics' }
{ cmd: 'export_analytics' }
```

## Future Enhancements

- [ ] Implement PDF generation with pdfkit
- [ ] Add caching layer for expensive queries (Redis)
- [ ] Implement scheduled report generation
- [ ] Add real-time analytics via WebSockets
- [ ] Implement feedback system for agents
- [ ] Add custom report builder
- [ ] Implement report templates
- [ ] Add data visualization endpoints
- [ ] Implement report scheduling
- [ ] Add anomaly detection

## Dependencies

- `@nestjs/common` - NestJS core
- `@nestjs/config` - Configuration management
- `@nestjs/typeorm` - TypeORM integration
- `@nestjs/microservices` - Microservice support
- `typeorm` - ORM for database access
- `pg` - PostgreSQL driver
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## Architecture Notes

### Direct Database Access

For now, the service queries the database directly to aggregate data from tasks and agents tables. This provides:

- Fast query performance
- Complex aggregations using TypeORM query builder
- Simple implementation

### Future: Inter-Service Communication

In a more distributed architecture, consider:

- Using message brokers (NATS, RabbitMQ) to query other services
- Implementing CQRS with read replicas
- Using materialized views for faster analytics
- Implementing event sourcing for historical data

## License

MIT
