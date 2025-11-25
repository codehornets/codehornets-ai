# Quick Reference Guide

## 📚 Documentation Index

### Getting Started
- **[README.md](./README.md)** - Project overview and introduction
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Complete Docker setup guide
- **[MIGRATION.md](./MIGRATION.md)** - pyproject.toml migration details

### Organization & Structure
- **[ORGANIZATION_MINDMAP.md](./ORGANIZATION_MINDMAP.md)** - Complete organization mind map (Markdown)
- **[organization_mindmap.html](./organization_mindmap.html)** - Interactive visualization (Open in browser)

### Development
- **[Makefile](./Makefile)** - All available commands (run `make help`)
- **[pyproject.toml](./pyproject.toml)** - Project dependencies and configuration

---

## 🎯 Quick Commands

### Setup & Installation
```bash
make install         # Install dependencies
make setup           # Setup environment + .env
make docker-up       # Start databases
make migrate         # Run migrations
make dev             # Start development server
```

### Docker Operations
```bash
make docker-up           # Start PostgreSQL + Redis
make docker-up-app       # Start with API
make docker-up-full      # Start everything
make docker-down         # Stop services
make docker-logs         # View logs
```

### Database
```bash
make migrate             # Run migrations
make migrate-create      # Create new migration
make init-db             # Initialize database
make seed                # Seed database
```

### Development
```bash
make dev                 # Start API server
make worker              # Start Celery worker
make flower              # Start Flower (monitoring)
make test                # Run tests
make lint                # Run linters
make format              # Format code
```

---

## 🏢 Organization at a Glance

### 11 Domains | 72 AI Agents

1. **OFFER** (6 agents) - Market positioning & proposals
2. **MARKETING** (6 agents) - Demand generation
3. **SALES** (6 agents) - Lead conversion
4. **FULFILLMENT** (6 agents) - Service delivery
5. **FEEDBACK LOOP** (6 agents) - Continuous improvement
6. **BUSINESS DEV** (6 agents) - Growth & partnerships
7. **OPERATIONS** (6 agents) - Internal management
8. **CUSTOMER SUPPORT** (12 agents) - Client success
9. **LEADERSHIP** (6 agents) - Strategic direction
10. **INNOVATION** (6 agents) - Future development
11. **ENABLEMENT** (6 agents) - Team development

---

## 🔄 Core Workflows

### Lead to Client
Marketing → Qualifier → Discovery → Demo → Objections → Negotiation → Closing → Fulfillment

### Service Creation
Market Research → Design → Pricing → Positioning → Documentation → Marketing

### Continuous Improvement
Feedback → Analytics → Optimization → Strategy → Approval → Implementation

---

## 📊 Key Integrations

### External Services
- **Anthropic Claude** - AI agent intelligence
- **PostgreSQL** - Database (port 5432)
- **Redis** - Cache & message broker (port 6379)
- **HubSpot** - CRM integration
- **Google** - Analytics & APIs
- **Slack** - Team communication
- **SendGrid** - Email delivery
- **Sentry** - Error tracking

### API Endpoints
- **Main API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Flower (Celery)**: http://localhost:5555

---

## 🛠️ Agent Structure

Each agent follows this structure:
```
agent_name/
├── __init__.py
├── agent.py          # Main agent logic
├── config.yaml       # Agent configuration
├── prompts/          # AI prompts
├── tasks/            # Task definitions
├── tools/            # Agent tools
└── tests/            # Unit tests
```

### Example Agent Usage
```python
from agents.02_marketing.content_creator.agent import ContentCreatorAgent

agent = ContentCreatorAgent()
result = agent.write_blog(topic="AI in Marketing", length=1000)
```

---

## 📈 Success Metrics

### Offer Domain
- Market research accuracy: 95%+
- Proposal win rate: 40%+
- Margin improvement: 20%+

### Marketing Domain
- Lead generation: 1000+ MQLs/month
- Content engagement: 5%+ CTR
- Brand awareness: 50%+ recognition

### Sales Domain
- Conversion rate: 25%+
- Sales cycle: <30 days
- Average deal: $50K+

### Fulfillment Domain
- On-time delivery: 95%+
- Client satisfaction: 4.5/5+
- Profitability: 30%+ margin

---

## 🔧 Configuration Files

### Environment (.env)
```bash
# Core settings
DATABASE_URL=postgresql://digital_agency:password@localhost:5432/digital_agency
REDIS_URL=redis://:redis_password@localhost:6379/0
ANTHROPIC_API_KEY=sk-ant-api-xxxxx

# Optional integrations
HUBSPOT_API_KEY=pat-na1-xxxxx
GOOGLE_API_KEY=AIzaSyxxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxxxx
```

### Docker Compose Profiles
```bash
# Default: databases only
docker-compose up -d

# With API
docker-compose --profile app up -d

# With workers
docker-compose --profile workers up -d

# Everything
docker-compose --profile app --profile workers up -d
```

---

## 🚀 Common Tasks

### Add a New Agent
```bash
# Use the agent creation script
python scripts/create_agent.py <domain> <agent_name>

# Example
python scripts/create_agent.py 02_marketing video_creator
```

### Create a Database Migration
```bash
make migrate-create
# Enter migration name: create_agents_table
# Edit: data/migrations/TIMESTAMP_create_agents_table.sql
make migrate
```

### Run Tests
```bash
make test              # All tests
make test-unit         # Unit tests only
make test-integration  # Integration tests
make test-coverage     # With coverage report
```

### Code Quality
```bash
make lint              # Run linters
make format            # Auto-format code
make type-check        # Type checking
make security          # Security checks
```

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker-compose logs postgres

# Verify .env configuration
cat .env | grep DB_
```

### Port Already in Use
```bash
# Find what's using the port
netstat -ano | findstr :5432

# Kill the process
taskkill /F /PID <PID>
```

### Migration Errors
```bash
# Check migration status
python scripts/migrate_db.py status

# Rollback last migration
make migrate-rollback

# Re-run migrations
make migrate
```

### Import Errors
```bash
# Reinstall dependencies
make install

# Verify installation
uv pip list | grep digital-agency
```

---

## 📞 Support & Resources

### Documentation
- Main Docs: [README.md](./README.md)
- Organization: [ORGANIZATION_MINDMAP.md](./ORGANIZATION_MINDMAP.md)
- Docker Setup: [DOCKER_SETUP.md](./DOCKER_SETUP.md)

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Spec: http://localhost:8000/openapi.json

### Tools
- Flower (Celery): http://localhost:5555
- Database: localhost:5432
- Redis: localhost:6379

---

## 🎯 Next Steps

1. ✅ Review organization structure in [ORGANIZATION_MINDMAP.md](./ORGANIZATION_MINDMAP.md)
2. ✅ Set up development environment with [DOCKER_SETUP.md](./DOCKER_SETUP.md)
3. ✅ Configure API keys in `.env`
4. ✅ Start services: `make docker-up`
5. ✅ Run migrations: `make migrate`
6. ✅ Start development: `make dev`
7. ✅ Explore API docs: http://localhost:8000/docs

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
