# FunnelAgents - Infrastructure

This directory contains all infrastructure-as-code, deployment configurations, and operational scripts for FunnelAgents across multiple platforms.

## 📁 Directory Structure

```
infrastructure/
├── terraform/          # Multi-cloud IaC (AWS, GCP, Azure)
│   ├── aws/           # AWS ECS/Fargate deployment
│   ├── azure/         # Azure Container Apps deployment
│   └── environments/  # Environment-specific configs (dev, staging, production)
├── docker/            # Docker Compose for local development
├── kubernetes/        # Kubernetes manifests (base + overlays)
├── railway/           # Railway PaaS deployment
├── render/            # Render PaaS deployment
└── systemd/           # systemd service definitions
```

## 🚀 Quick Start

### Local Development (Docker)

```bash
# From infrastructure/docker directory
cd infrastructure/docker

# Copy environment file
cp .env.example .env

# Start all services (PostgreSQL, Redis, n8n, Mailhog)
docker compose up -d

# Start with dev tools (pgAdmin, Redis Commander)
docker compose --profile dev-tools up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Local Development (Native - Recommended for Development)

```bash
# From project root
make install          # Install dependencies
make dev              # Start all NestJS microservices
make dev-web          # Start frontend (in separate terminal)
make dev-full         # Start backend + frontend together
```

## 🏗️ Architecture

### Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Main entry point, routing, auth guard |
| **Auth Service** | 3001 | Authentication, JWT, RBAC |
| **CRM Service** | 3002 | Leads, contacts, deals management |
| **Campaigns Service** | 3003 | Campaign management |
| **Content Service** | 3004 | Content library, assets |
| **Agents Service** | 3005 | AI Agent registry, status |
| **Tasks Service** | 3006 | Task queue, execution |
| **Automations Service** | 3007 | Workflow definitions |
| **Reports Service** | 3008 | Analytics, dashboards |
| **Worker Runner** | 3009 | BullMQ job processor |
| **Scheduler** | 3010 | Cron jobs, scheduling |
| **Web UI** | 4200 | React frontend |
| **n8n** | 5678 | Workflow automation (agent orchestration) |

### Infrastructure Services

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** | 5432 | Primary database |
| **Redis** | 6379 | Cache, queues, sessions |
| **Mailhog** | 8025 (UI), 1025 (SMTP) | Email testing |
| **pgAdmin** | 5050 | PostgreSQL GUI (dev-tools profile) |
| **Redis Commander** | 8081 | Redis GUI (dev-tools profile) |

### n8n Workers (Agent Orchestration)

| Worker | Queue Prefix | Description |
|--------|--------------|-------------|
| **n8n-worker-crm** | n8n:crm | CRM workflow processing |
| **n8n-worker-campaigns** | n8n:campaigns | Campaign workflow processing |
| **n8n-worker-content** | n8n:content | Content workflow processing |
| **n8n-worker-reports** | n8n:reports | Reporting workflow processing |
| **n8n-worker-automations** | n8n:automations | Automation workflow processing |

## 📚 Docker Compose Profiles

```bash
# Core services only (default)
docker compose up -d

# Include development tools
docker compose --profile dev-tools up -d
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
POSTGRES_DB=funnel_agents
POSTGRES_USER=funnel_agents
POSTGRES_PASSWORD=secret

# n8n (Agent Orchestration)
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
N8N_ENCRYPTION_KEY=change-this-to-a-secure-random-key

# JWT
JWT_SECRET=your-super-secret-jwt-key
```

### n8n Integration

n8n is used for agent-to-agent communication and workflow orchestration:

1. Access n8n at `http://localhost:5678`
2. Default credentials: `admin` / `changeme`
3. Create workflows to orchestrate agents
4. Use webhooks to trigger from NestJS services

## 🛠️ Make Commands

```bash
# Development
make install          # Install all dependencies
make dev              # Start all services (native)
make dev-full         # Backend + frontend
make dev-core         # Gateway + auth + tasks only

# Docker
make docker-up        # Start Docker services
make docker-down      # Stop Docker services
make docker-logs      # View logs

# Build & Test
make build            # Build all services
make test             # Run all tests
make lint             # Lint all projects
```

## 🏢 Deployment Platforms

| Platform | Use Case | Cost | Complexity |
|----------|----------|------|------------|
| **Docker Compose** | Local development | Free | Low |
| **AWS ECS** | Production, high traffic | $$$ | High |
| **Azure Container Apps** | Enterprise, Azure ecosystem | $$$ | High |
| **Railway** | Quick deployment, small teams | $ | Low |
| **Render** | Simplicity, managed services | $$ | Low |
| **Kubernetes** | Full control, multi-cloud | $$$ | Very High |

## 📊 Service Dependencies

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │───▶│   API Gateway   │───▶│  Microservices  │
│   (web-ui)      │    │   (NestJS)      │    │   (NestJS)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                      │
                              ▼                      ▼
                       ┌──────────┐          ┌──────────────┐
                       │  Redis   │          │  PostgreSQL  │
                       │(Cache/Q) │          │ (Persistence)│
                       └──────────┘          └──────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │      n8n        │
                       │  (Orchestration)│
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  n8n Workers    │
                       │ (Agent Tasks)   │
                       └─────────────────┘
```

## 🔒 Security

- **Secrets Management** - Environment variables, AWS Secrets Manager in production
- **Encryption** - At-rest and in-transit encryption
- **Network Isolation** - Docker network, VPC in cloud
- **Authentication** - JWT tokens, n8n basic auth
- **Container Security** - Non-root users, health checks

## 📞 Support

For infrastructure issues:
1. Check the [Makefile](../Makefile) for available commands: `make help`
2. Review logs: `docker compose logs -f <service>`
3. Check service health: `docker compose ps`
