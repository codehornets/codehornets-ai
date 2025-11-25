# FunnelAgents

FunnelAgents is an operations console for digital agencies. It provides a unified platform to manage clients, campaigns, leads, content, specialist agents, tasks, automations, and performance reporting.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Concepts](#key-concepts)
- [Agent Domains](#agent-domains)
- [Development Workflow](#development-workflow)
- [API Reference](#api-reference)
- [License](#license)

---

## Project Overview

FunnelAgents gives digital agencies a single place to manage:

- **Clients and Workspaces** - Multi-tenant client management
- **Campaigns** - Initiative tracking with objectives and KPIs
- **CRM** - Leads, contacts, and deals pipeline
- **Content Library** - Reusable posts, emails, ads, and assets
- **Specialist Agents** - Domain-specific AI workers that execute tasks
- **Tasks and Automations** - Workflow orchestration and scheduling
- **Reports** - Performance analytics across all domains

Under the hood, each agent is a scripted worker with a clear role and fixed toolset. The platform focuses on predictable workflows, not vague "AI magic."

---

## Architecture

### High-Level Overview

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   React Frontend  |---->|   API Gateway     |---->|   Microservices   |
|   (apps-web/web)  |     |   (NestJS)        |     |   (NestJS)        |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
                                   |                        |
                                   v                        v
                          +-------------------+     +-------------------+
                          |                   |     |                   |
                          |   Redis           |     |   PostgreSQL      |
                          |   (Cache/Queue)   |     |   (Persistence)   |
                          |                   |     |                   |
                          +-------------------+     +-------------------+
                                   |
                                   v
                          +-------------------+
                          |                   |
                          |   BullMQ Workers  |---->  Python Agents
                          |   (Job Processing)|      (digital-agency/)
                          |                   |
                          +-------------------+
```

### Nx Monorepo Structure

The project uses Nx for monorepo management, enabling:

- Shared code between services via libraries
- Consistent tooling and build configuration
- Dependency graph visualization
- Affected-based testing and builds
- Code generators for new services/libraries

### NestJS Microservices

| Service           | Port  | Description                                      |
|-------------------|-------|--------------------------------------------------|
| api-gateway       | 3000  | Main entry point, routing, authentication        |
| auth              | 3001  | User authentication, JWT tokens, RBAC            |
| crm               | 3002  | Leads, contacts, deals, pipelines                |
| campaigns         | 3003  | Campaign management and objectives               |
| content           | 3004  | Content library and asset management             |
| agents            | 3005  | Agent registry, capabilities, status             |
| tasks             | 3006  | Task queue, execution tracking                   |
| automations       | 3007  | Workflow definitions and triggers                |
| reports           | 3008  | Analytics, metrics, dashboards                   |
| worker-runner     | 3009  | BullMQ job processor, agent execution            |
| scheduler         | 3010  | Cron jobs, scheduled automations                 |

### Shared Libraries

| Library           | Purpose                                           |
|-------------------|---------------------------------------------------|
| domain            | Pure domain models and business logic             |
| application       | Use cases, application services, DTOs             |
| infrastructure    | Database, messaging, external integrations        |
| interfaces        | Shared contracts, API schemas, events             |
| shared            | Common utilities, helpers, constants              |

### Digital-Agency Python Agents

The digital-agency/ directory contains Python-based AI agents organized by business domain. These agents are invoked by the worker-runner service via BullMQ jobs and communicate through a standardized protocol.

---

## Tech Stack

| Category          | Technology                                        |
|-------------------|---------------------------------------------------|
| Monorepo          | Nx                                                |
| Backend Framework | NestJS (TypeScript)                               |
| Frontend          | React + TypeScript + Vite                         |
| UI Components     | Tailwind CSS + shadcn/ui                          |
| Database ORM      | TypeORM / Prisma                                  |
| Database          | PostgreSQL                                        |
| Cache/Messaging   | Redis                                             |
| Job Queue         | BullMQ                                            |
| Agent Runtime     | Python 3.11+                                      |
| Containerization  | Docker + Docker Compose                           |
| API Documentation | OpenAPI / Swagger                                 |
| Testing           | Jest (TS), Pytest (Python)                        |

---

## Quick Start

The fastest way to get FunnelAgents running locally:

```bash
# 1. Install dependencies
make install

# 2. Copy environment config
cp .env.example .env

# 3. Start everything (Docker infra + NestJS services + Web UI)
make up
```

Access points:
- **Web UI:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **n8n Workflows:** http://localhost:5678
- **API Docs:** http://localhost:3000/api/docs

Default test user credentials:
- Email: `admin@funnelagents.com`
- Password: `admin123`

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ (or pnpm 8+)
- Docker and Docker Compose
- Python 3.11+ (for AI agents, optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/funnel-agents.git
   cd funnel-agents
   ```

2. **Install dependencies**

   ```bash
   make install
   # Or manually:
   npm install
   cd apps/web-ui && npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   cp apps/web-ui/.env.example apps/web-ui/.env
   ```

   Key variables in `.env`:
   ```env
   # Database (matches Docker PostgreSQL)
   DATABASE_URL=postgresql://funnel_agents:secret@localhost:5432/funnel_agents
   DB_USERNAME=funnel_agents
   DB_PASSWORD=secret

   # Redis (Docker uses 6380 externally to avoid conflicts)
   REDIS_HOST=localhost
   REDIS_PORT=6380

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start infrastructure (PostgreSQL + Redis)**

   ```bash
   make docker-infra
   # Or: cd infrastructure/docker && docker compose up -d postgres redis
   ```

5. **Seed the database (optional)**

   ```bash
   make db-seed-users  # Creates test users
   ```

### Running Services

**Start everything (recommended):**

```bash
make up
```

This starts:
- PostgreSQL & Redis (Docker)
- All NestJS microservices
- Web UI (Vite dev server)
- n8n workflow automation

**Start only what you need:**

```bash
# Infrastructure only
make up-infra

# Backend services only (requires infra)
make up-services

# Web UI only
make up-web

# Minimal setup (gateway + auth + tasks)
make up-minimal
```

**Individual services:**

```bash
make dev-gateway    # API Gateway (port 3000)
make dev-auth       # Auth Service (port 3001)
make dev-crm        # CRM Service (port 3002)
make dev-web        # Web UI (port 5173)
```

**Docker Compose (full containerized stack):**

```bash
make up-services-docker
# Or: cd infrastructure/docker && docker compose up -d
```

### Backend Toggle (Base44 vs NestJS)

The web-ui can connect to either backend:

```bash
# In apps/web-ui/.env
VITE_BACKEND_MODE=nestjs  # Use local NestJS microservices
# or
VITE_BACKEND_MODE=base44  # Use Base44 external platform
```

See [Dual-Backend Architecture](docs/architecture/dual-backend-architecture.md) for details.

### Development Workflow

```bash
# Generate a new NestJS service
pnpm nx g @nx/nest:application apps/backend/my-service

# Generate a new library
pnpm nx g @nx/nest:library libs/my-library

# Run tests
pnpm nx test domain
pnpm nx run-many -t test

# Build for production
pnpm nx build api-gateway --prod

# View dependency graph
pnpm nx graph
```

---

## Project Structure

```
funnel-agents/
|
|-- apps/                              # Nx applications
|   |-- backend/                       # NestJS microservices
|   |   |-- api-gateway/               # Main API entry point
|   |   |   |-- src/
|   |   |   |   |-- main.ts
|   |   |   |   |-- app.module.ts
|   |   |   |   |-- controllers/
|   |   |   |   |-- guards/
|   |   |   |   +-- filters/
|   |   |   |-- project.json
|   |   |   +-- tsconfig.json
|   |   |-- auth/                      # Authentication service
|   |   |-- crm/                       # CRM service
|   |   |-- campaigns/                 # Campaigns service
|   |   |-- content/                   # Content library service
|   |   |-- agents/                    # Agent registry service
|   |   |-- tasks/                     # Task management service
|   |   |-- automations/               # Automation workflows service
|   |   |-- reports/                   # Reporting service
|   |   |-- worker-runner/             # BullMQ job processor
|   |   +-- scheduler/                 # Scheduled jobs service
|   |
|   +-- web/                           # React frontend
|       |-- src/
|       |   |-- app/
|       |   |-- components/
|       |   |-- features/
|       |   |-- hooks/
|       |   |-- lib/
|       |   +-- pages/
|       |-- public/
|       |-- index.html
|       +-- project.json
|
|-- libs/                              # Shared libraries
|   |-- domain/                        # Domain models and business logic
|   |   +-- src/
|   |       |-- lib/
|   |       |   |-- clients/           # Client entity and value objects
|   |       |   |-- campaigns/         # Campaign domain
|   |       |   |-- crm/               # CRM domain (leads, contacts, deals)
|   |       |   |-- content/           # Content domain
|   |       |   |-- agents/            # Agent domain
|   |       |   |-- tasks/             # Task domain
|   |       |   |-- automations/       # Automation domain
|   |       |   |-- reports/           # Report domain
|   |       |   +-- shared-kernel/     # Shared domain primitives
|   |       +-- index.ts
|   |
|   |-- application/                   # Application layer
|   |   +-- src/
|   |       |-- lib/
|   |       |   |-- use-cases/         # Application use cases
|   |       |   |-- services/          # Application services
|   |       |   +-- dtos/              # Data transfer objects
|   |       +-- index.ts
|   |
|   |-- infrastructure/                # Infrastructure layer
|   |   +-- src/
|   |       |-- lib/
|   |       |   |-- database/          # TypeORM/Prisma configs
|   |       |   |-- messaging/         # Redis, BullMQ setup
|   |       |   |-- integrations/      # External API clients
|   |       |   +-- repositories/      # Repository implementations
|   |       +-- index.ts
|   |
|   |-- interfaces/                    # Shared interfaces
|   |   +-- src/
|   |       |-- lib/
|   |       |   |-- api/               # API contracts
|   |       |   |-- events/            # Event schemas
|   |       |   +-- messages/          # Message contracts
|   |       +-- index.ts
|   |
|   +-- shared/                        # Common utilities
|       +-- src/
|           |-- lib/
|           |   |-- utils/             # Helper functions
|           |   |-- constants/         # Shared constants
|           |   +-- types/             # Common TypeScript types
|           +-- index.ts
|
|-- digital-agency/                    # Python AI agents
|   |-- agents/
|   |   |-- 01_offer/
|   |   |-- 02_marketing/
|   |   |-- 03_sales/
|   |   |-- 04_fulfillment/
|   |   |-- 05_feedback_loop/
|   |   |-- 06_business_dev/
|   |   |-- 06_operations/
|   |   |-- 07_customer_support/
|   |   |-- 08_leadership/
|   |   |-- 09_innovation/
|   |   +-- 10_enablement/
|   |-- api/                           # Python API layer
|   |-- core/                          # Shared Python utilities
|   |-- infrastructure/                # Deployment configs
|   |-- docs/                          # Agent documentation
|   +-- requirements.txt
|
|-- agent-orchestrator-ui/             # Agent orchestration dashboard
|   |-- src/
|   +-- package.json
|
|-- multi-agents-orchestration/        # Multi-agent coordination system
|   |-- docs/
|   +-- ...
|
|-- tools/                             # Build and dev tools
|-- docker-compose.yml                 # Container orchestration
|-- nx.json                            # Nx configuration
|-- package.json                       # Root package.json
|-- tsconfig.base.json                 # Base TypeScript config
+-- README.md                          # This file
```

---

## Key Concepts

### Clients

- A **Client** is a workspace.
- Each client has its own campaigns, pipelines, content, and reporting.
- Switching client in the header filters everything in the app to that workspace.

### Campaigns

- A **Campaign** groups all work for a specific initiative (e.g., *Q1 LinkedIn Lead Gen*).
- Inside a campaign you attach:
  - Objectives and KPIs
  - Assigned agents (Content, Ads, Lead Qualifier, etc.)
  - Tasks and automations that should run for that initiative
- Campaigns bridge **client goals** and **day-to-day tasks**.

### CRM: Leads, Contacts, Deals

- **Leads** - Early-stage people or accounts not yet qualified.
- **Contacts** - People tied to clients, deals, or campaigns.
- **Deals** - Opportunities you are trying to win.
- Pipelines are simple on purpose: enough structure to report on progress without turning into a full CRM product.

### Content Library

Central hub for all reusable assets:

- Posts, emails, ad copy, landing page snippets, docs
- Status: Draft -> In Review -> Published
- Filters by **type**, **status**, and **campaign usage**
- Designed so agents and humans both pull from the same source of truth.

### Agents (Domain Specialists)

Each agent:

- Has a **clear responsibility**.
- Uses a **fixed set of tools** (APIs, docs, templates, scripts).
- Can be reused across campaigns.
- Is executed via BullMQ jobs processed by the worker-runner service.

### Tasks Command Center

- Unified queue of all work being executed by agents.
- Columns for **Pending**, **Running**, **Completed**, **Failed**.
- Each task stores:
  - Agent
  - Client and campaign
  - Priority and status
  - Input data and outputs
- Designed to answer: *"What is running right now, for which client, and is it working?"*

### Automations

Visual workflows that chain agents and tasks:

- Trigger types: manual, schedule, or event-based.
- Nodes can:
  - Run an agent
  - Create/update tasks, leads, or content
  - Call external webhooks or integrations
- Each workflow shows:
  - Node count
  - Run history
  - Success rate

### Reports

- Task volume over time
- Success vs failure trends
- Top-performing agents
- Domain-level health (Offer, Marketing, Sales, etc.)
- Token/usage and cost trends (if you connect metering)

Reports are built for **operations questions**, not vanity metrics.

---

## Agent Domains

Agents are organized into 11 business domains:

### 01 Offer

Competitive analysis and value proposition development.

| Agent                      | Responsibility                              |
|----------------------------|---------------------------------------------|
| Competitor Analyst         | Analyze competitor strategies and positioning |
| Market Researcher          | Gather market intelligence and trends       |
| Pricing Strategist         | Develop pricing models and strategies       |
| Proposal Writer            | Create compelling proposals and pitches     |
| Service Designer           | Design service packages and offerings       |
| Value Proposition Creator  | Craft unique value propositions             |

### 02 Marketing

Content creation and marketing execution.

| Agent                | Responsibility                              |
|----------------------|---------------------------------------------|
| Ads Manager          | Manage paid advertising campaigns           |
| Brand Designer       | Create brand assets and guidelines          |
| Content Creator      | Produce marketing content                   |
| Email Marketer       | Design and execute email campaigns          |
| SEO Specialist       | Optimize content for search engines         |
| Social Media Manager | Manage social media presence                |

### 03 Sales

Lead qualification and deal closing.

| Agent               | Responsibility                              |
|---------------------|---------------------------------------------|
| Discovery Specialist| Conduct discovery calls and research        |
| Demo Presenter      | Deliver product demonstrations              |
| Lead Qualifier      | Score and qualify incoming leads            |
| Negotiator          | Handle contract negotiations                |
| Deal Closer         | Drive deals to completion                   |
| Objection Handler   | Address prospect objections                 |

### 04 Fulfillment

Project delivery and client success.

| Agent                | Responsibility                              |
|----------------------|---------------------------------------------|
| Account Manager      | Manage ongoing client relationships         |
| Project Manager      | Coordinate project execution                |
| Creative Producer    | Oversee creative deliverables               |
| Delivery Coordinator | Manage delivery timelines                   |
| Client Reporter      | Generate client-facing reports              |
| Quality Checker      | Ensure deliverable quality                  |

### 05 Feedback Loop

Analytics and continuous improvement.

| Agent                        | Responsibility                              |
|------------------------------|---------------------------------------------|
| Analytics Specialist         | Analyze performance data                    |
| Client Feedback Manager      | Collect and process client feedback         |
| Knowledge Manager            | Maintain organizational knowledge base      |
| Market Intelligence Analyst  | Monitor market changes and opportunities    |
| Process Optimizer            | Identify and implement process improvements |
| Strategy Advisor             | Provide strategic recommendations           |

### 06 Business Development

Growth and partnership development.

| Agent               | Responsibility                              |
|---------------------|---------------------------------------------|
| Alliance Builder    | Develop strategic alliances                 |
| Channel Developer   | Build distribution channels                 |
| Ecosystem Mapper    | Map industry ecosystem and opportunities    |
| Growth Strategist   | Develop growth strategies                   |
| Market Expander     | Identify new market opportunities           |
| Partnership Manager | Manage partner relationships                |

### 07 Operations

Internal operations and administration.

| Agent              | Responsibility                              |
|--------------------|---------------------------------------------|
| Compliance Officer | Ensure regulatory compliance                |
| Finance Manager    | Manage financial operations                 |
| HR Specialist      | Handle human resources functions            |
| IT Support         | Provide technical support                   |
| Legal Coordinator  | Coordinate legal matters                    |
| Office Manager     | Manage office operations                    |

### 08 Customer Support

Customer service and technical support.

| Agent                    | Responsibility                              |
|--------------------------|---------------------------------------------|
| Help Desk Agent          | Handle first-line support requests          |
| Escalation Coordinator   | Manage support escalations                  |
| Support Specialist       | Provide specialized support                 |
| Technical Support        | Resolve technical issues                    |
| Bug Tracker              | Track and manage bug reports                |
| Documentation Specialist | Create support documentation                |
| Knowledge Base Curator   | Maintain self-service knowledge base        |
| Retention Specialist     | Prevent customer churn                      |
| Satisfaction Tracker     | Monitor customer satisfaction               |
| Community Manager        | Manage customer community                   |
| User Training Coordinator| Coordinate user training programs           |

### 09 Leadership

Strategic direction and decision support.

| Agent                    | Responsibility                              |
|--------------------------|---------------------------------------------|
| CEO Strategy Director    | Support executive strategy                  |
| Operations Director      | Oversee operational excellence              |
| Performance Manager      | Track organizational performance            |
| Decision Support Analyst | Provide data-driven decision support        |
| Board Relations Manager  | Manage board communications                 |
| Vision Architect         | Develop and communicate company vision      |

### 10 Innovation

Research and experimentation.

| Agent                 | Responsibility                              |
|-----------------------|---------------------------------------------|
| Competitive Researcher| Research competitive innovations            |
| Market Experimenter   | Run market experiments                      |
| New Service Tester    | Test new service concepts                   |
| Pilot Program Manager | Manage pilot programs                       |
| Process Innovator     | Develop process innovations                 |
| Tool Evaluator        | Evaluate new tools and technologies         |

### 11 Enablement

Training and organizational development.

| Agent                  | Responsibility                              |
|------------------------|---------------------------------------------|
| Culture Builder        | Foster organizational culture               |
| Knowledge Curator      | Curate learning resources                   |
| Onboarding Coordinator | Manage employee onboarding                  |
| Performance Developer  | Develop performance improvement programs    |
| Recruiting Specialist  | Support talent acquisition                  |
| Training Specialist    | Deliver training programs                   |

---

## Development Workflow

### Common Nx Commands

```bash
# View project graph
pnpm nx graph

# Run affected tests
pnpm nx affected -t test

# Build all projects
pnpm nx run-many -t build

# Generate new service
pnpm nx g @nx/nest:application apps/backend/my-service

# Generate new library
pnpm nx g @nx/js:library libs/my-lib
```

### Working with Agents

```bash
# Run a specific agent
cd digital-agency
python -m agents.02_marketing.content_creator.main --task "Create blog post"

# Run agent tests
pytest agents/02_marketing/content_creator/tests/
```

### Database Operations

```bash
# Generate migration
pnpm nx run api-gateway:migration:generate -- -n MigrationName

# Run migrations
pnpm nx run api-gateway:migration:run

# Revert last migration
pnpm nx run api-gateway:migration:revert
```

---

## API Reference

API documentation is available via Swagger UI when running the API Gateway:

```
http://localhost:3000/api/docs
```

Key endpoints:

| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| POST   | /api/auth/register        | Register new user        |
| POST   | /api/auth/login           | Authenticate user        |
| GET    | /api/auth/me              | Get current user profile |
| GET    | /api/agents               | List available agents    |
| GET    | /api/tasks                | List tasks               |
| POST   | /api/tasks/:id/execute    | Execute a task           |
| GET    | /api/leads                | List CRM leads           |
| GET    | /api/campaigns            | List campaigns           |
| GET    | /api/workflows            | List automations         |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Auth Service API](docs/api/auth-service-api.md) | Complete authentication API reference |
| [Dual-Backend Architecture](docs/architecture/dual-backend-architecture.md) | How the Base44/NestJS toggle works |
| [Docker Setup](infrastructure/docker/README.md) | Container orchestration guide |

---

## Testing

```bash
# Run all tests
make test

# Test specific service
npx nx test auth-service

# Run with coverage
make test-coverage

# Run affected tests only
make test-affected
```

---

## Troubleshooting

### Database Connection Failed

If you see `password authentication failed for user`:

1. Check your `.env` matches Docker credentials:
   ```env
   DB_USERNAME=funnel_agents
   DB_PASSWORD=secret
   ```

2. Restart the PostgreSQL container:
   ```bash
   cd infrastructure/docker && docker compose restart postgres
   ```

### Port Already in Use

Services use these default ports:

| Service | Port |
|---------|------|
| API Gateway | 3000 |
| Auth Service | 3001 |
| CRM Service | 3002 |
| Web UI | 5173 |
| PostgreSQL | 5432 |
| Redis | 6380 |

Kill conflicting processes:
```bash
lsof -i :3000 | awk 'NR>1 {print $2}' | xargs kill -9
```

### TypeScript Errors

```bash
# Reset Nx cache
make reset

# Rebuild all
make clean && make build
```

---

## License

Copyright (c) 2024. All rights reserved.
