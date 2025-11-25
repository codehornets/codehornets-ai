# Digital Agency AI Platform

## Overview

A comprehensive AI-powered digital agency platform built with multi-agent architecture, orchestrating specialized AI agents across 10 business domains to deliver automated marketing, sales, and operational solutions.

## Architecture

This platform leverages Claude AI and a sophisticated multi-agent system to handle:

- **Lead Generation & Qualification** - Automated prospecting and lead scoring
- **Client Communication** - Intelligent email and messaging automation
- **Content Creation** - AI-generated marketing content across channels
- **Social Media Management** - Automated scheduling and engagement
- **Ad Campaign Management** - Dynamic campaign optimization
- **SEO & Analytics** - Search optimization and performance tracking
- **CRM Integration** - Unified customer data management
- **Project Management** - Automated task coordination
- **Reporting & Insights** - Real-time dashboards and analytics
- **Quality Assurance** - Automated testing and validation

## Tech Stack

- **Backend**: Python (FastAPI)
- **AI Engine**: Anthropic Claude API
- **Task Queue**: Celery with Redis
- **Database**: SQLAlchemy (PostgreSQL/MySQL)
- **Frontend**: Node.js/React
- **Infrastructure**: Docker, Docker Compose
- **Integrations**: HubSpot, Google Workspace, Slack, various CRMs

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Redis

### Installation

1. Clone the repository:
```bash
cd C:\workspace\@ornomedia-ai\digital-agency
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Install Node.js dependencies:
```bash
npm install
```

5. Start services with Docker:
```bash
docker-compose up -d
```

6. Run database migrations:
```bash
python -m alembic upgrade head
```

7. Start the application:
```bash
uvicorn main:app --reload
```

## Project Structure

```
digital-agency/
├── config/          # Configuration and settings
├── core/            # Core agent framework
├── shared/          # Shared utilities and integrations
├── domains/         # Domain-specific agent implementations
├── api/             # REST API endpoints
├── tasks/           # Celery task definitions
├── frontend/        # React frontend application
├── tests/           # Test suites
└── docs/            # Documentation
```

## Configuration

Edit `.env` file with your API keys and configuration:

- `ANTHROPIC_API_KEY` - Your Claude API key
- `HUBSPOT_API_KEY` - HubSpot integration
- `GOOGLE_API_KEY` - Google services integration
- `SLACK_WEBHOOK_URL` - Slack notifications
- Database connection strings
- Redis connection details

## Development

### Running Tests

```bash
pytest tests/
```

### Code Formatting

```bash
black .
flake8 .
```

### API Documentation

Access Swagger UI at: `http://localhost:8000/docs`

## Agent Domains

Each domain has specialized agents with specific capabilities:

1. **Lead Generation** - Prospect research, contact discovery, qualification
2. **Email Marketing** - Campaign creation, personalization, A/B testing
3. **Content Marketing** - Blog posts, whitepapers, social content
4. **Social Media** - Post scheduling, engagement monitoring, analytics
5. **Paid Advertising** - Campaign setup, bid optimization, reporting
6. **SEO** - Keyword research, on-page optimization, link building
7. **CRM Management** - Data enrichment, pipeline management, automation
8. **Project Coordination** - Task creation, timeline management, resource allocation
9. **Analytics** - Data collection, visualization, insights generation
10. **QA & Compliance** - Content review, brand compliance, performance validation

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact: support@ornomedia.ai
