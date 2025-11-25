# FunnelAgents

FunnelAgents is an AI-powered marketing automation platform that combines microservices architecture with intelligent agents to streamline lead management, campaign automation, and content creation for digital agencies.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Services](#services)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

FunnelAgents provides digital agencies with a unified operations console to manage:

- **Multi-tenant Client Workspaces** - Isolated environments per client
- **Campaign Management** - Initiative tracking with objectives and KPIs
- **CRM Pipeline** - Lead, contact, and deal management
- **Content Library** - Centralized repository for reusable assets
- **AI Specialist Agents** - Domain-specific workers for automated tasks
- **Workflow Automation** - Visual workflow builder with event triggers
- **Analytics & Reporting** - Performance metrics and insights
- **Task Orchestration** - Background job processing with BullMQ

The platform emphasizes predictable, scriptable workflows over vague "AI magic," giving teams full visibility into what agents do and when they run.

---

## Architecture

### High-Level Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Frontend │────▶│  API Gateway    │────▶│  Microservices  │
│  (Vite + React) │     │  (NestJS)       │     │  (NestJS)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                       ┌─────────────────┐       ┌─────────────────┐
                       │                 │       │                 │
                       │  Redis/BullMQ   │       │  PostgreSQL     │
                       │  (Queue/Cache)  │       │  (Persistence)  │
                       │                 │       │                 │
                       └─────────────────┘       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │                 │
                       │  Worker Runner  │────▶  Python Agents
                       │  (Job Processing)│      (digital-agency/)
                       │                 │
                       └─────────────────┘
```

### Nx Monorepo Structure

The project uses Nx for monorepo management, providing:

- Shared code via libraries (domain, application, infrastructure)
- Consistent tooling and build configuration
- Dependency graph visualization
- Affected-based testing and builds

---

## Services

### Backend Services (NestJS)

| Service              | Port | Description                                      |
|----------------------|------|--------------------------------------------------|
| **api-gateway**      | 3000 | Main API entry point, routing, authentication    |
| **auth-service**     | 3001 | User authentication, JWT tokens, RBAC            |
| **crm-service**      | 3002 | Leads, contacts, deals, pipelines                |
| **campaigns-service**| 3003 | Campaign management and objectives               |
| **content-service**  | 3004 | Content library and asset management             |
| **agents-service**   | 3005 | AI agent registry, capabilities, status          |
| **tasks-service**    | 3006 | Task queue, execution tracking                   |
| **automations-service** | 3007 | Workflow definitions and triggers             |
| **reports-service**  | 3008 | Analytics, metrics, dashboards                   |
| **worker-runner**    | 3009 | BullMQ job processor, agent execution            |
| **scheduler**        | 3010 | Cron jobs, scheduled automations                 |

### Frontend

| Application | Port | Description                |
|-------------|------|----------------------------|
| **web-ui**  | 5173 | React frontend (Vite dev)  |

### Shared Libraries

| Library               | Purpose                                           |
|-----------------------|---------------------------------------------------|
| **domain**            | Pure domain models and business logic             |
| **application**       | Use cases, application services, DTOs             |
| **infrastructure**    | Database, messaging, external integrations        |
| **interfaces**        | Shared contracts, API schemas, events             |
| **shared**            | Common utilities, helpers, constants              |

### Python AI Agents

Located in `digital-agency/agents/`, organized by business domain:

- **01_offer** - Competitive analysis, value proposition development
- **02_marketing** - Content creation, ads management, SEO
- **03_sales** - Lead qualification, discovery, negotiation
- **04_fulfillment** - Project management, client success
- **05_feedback_loop** - Analytics, process optimization
- **06_business_dev** - Growth strategy, partnerships
- **07_operations** - Finance, HR, compliance
- **08_customer_support** - Help desk, escalations, retention
- **09_leadership** - Strategy, decision support
- **10_innovation** - Research, experimentation
- **11_enablement** - Training, onboarding, culture

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Docker & Docker Compose**
- **Python** 3.11+ (optional, for AI agents)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/funnel-agents.git
cd funnel-agents

# 2. Install dependencies
make install

# 3. Copy environment configuration
cp .env.example .env
cp apps/web-ui/.env.example apps/web-ui/.env

# 4. Start everything (Docker infra + all services + web-ui)
make up
```

### Access Points

- **Web UI:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api/docs
- **n8n Workflows:** http://localhost:5678
- **Mailhog:** http://localhost:8025

### Default Test Credentials

- **Email:** `admin@funnelagents.com`
- **Password:** `admin123`

---

## Development

### Environment Configuration

Key environment variables in `.env`:

```env
# Database (matches Docker PostgreSQL)
DATABASE_URL=postgresql://funnel_agents:secret@localhost:5432/funnel_agents
DB_USERNAME=funnel_agents
DB_PASSWORD=secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=funnel_agents

# Redis (Docker uses 6380 externally)
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001
CRM_SERVICE_PORT=3002
```

### Start Commands

```bash
# Start everything (infrastructure + services + frontend)
make up

# Start infrastructure only (PostgreSQL, Redis, n8n, Mailhog)
make up-infra

# Start backend services only
make up-services

# Start frontend only
make up-web

# Start minimal setup (gateway + auth + tasks)
make up-minimal

# Start individual services
make dev-gateway      # API Gateway (port 3000)
make dev-auth         # Auth Service (port 3001)
make dev-crm          # CRM Service (port 3002)
make dev-web          # Web UI (port 5173)
```

### Development Workflow

```bash
# View project dependency graph
npx nx graph

# Generate new NestJS service
make generate-app NAME=my-service

# Generate new library
make generate-lib NAME=my-lib

# Run tests
make test

# Run tests for specific service
make test-auth

# Build for production
make build-prod

# Check health of all services
make health-all
```

### Backend Toggle (Base44 vs NestJS)

The web-ui can connect to either backend by setting `VITE_BACKEND_MODE` in `apps/web-ui/.env`:

```env
# Use local NestJS microservices
VITE_BACKEND_MODE=nestjs

# Or use Base44 external platform
VITE_BACKEND_MODE=base44
```

---

## Testing

### Run Tests

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run E2E tests
make test-e2e

# Run tests with coverage
make test-cov

# Run integration tests
make test-integration

# Test specific services
make test-auth
make test-crm
make test-campaigns
```

### Integration Tests

Integration tests use a separate Docker Compose setup:

```bash
# Start integration test infrastructure
make test-integration-infra-up

# Run integration tests in watch mode
make test-integration-watch

# Stop integration test infrastructure
make test-integration-infra-down
```

### Health Checks

```bash
# Check health of all services
make health-all

# Quick health check of core services
make health-quick

# Check specific service
make health-auth
make health-gateway
```

---

## Documentation

### Key Documentation Files

| Document | Description |
|----------|-------------|
| [Backend Setup Guide](BACKEND_SETUP_GUIDE.md) | Comprehensive backend configuration guide |
| [Database Schema](DATABASE_SCHEMA.md) | Complete database schema documentation |
| [Testing Guide](TESTING.md) | Testing strategy and test commands |
| [Quick Reference](QUICK_REFERENCE.md) | Quick command reference for developers |
| [Auth Service Security](apps/auth-service/README_SECURITY.md) | Security features and best practices |
| [Agent Execution](apps/agents-service/EXECUTION_QUICKSTART.md) | Agent execution system guide |
| [Automation Engine](apps/automations-service/EXECUTION_ENGINE.md) | Workflow execution engine documentation |
| [Reports API](apps/reports-service/API_GUIDE.md) | Reports service API reference |
| [Scheduler Service](apps/scheduler/README.md) | Task scheduling system guide |
| [Worker Runner](apps/worker-runner/QUICKSTART.md) | Background job processing guide |

### API Documentation

Interactive API documentation is available via Swagger UI:

```
http://localhost:3000/api/docs
```

### Architecture Documentation

- **Dual-Backend Architecture** - How Base44/NestJS toggle works
- **Microservices Communication** - Inter-service communication patterns
- **Event-Driven Architecture** - Event publishing and subscription

---

## Database Operations

```bash
# Start database containers
make db-up

# Run migrations
make db-migrate

# Seed database with test data
make db-seed-all          # All seed data
make db-seed-users        # Test users only
make db-seed-templates    # Agent templates only

# Reset database (drop + migrate + seed)
make db-reset

# Open database studio
make db-studio
```

---

## Docker Commands

```bash
# Start infrastructure (PostgreSQL, Redis, n8n, Mailhog)
make docker-infra

# Start all infrastructure including n8n workers
make docker-infra-full

# Start with dev tools (pgAdmin, Redis Commander)
make docker-infra-tools

# View container logs
make docker-logs

# View n8n logs
make docker-logs-n8n

# View specific service logs
make docker-logs-service SERVICE=postgres

# Check container status
make docker-ps

# Clean up Docker resources
make docker-clean

# Rebuild and restart containers
make docker-rebuild
```

---

## Monitoring

```bash
# Start Prometheus and Grafana
make monitoring-up

# Check monitoring health
make monitoring-status

# View metrics endpoints
make monitoring-metrics

# Stop monitoring services
make monitoring-down
```

Access points:
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001

---

## Code Quality

```bash
# Lint all projects
make lint

# Lint and auto-fix
make lint-fix

# Format all files
make format

# Type check
make typecheck
```

---

## Tech Stack

| Category          | Technology                                        |
|-------------------|---------------------------------------------------|
| Monorepo          | Nx                                                |
| Backend Framework | NestJS (TypeScript)                               |
| Frontend          | React + TypeScript + Vite                         |
| UI Components     | Tailwind CSS + shadcn/ui                          |
| Database ORM      | TypeORM                                           |
| Database          | PostgreSQL                                        |
| Cache/Messaging   | Redis                                             |
| Job Queue         | BullMQ                                            |
| Agent Runtime     | Python 3.11+                                      |
| Containerization  | Docker + Docker Compose                           |
| API Documentation | OpenAPI / Swagger                                 |
| Testing           | Jest (TS), Pytest (Python)                        |
| Monitoring        | Prometheus + Grafana                              |
| Email Testing     | Mailhog                                           |
| Workflow Automation | n8n                                             |

---

## Project Structure

```
funnel-agents/
├── apps/                              # Applications
│   ├── api-gateway/                   # Main API gateway (port 3000)
│   ├── auth-service/                  # Authentication service (port 3001)
│   ├── crm-service/                   # CRM service (port 3002)
│   ├── campaigns-service/             # Campaigns service (port 3003)
│   ├── content-service/               # Content library service (port 3004)
│   ├── agents-service/                # Agent registry service (port 3005)
│   ├── tasks-service/                 # Task management service (port 3006)
│   ├── automations-service/           # Automation workflows service (port 3007)
│   ├── reports-service/               # Reporting service (port 3008)
│   ├── worker-runner/                 # BullMQ job processor (port 3009)
│   ├── scheduler/                     # Scheduled jobs service (port 3010)
│   └── web-ui/                        # React frontend (port 5173)
├── libs/                              # Shared libraries
│   ├── domain/                        # Domain models and business logic
│   ├── application/                   # Use cases and application services
│   ├── infrastructure/                # Database, messaging, integrations
│   ├── interfaces/                    # Shared contracts and API schemas
│   └── shared/                        # Common utilities and helpers
├── digital-agency/                    # Python AI agents
│   ├── agents/                        # Agent implementations by domain
│   ├── api/                           # Python API layer
│   └── core/                          # Shared Python utilities
├── infrastructure/                    # Infrastructure configuration
│   └── docker/                        # Docker Compose files
├── database/                          # Database migrations and seeds
├── tests/                             # Test files and fixtures
├── docs/                              # Additional documentation
├── Makefile                           # Development commands
├── nx.json                            # Nx configuration
├── package.json                       # Root package.json
└── README.md                          # This file
```

---

## Troubleshooting

### Database Connection Issues

If you see `password authentication failed for user`:

1. Check `.env` matches Docker credentials:
   ```env
   DB_USERNAME=funnel_agents
   DB_PASSWORD=secret
   ```

2. Restart PostgreSQL:
   ```bash
   make restart-infra
   ```

### Port Conflicts

Services use these default ports:

| Service | Port |
|---------|------|
| API Gateway | 3000 |
| Auth Service | 3001 |
| CRM Service | 3002 |
| Campaigns Service | 3003 |
| Content Service | 3004 |
| Agents Service | 3005 |
| Tasks Service | 3006 |
| Automations Service | 3007 |
| Reports Service | 3008 |
| Worker Runner | 3009 |
| Scheduler | 3010 |
| Web UI | 5173 |
| PostgreSQL | 5432 |
| Redis | 6380 |
| n8n | 5678 |

Kill conflicting processes:
```bash
lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9
```

### TypeScript/Build Errors

```bash
# Reset Nx cache
make reset

# Clean and rebuild
make clean && make build
```

### Docker Issues

```bash
# Full Docker cleanup
make down-clean

# Rebuild from scratch
make docker-rebuild
```

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes with proper tests
3. Run `make lint` and `make test` to ensure quality
4. Commit with conventional commit messages
5. Push and create a pull request

---

## License

Copyright (c) 2024. All rights reserved.
