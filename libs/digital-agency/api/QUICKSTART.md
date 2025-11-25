# Quick Start Guide

Get the Digital Agency Python API up and running in minutes.

## Prerequisites

- Python 3.10+ installed
- Redis (optional for Celery features)
- Git

## Installation

### 1. Clone and Navigate

```bash
cd /path/to/codehornets-ai/libs/digital-agency/api
```

### 2. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

### 4. Start the API

```bash
# Using the start script
./start.sh

# Or manually
uvicorn api.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## Quick Test

```bash
# Check health
curl http://localhost:8000/api/v1/health

# List all agents
curl http://localhost:8000/api/v1/agents

# List domains
curl http://localhost:8000/api/v1/agents/domains
```

## Using Docker (Recommended)

```bash
# Start all services (API + Redis + Celery + Flower)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

Services:
- API: http://localhost:8000
- Flower (Celery monitoring): http://localhost:5555

## Execute an Agent

```bash
curl -X POST http://localhost:8000/api/v1/agents/offer/proposal_writer/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input_data": {
      "client_info": {
        "name": "Acme Corp",
        "industry": "Technology"
      },
      "service_package": {
        "name": "Digital Transformation",
        "pricing": {"total": 50000}
      }
    },
    "timeout": 300
  }'
```

## Using Make Commands

```bash
make install      # Install dependencies
make dev          # Start development server
make test         # Run tests
make docker-up    # Start Docker services
make celery       # Start Celery worker
make flower       # Start Flower monitoring
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov-report=html

# Run specific test
pytest tests/test_agent_executor.py -v
```

## Common Issues

### Redis Connection Error

If you see Redis connection errors:

```bash
# Start Redis with Docker
docker run -d -p 6379:6379 redis:7-alpine redis-server --requirepass redis_password

# Or use docker-compose
docker-compose up -d redis
```

### Agent Not Found

If agents aren't discovered:

```bash
# Check agent directory
ls -la ../agents/

# Run discovery manually
python -c "from api.core import AgentDiscovery; d = AgentDiscovery(); d.discover_agents(); print(d.list_domains())"
```

### Import Errors

Make sure you're in the correct directory and PYTHONPATH is set:

```bash
# From digital-agency root
cd /path/to/codehornets-ai/libs/digital-agency
export PYTHONPATH=$(pwd)

# Or from api directory
cd api
export PYTHONPATH=$(pwd)/..
```

## Next Steps

1. **Explore the API**: Visit http://localhost:8000/docs
2. **Read the README**: Check `README.md` for detailed documentation
3. **Try Examples**: Execute different agents with various inputs
4. **Add Authentication**: Configure JWT tokens in production
5. **Monitor with Flower**: Visit http://localhost:5555 when using Celery

## Production Deployment

```bash
# Using Gunicorn with multiple workers
gunicorn api.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 300

# Or with Docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f` or `tail -f logs/api.log`
2. Run tests: `pytest -v`
3. Check health endpoint: `curl http://localhost:8000/api/v1/health`
