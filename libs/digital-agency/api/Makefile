.PHONY: help install dev test clean docker-up docker-down format lint

help:
	@echo "Digital Agency Python API - Make Commands"
	@echo ""
	@echo "  make install      Install dependencies"
	@echo "  make dev          Run development server"
	@echo "  make test         Run tests"
	@echo "  make test-cov     Run tests with coverage"
	@echo "  make clean        Clean generated files"
	@echo "  make docker-up    Start Docker services"
	@echo "  make docker-down  Stop Docker services"
	@echo "  make format       Format code with black"
	@echo "  make lint         Run linters"
	@echo "  make celery       Start Celery worker"
	@echo "  make flower       Start Flower monitoring"

install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt

dev:
	@echo "🚀 Starting development server..."
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

test:
	@echo "🧪 Running tests..."
	pytest -v

test-cov:
	@echo "🧪 Running tests with coverage..."
	pytest --cov=api --cov-report=html --cov-report=term -v

clean:
	@echo "🧹 Cleaning generated files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf .pytest_cache htmlcov .coverage

docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down

docker-logs:
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

format:
	@echo "✨ Formatting code with black..."
	black api/ --line-length 100

lint:
	@echo "🔍 Running linters..."
	flake8 api/ --max-line-length 100
	mypy api/ --ignore-missing-imports

celery:
	@echo "⚙️  Starting Celery worker..."
	celery -A celery_app worker --loglevel=info

flower:
	@echo "🌸 Starting Flower monitoring..."
	celery -A celery_app flower --port=5555

agent-discovery:
	@echo "🔍 Discovering agents..."
	python -c "from api.core import AgentDiscovery; d = AgentDiscovery(); d.discover_agents(); print(f'Found {sum(len(a) for a in d.agents_catalog.values())} agents in {len(d.agents_catalog)} domains')"
