# HandyMate Docker Infrastructure

## Quick Start

```bash
# 1. Setup environment
cd infrastructure/docker
cp .env.example .env

# 2. Start infrastructure
make infra-up

# 3. Wait for services to be healthy (check with)
make infra-ps

# 4. Run migrations
make migrate-all
```

## Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **Developer CRM** | 79 | Developer CRM application |
| **Dancer CRM** | 80 | Dancer CRM application |
| **Painter CRM** | 81 | Painter CRM application |
| **Driver CRM** | 82 | Driver CRM application |
| **Influencer CRM** | 83 | Influencer CRM application |
| **Hunter CRM** | 84 | Hunter CRM application |
| **seller CRM** | 85 | seller CRM application |
| **Trader CRM** | 86 | Trader CRM application |
| **MySQL** | 3306 | Shared MySQL server with separate databases |
| **Redis** | 6379 | Cache and queue backend |
| **n8n** | 5678 | Workflow automation UI & API |
| **Mailhog** | 8025 | Email testing UI (SMTP: 1025) |

## Database Configuration

Each CRM app has its own isolated database:

- **handymate_developer** - Developer CRM database
- **handymate_dancer** - Dancer CRM database
- **handymate_painter** - Painter CRM database
- **handymate_driver** - Driver CRM database
- **handymate_influencer** - Influencer CRM database
- **handymate_hunter** - Hunter CRM database
- **handymate_seller** - seller CRM database
- **handymate_trader** - Trader CRM database
- **handymate_n8n** - n8n workflow database (shared)

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for details.

## n8n Workers

Each CRM app has a dedicated n8n worker for processing workflows:

- **n8n-worker-developer** - Processes Developer workflows (queue: `n8n:developer`)
- **n8n-worker-dancer** - Processes Dancer workflows (queue: `n8n:dancer`)
- **n8n-worker-painter** - Processes Painter workflows (queue: `n8n:painter`)
- **n8n-worker-driver** - Processes Driver workflows (queue: `n8n:driver`)
- **n8n-worker-influencer** - Processes Influencer workflows (queue: `n8n:influencer`)
- **n8n-worker-hunter** - Processes Hunter workflows (queue: `n8n:hunter`)
- **n8n-worker-seller** - Processes seller workflows (queue: `n8n:seller`)
- **n8n-worker-trader** - Processes Trader workflows (queue: `n8n:trader`)

See [N8N_WORKER_GUIDE.md](N8N_WORKER_GUIDE.md) for complete documentation.

## Common Commands

### Infrastructure Management

```bash
make infra-up          # Start all services
make infra-down        # Stop all services
make infra-restart     # Restart all services
make infra-ps          # List running services
make infra-logs        # View all logs
make infra-build       # Rebuild containers
```

### Database Migrations

```bash
make migrate-developer   # Migrate developer database
make migrate-dancer      # Migrate dancer database
make migrate-painter     # Migrate painter database
make migrate-driver      # Migrate driver database
make migrate-influencer  # Migrate influencer database
make migrate-hunter      # Migrate hunter database
make migrate-seller       # Migrate seller database
make migrate-trader      # Migrate trader database
make migrate-all         # Migrate all databases
```

### n8n Worker Management

```bash
make n8n-workers-up                 # Start all workers
make n8n-workers-down               # Stop all workers
make n8n-workers-logs               # View all worker logs
make n8n-worker-developer-logs      # View developer worker logs
make n8n-worker-dancer-logs         # View dancer worker logs
make n8n-worker-painter-logs        # View painter worker logs
make n8n-worker-driver-logs         # View driver worker logs
make n8n-worker-influencer-logs     # View influencer worker logs
make n8n-worker-hunter-logs         # View hunter worker logs
make n8n-worker-seller-logs          # View seller worker logs
make n8n-worker-trader-logs         # View trader worker logs
```

### Application Setup

```bash
make setup-developer-crm    # Setup developer .env file
make setup-dancer-crm       # Setup dancer .env file
make setup-painter-crm      # Setup painter .env file
make setup-driver-crm       # Setup driver .env file
make setup-influencer-crm   # Setup influencer .env file
make setup-hunter-crm       # Setup hunter .env file
make setup-seller-crm        # Setup seller .env file
make setup-trader-crm       # Setup trader .env file

make build-developer-crm    # Build developer (composer, npm)
make build-dancer-crm       # Build dancer (composer, npm)
make build-painter-crm      # Build painter (composer, npm)
make build-driver-crm       # Build driver (composer, npm)
make build-influencer-crm   # Build influencer (composer, npm)
make build-hunter-crm       # Build hunter (composer, npm)
make build-seller-crm        # Build seller (composer, npm)
make build-trader-crm       # Build trader (composer, npm)
```

### Complete Setup

```bash
make full-setup  # Complete setup: setup apps + build + start + migrate
```

## Environment Variables

Key environment variables in `.env`:

```env
# Database
DB_USERNAME=handymate
DB_PASSWORD=secret
DB_DATABASE_DEVELOPER=handymate_developer
DB_DATABASE_DANCER=handymate_dancer
DB_DATABASE_PAINTER=handymate_painter
MYSQL_ROOT_PASSWORD=root

# Application Ports
APP_PORT_DEVELOPER=79
APP_PORT_DANCER=80
APP_PORT_PAINTER=81

# n8n
N8N_PORT=5678
N8N_DB_DATABASE=handymate_n8n
N8N_ENCRYPTION_KEY=change-this-to-a-secure-random-key
```

## Accessing Services

### Web Interfaces

- **Developer CRM**: <http://localhost:79>
- **Dancer CRM**: <http://localhost:80>
- **Painter CRM**: <http://localhost:81>
- **Driver CRM**: <http://localhost:82>
- **Influencer CRM**: <http://localhost:83>
- **Hunter CRM**: <http://localhost:84>
- **seller CRM**: <http://localhost:85>
- **Trader CRM**: <http://localhost:86>
- **n8n UI**: <http://localhost:5678>
- **Mailhog UI**: <http://localhost:8025>

### Database Access

```bash
# From host
mysql -h 127.0.0.1 -P 3306 -u handymate -p

# From container
docker-compose -f infrastructure/docker/docker-compose.yml exec mysql mysql -u handymate -p
```

### Redis Access

```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec redis redis-cli
```

## Resetting Everything

To start fresh:

```bash
# Stop all services
make infra-down

# Remove all volumes (WARNING: This deletes all data!)
docker volume rm handymate_mysql-data
docker volume rm handymate_redis-data
docker volume rm handymate_n8n-data
docker volume rm handymate_vendor-data
docker volume rm handymate_node_modules-data

# Start fresh
make infra-up
make migrate-all
```

## Troubleshooting

### Services Won't Start

Check logs:

```bash
make infra-logs
```

Check individual service:

```bash
docker-compose -f infrastructure/docker/docker-compose.yml logs dancer
docker-compose -f infrastructure/docker/docker-compose.yml logs painter
docker-compose -f infrastructure/docker/docker-compose.yml logs mysql
```

### Database Connection Issues

Ensure MySQL is healthy:

```bash
make infra-ps
```

Wait for healthcheck to pass before running migrations.

### Port Conflicts

If ports 80, 81, or other ports are in use, change them in `.env`:

```env
APP_PORT_DANCER=8080
APP_PORT_PAINTER=8081
N8N_PORT=5678
MYSQL_PORT=3306
```

Then restart:

```bash
make infra-down
make infra-up
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                  (handymate-network)                         │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐     │
│  │  Dancer  │  │ Painter  │  │  n8n   │  │ Mailhog  │     │
│  │   CRM    │  │   CRM    │  │   UI   │  │          │     │
│  │  :80     │  │  :81     │  │ :5678  │  │  :8025   │     │
│  └────┬─────┘  └────┬─────┘  └───┬────┘  └──────────┘     │
│       │             │            │                          │
│       ├─────────────┼────────────┤                          │
│       │             │            │                          │
│  ┌────▼─────────────▼────────────▼────┐                    │
│  │           MySQL Server              │                    │
│  │  ┌──────────┐ ┌──────────┐ ┌────┐ │                    │
│  │  │ dancer   │ │ painter  │ │n8n │ │                    │
│  │  │   DB     │ │   DB     │ │ DB │ │                    │
│  │  └──────────┘ └──────────┘ └────┘ │                    │
│  └────────────────────────────────────┘                    │
│       │             │            │                          │
│  ┌────▼─────────────▼────────────▼────┐                    │
│  │           Redis Cache                │                    │
│  │  Queues: dancer, painter, n8n       │                    │
│  └─────────────────────────────────────┘                    │
│                     │                                        │
│       ┌─────────────┼─────────────┐                        │
│       │             │             │                         │
│  ┌────▼────┐  ┌─────▼────┐  ┌────▼────┐                  │
│  │ n8n     │  │  n8n     │  │ Queue   │                   │
│  │ Worker  │  │  Worker  │  │ Workers │                   │
│  │ Dancer  │  │ Painter  │  │         │                   │
│  └─────────┘  └──────────┘  └─────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Documentation

- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Complete database configuration guide
- [N8N_WORKER_GUIDE.md](N8N_WORKER_GUIDE.md) - n8n worker architecture and usage
- [.env.example](.env.example) - Environment variable reference

## Support

For issues or questions:

1. Check the documentation files above
2. Review service logs: `make infra-logs`
3. Check service status: `make infra-ps`
