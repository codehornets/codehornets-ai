# 🚀 Quick Start Guide

Get the Digital Agency Automation Platform running in under 5 minutes!

## Prerequisites

- Python 3.11+
- Docker & Docker Compose
- Make (optional but recommended)
- PostgreSQL (if running locally without Docker)
- Redis (if running locally without Docker)

---

## Option 1: Quick Start with Make (Recommended)

### 1. Clone and Setup

```bash
# Clone the repository (if not already)
cd digital-agency

# Run quick start (installs deps, creates .env, starts Docker)
make quick-start
```

### 2. Configure Environment

Edit `.env` file with your API keys:

```bash
# Required: Add your Anthropic API key
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional: Add other service keys
HUBSPOT_API_KEY=...
SENDGRID_API_KEY=...
```

### 3. Access the Platform

- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Flower (Celery)**: http://localhost:5555

### 4. Common Commands

```bash
make help          # Show all available commands
make logs          # View logs
make health        # Check service health
make test          # Run tests
make dev           # Start dev server (without Docker)
```

---

## Option 2: Manual Setup with Docker

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Create Environment File

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
python scripts/migrate_db.py
```

### 5. Verify

```bash
curl http://localhost:8000/health
```

---

## Option 3: Local Development (No Docker)

### 1. Install Dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 2. Start PostgreSQL and Redis

```bash
# Using Homebrew (Mac)
brew services start postgresql@15
brew services start redis

# Or using system services (Linux)
sudo systemctl start postgresql
sudo systemctl start redis
```

### 3. Create Database

```bash
createdb digital_agency
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with local database URLs:
# DATABASE_URL=postgresql://localhost/digital_agency
# REDIS_URL=redis://localhost:6379/0
```

### 5. Run Migrations

```bash
python scripts/migrate_db.py
```

### 6. Start Development Server

```bash
# Terminal 1: API Server
make dev

# Terminal 2: Celery Worker
make worker

# Terminal 3: Flower Monitoring (optional)
make flower
```

---

## Verification

### Health Check

```bash
# Using Make
make health

# Or manually
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T...",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "agents": "operational"
  }
}
```

### List All Agents

```bash
curl http://localhost:8000/api/agents | jq
```

### Run a Test Workflow

```bash
make workflow-run
# Choose: offer_to_marketing
```

---

## Next Steps

### 1. Explore the API

Visit http://localhost:8000/docs for interactive API documentation.

### 2. Test an Agent

```bash
curl -X POST http://localhost:8000/api/agents/market_researcher/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "analyze_market_trends",
    "parameters": {
      "industry": "SaaS",
      "region": "North America"
    }
  }'
```

### 3. Run the Full Pipeline

```bash
# Start with market research
# → Generate pricing strategy
# → Create marketing content
# → Qualify leads
# → Execute sales workflows
```

### 4. Monitor with Flower

Visit http://localhost:5555 to see:
- Active tasks
- Worker status
- Task history
- Performance metrics

---

## Common Issues

### Port Already in Use

```bash
# Check what's using port 8000
lsof -i :8000

# Kill the process or change API_PORT in .env
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart if needed
docker-compose restart postgres
```

### Redis Connection Error

```bash
# Verify Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping
```

### Permission Denied (Docker)

```bash
# Run with sudo or add user to docker group
sudo usermod -aG docker $USER
# Then logout and login again
```

---

## Development Workflow

### 1. Start Development Environment

```bash
make dev
```

### 2. Make Changes

Edit files in:
- `agents/` - Agent implementations
- `api/` - API endpoints
- `workflows/` - Workflow logic
- `config/` - Configuration

### 3. Test Changes

```bash
# Run tests
make test

# Run specific test
pytest tests/unit/test_agents.py -v

# Run with coverage
make test-coverage
```

### 4. Format Code

```bash
make format
```

### 5. Check Quality

```bash
make quality  # Runs lint + format-check + type-check + security
```

---

## Production Deployment

### Kubernetes

```bash
# Deploy to Kubernetes
make k8s-deploy

# Check status
make k8s-status

# View logs
make k8s-logs
```

### AWS with Terraform

```bash
# Initialize
make tf-init

# Plan infrastructure
make tf-plan

# Deploy
make tf-apply
```

---

## Getting Help

### Available Commands

```bash
make help
```

### Documentation

- Architecture: `docs/architecture.md`
- API Reference: `docs/api_reference.md`
- Agent Guide: `docs/agent_guide.md`
- Workflows: `docs/workflows.md`

### Logs

```bash
# All logs
make logs

# Specific service
make docker-logs-api
```

### Status

```bash
make status  # Shows all service status and health
```

---

## Success! 🎉

Your Digital Agency Automation Platform is now running!

**What's Next?**

1. ✅ Configure your API keys in `.env`
2. ✅ Explore the API at http://localhost:8000/docs
3. ✅ Test agents and workflows
4. ✅ Build your automations!

**Questions?**

- Check `make help` for all commands
- Review documentation in `docs/`
- View completion reports in root directory

Happy automating! 🚀
