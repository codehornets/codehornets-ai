# Developer CRM Setup Summary

## Overview

The Developer CRM service has been successfully added to the HandyMate infrastructure with complete database isolation, dedicated n8n worker, and full Makefile command support.

## What Was Added

### 1. Docker Compose Service

**Service: developer** ([docker-compose.yml:5-46](docker-compose.yml#L5-L46))
- Container: `handymate-developer`
- Port: `79` (configurable via `APP_PORT_DEVELOPER`)
- Vite Port: `5174` (configurable via `VITE_PORT_DEVELOPER`)
- Database: `handymate_developer`
- Build context: `crm/developer`

### 2. Dedicated n8n Worker

**Service: n8n-worker-developer** ([docker-compose.yml:601-669](docker-compose.yml#L601-L669))
- Container: `handymate-n8n-worker-developer`
- Queue prefix: `n8n:developer`
- Logs: `storage/logs/n8n/developer/`
- Worker metadata: `WORKER_APP=developer`, `WORKER_ID=developer-1`

### 3. Database Configuration

**MySQL Database: handymate_developer**
- Auto-created on first container startup
- Full privileges granted to `handymate` user
- Isolated from other CRM databases

**Init Script Updated:** [mysql/init/01-create-databases.sql](mysql/init/01-create-databases.sql)

### 4. Makefile Commands

**Setup Commands:**
```bash
make setup-developer-crm   # Setup .env file
make build-developer-crm   # Install dependencies
```

**Migration Commands:**
```bash
make migrate-developer     # Run migrations
make migrate-all          # Migrate all apps (includes developer)
```

**n8n Worker Commands:**
```bash
make n8n-worker-developer-up    # Start developer worker
make n8n-worker-developer-logs  # View worker logs
make n8n-workers-up            # Start all workers (includes developer)
```

**Full Setup:**
```bash
make full-setup  # Complete setup (includes developer)
```

### 5. Environment Variables

**New variables in [.env.example](.env.example):**
```env
# Developer CRM Database
DB_DATABASE_DEVELOPER=handymate_developer

# Application Ports
APP_PORT_DEVELOPER=79
VITE_PORT_DEVELOPER=5174
```

### 6. Documentation Updates

All documentation files have been updated to include developer:
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database and worker configuration
- [README.md](README.md) - Quick reference guide
- [N8N_WORKER_GUIDE.md](N8N_WORKER_GUIDE.md) - Worker architecture (reference examples)

## Service Details

### Service Configuration

| Property | Value |
|----------|-------|
| **Service Name** | developer |
| **Container Name** | handymate-developer |
| **Build Context** | crm/developer |
| **Working Directory** | /var/www/html |
| **HTTP Port** | 79 (default) |
| **Vite Port** | 5174 (default) |
| **Database** | handymate_developer |
| **Redis Queue** | redis |
| **Log Directory** | storage/logs |

### n8n Worker Configuration

| Property | Value |
|----------|-------|
| **Worker Name** | n8n-worker-developer |
| **Container Name** | handymate-n8n-worker-developer |
| **Queue Prefix** | n8n:developer |
| **Worker App** | developer |
| **Worker ID** | developer-1 |
| **CPU Limit** | 1 core |
| **Memory Limit** | 1GB |
| **Log Directory** | storage/logs/n8n/developer |

## Complete Service List

| Service | Port | Database | n8n Worker | Queue Prefix |
|---------|------|----------|------------|--------------|
| **Developer** | 79 | handymate_developer | n8n-worker-developer | n8n:developer |
| **Dancer** | 80 | handymate_dancer | n8n-worker-dancer | n8n:dancer |
| **Painter** | 81 | handymate_painter | n8n-worker-painter | n8n:painter |
| **n8n** | 5678 | handymate_n8n | - | - |

## Quick Start

### 1. Setup Developer CRM

```bash
# Create .env file
make setup-developer-crm

# Build dependencies
make build-developer-crm
```

### 2. Start Infrastructure

```bash
# Start all services (including developer)
make infra-up

# Verify services are running
make infra-ps
```

### 3. Run Migrations

```bash
# Migrate developer database only
make migrate-developer

# Or migrate all databases
make migrate-all
```

### 4. Verify n8n Worker

```bash
# Start developer worker
make n8n-worker-developer-up

# View logs
make n8n-worker-developer-logs
```

### 5. Access Developer CRM

Open in browser: http://localhost:79

## Using with n8n

### Workflow Configuration

When creating workflows for the Developer CRM in n8n:

1. **Tag workflows:** Add `developer` tag
2. **Set queue:** Configure workflow to use `developer` queue
3. **Webhook naming:** Use prefix `developer-*` (e.g., `developer-task-created`)

### Laravel Integration Example

```php
use Illuminate\Support\Facades\Http;

// Trigger a developer workflow
$response = Http::post('http://n8n:5678/webhook/developer-project-created', [
    'project_id' => $project->id,
    'queue' => 'developer',
    'metadata' => [
        'app' => 'developer',
        'triggered_by' => auth()->user()->id,
    ]
]);
```

## Resetting Developer Database

To reset only the developer database:

```bash
# Access MySQL container
docker-compose -f infrastructure/docker/docker-compose.yml exec mysql mysql -u root -p

# Drop and recreate database
DROP DATABASE handymate_developer;
CREATE DATABASE handymate_developer;
GRANT ALL PRIVILEGES ON handymate_developer.* TO 'handymate'@'%';
FLUSH PRIVILEGES;
exit

# Re-run migrations
make migrate-developer
```

## Troubleshooting

### Port 79 Already in Use

If port 79 is already in use, update `.env`:

```env
APP_PORT_DEVELOPER=8079  # Use different port
```

Then restart:
```bash
make infra-down
make infra-up
```

### Worker Not Processing Jobs

Check worker status:
```bash
make n8n-worker-developer-logs
```

Verify queue configuration:
```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec redis redis-cli
KEYS n8n:developer:*
```

### Database Connection Issues

Verify database configuration:
```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec developer env | grep DB_
```

Check MySQL:
```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec mysql mysql -u handymate -p -e "SHOW DATABASES;"
```

## Scaling

To add additional developer workers for high load:

1. Copy the `n8n-worker-developer` service in docker-compose.yml
2. Rename to `n8n-worker-developer-2`
3. Update `WORKER_ID: developer-2`
4. Keep the same `QUEUE_BULL_PREFIX: "n8n:developer"`
5. Update Makefile commands to include the new worker

## Next Steps

1. Configure your developer CRM application in `crm/developer/`
2. Set up specific n8n workflows for developer processes
3. Configure webhooks in Laravel to trigger n8n workflows
4. Monitor worker logs for debugging
5. Scale workers as needed based on load

## Related Documentation

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Complete database configuration
- [N8N_WORKER_GUIDE.md](N8N_WORKER_GUIDE.md) - Worker architecture and usage
- [README.md](README.md) - Infrastructure overview
