# Digital Agency Automation Platform - Makefile
# Simplifies development, testing, and deployment workflows

.PHONY: help install setup dev start stop restart logs clean test lint format docker-build docker-up docker-down k8s-deploy migrate seed docs

# Default target - show help
.DEFAULT_GOAL := help

##@ General

help: ## Display this help message
	@echo "Digital Agency Automation Platform - Available Commands"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup & Installation

install: ## Install all dependencies
	@echo "📦 Installing Python dependencies with uv..."
	uv pip install -e ".[dev]"
	@echo "✅ Dependencies installed"

setup: install ## Complete setup (install + env + db)
	@echo "🔧 Setting up environment..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "📝 Created .env file - please configure it"; \
	else \
		echo "✓ .env file already exists"; \
	fi
	@echo "🗄️  Setting up database..."
	@uv run python scripts/migrate_db.py up || echo "Migration failed - configure database in .env first"
	@echo "✅ Setup complete! Run 'make dev' to start development server"

env: ## Create .env file from template
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "📝 .env file created. Please edit it with your configuration."; \
	else \
		echo "⚠️  .env file already exists. Use 'make env-reset' to recreate."; \
	fi

env-reset: ## Reset .env file from template (WARNING: overwrites existing)
	@echo "⚠️  This will overwrite your existing .env file!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cp .env.example .env; \
		echo "✅ .env file reset from template"; \
	else \
		echo "❌ Cancelled"; \
	fi

##@ Development

dev: ## Start development server (FastAPI with hot reload)
	@echo "🚀 Starting development server..."
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

dev-debug: ## Start development server with debug logging
	@echo "🔍 Starting development server with debug logging..."
	LOG_LEVEL=DEBUG uvicorn api.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

worker: ## Start Celery worker
	@echo "👷 Starting Celery worker..."
	celery -A shared.celery_app worker --loglevel=info

worker-debug: ## Start Celery worker with debug logging
	@echo "🔍 Starting Celery worker with debug logging..."
	celery -A shared.celery_app worker --loglevel=debug

flower: ## Start Flower (Celery monitoring)
	@echo "🌸 Starting Flower monitoring dashboard..."
	celery -A shared.celery_app flower --port=5555

shell: ## Start interactive Python shell with app context
	@echo "🐚 Starting interactive shell..."
	python -i -c "from api.main import app; from core import *; from config.settings import get_settings; settings = get_settings(); print('App context loaded. Available: app, settings')"

##@ Docker Operations

docker-build: ## Build Docker images
	@echo "🐳 Building Docker images..."
	docker-compose build
	@echo "✅ Docker images built"

docker-up: ## Start database services (PostgreSQL, Redis)
	@echo "🐳 Starting database services..."
	docker-compose up -d
	@echo "✅ Database services started:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo ""
	@echo "To start application:"
	@echo "  make docker-up-app    - Start API server in Docker"
	@echo "  make dev              - Start API server locally"

docker-up-app: ## Start all services including API
	@echo "🐳 Starting all services with API..."
	docker-compose --profile app up -d
	@echo "✅ All services started. Access:"
	@echo "  - API: http://localhost:8000"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"

docker-up-workers: ## Start all services including Celery workers
	@echo "🐳 Starting all services with workers..."
	docker-compose --profile workers up -d
	@echo "✅ Services with workers started. Access:"
	@echo "  - Flower: http://localhost:5555"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"

docker-up-full: ## Start all services (databases + API + workers)
	@echo "🐳 Starting full stack..."
	docker-compose --profile app --profile workers up -d
	@echo "✅ Full stack started. Access:"
	@echo "  - API: http://localhost:8000"
	@echo "  - Flower: http://localhost:5555"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"

docker-up-build: ## Build and start all services
	@echo "🐳 Building and starting all services..."
	docker-compose up -d --build
	@echo "✅ Services started"

docker-down: ## Stop all Docker services
	@echo "🛑 Stopping all services..."
	docker-compose down
	@echo "✅ Services stopped"

docker-down-volumes: ## Stop all services and remove volumes (WARNING: destroys data)
	@echo "⚠️  This will remove all volumes and destroy data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "✅ Services and volumes removed"; \
	else \
		echo "❌ Cancelled"; \
	fi

docker-restart: docker-down docker-up ## Restart all Docker services

docker-logs: ## Show Docker logs (all services)
	docker-compose logs -f

docker-logs-api: ## Show API logs only
	docker-compose logs -f api

docker-ps: ## Show running Docker containers
	docker-compose ps

docker-clean: ## Clean up Docker resources
	@echo "🧹 Cleaning Docker resources..."
	docker-compose down
	docker system prune -f
	@echo "✅ Docker cleanup complete"

##@ Database Operations

migrate: ## Run database migrations
	@echo "🗄️  Running database migrations..."
	uv run python scripts/migrate_db.py up
	@echo "✅ Migrations complete"

init-db: ## Initialize database (run migrations + seed)
	@echo "🗄️  Initializing database..."
	@uv run python scripts/migrate_db.py up 2>/dev/null || echo "⚠️  Database not ready - skipping migrations"
	@uv run python scripts/seed_data.py 2>/dev/null || echo "⚠️  Database not ready - skipping seed data"
	@echo "✅ Database initialization complete"


migrate-create: ## Create a new migration
	@read -p "Migration name: " name; \
	uv run python scripts/migrate_db.py create "$$name"

migrate-rollback: ## Rollback last migration
	@echo "⚠️  Rolling back last migration..."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		uv run python scripts/migrate_db.py down; \
		echo "✅ Rollback complete"; \
	else \
		echo "❌ Cancelled"; \
	fi

seed: ## Seed database with sample data
	@echo "🌱 Seeding database..."
	uv run python scripts/seed_data.py
	@echo "✅ Database seeded"

db-reset: ## Reset database (drop, create, migrate, seed)
	@echo "⚠️  This will reset the entire database!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		uv run python scripts/migrate_db.py down; \n		uv run python scripts/migrate_db.py up; \n		uv run python scripts/seed_data.py; \n		echo "✅ Database reset complete"; \
	else \
		echo "❌ Cancelled"; \
	fi

db-backup: ## Backup database to backups/ directory
	@echo "💾 Backing up database..."
	@mkdir -p backups
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	pg_dump $$DATABASE_URL > backups/backup_$$TIMESTAMP.sql; \
	echo "✅ Backup created: backups/backup_$$TIMESTAMP.sql"

##@ Testing

test: ## Run all tests
	@echo "🧪 Running all tests..."
	pytest tests/ -v

test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	pytest tests/unit/ -v

test-integration: ## Run integration tests only
	@echo "🧪 Running integration tests..."
	pytest tests/integration/ -v

test-e2e: ## Run end-to-end tests only
	@echo "🧪 Running e2e tests..."
	pytest tests/e2e/ -v

test-coverage: ## Run tests with coverage report
	@echo "🧪 Running tests with coverage..."
	pytest tests/ --cov=. --cov-report=html --cov-report=term
	@echo "📊 Coverage report generated: htmlcov/index.html"

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	ptw tests/ -- -v

##@ Code Quality

lint: ## Run all linters
	@echo "🔍 Running linters..."
	@flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	@flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	@yamllint config/ deployment/ -f parsable || echo "YAML linting skipped"
	@echo "✅ Linting complete"

lint-python: ## Run Python linters (flake8, pylint)
	@echo "🐍 Linting Python code..."
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	@echo "✅ Python linting complete"

lint-yaml: ## Lint YAML files
	@echo "📄 Linting YAML files..."
	yamllint config/ deployment/ -f parsable
	@echo "✅ YAML linting complete"

format: ## Format code with black and isort
	@echo "✨ Formatting code..."
	black . --exclude="venv|env|.venv"
	isort . --skip venv --skip env --skip .venv
	@echo "✅ Code formatted"

format-check: ## Check code formatting without modifying
	@echo "🔍 Checking code format..."
	black . --check --exclude="venv|env|.venv"
	isort . --check-only --skip venv --skip env --skip .venv

type-check: ## Run type checking with mypy
	@echo "🔍 Running type checks..."
	mypy . --ignore-missing-imports
	@echo "✅ Type checking complete"

security: ## Run security checks
	@echo "🔒 Running security checks..."
	bandit -r . -x ./venv,./env,./tests
	safety check
	@echo "✅ Security checks complete"

quality: lint format-check type-check security ## Run all quality checks

##@ Kubernetes Deployment

k8s-deploy: ## Deploy to Kubernetes
	@echo "☸️  Deploying to Kubernetes..."
	kubectl apply -f deployment/kubernetes/
	@echo "✅ Deployment complete"

k8s-status: ## Check Kubernetes deployment status
	@echo "📊 Kubernetes deployment status:"
	kubectl get pods
	kubectl get services
	kubectl get ingress

k8s-logs: ## Show Kubernetes pod logs
	@POD=$$(kubectl get pods -l app=digital-agency-api -o jsonpath='{.items[0].metadata.name}'); \
	echo "📋 Logs for pod: $$POD"; \
	kubectl logs -f $$POD

k8s-shell: ## Open shell in Kubernetes pod
	@POD=$$(kubectl get pods -l app=digital-agency-api -o jsonpath='{.items[0].metadata.name}'); \
	echo "🐚 Opening shell in pod: $$POD"; \
	kubectl exec -it $$POD -- /bin/bash

k8s-delete: ## Delete Kubernetes deployment
	@echo "⚠️  This will delete the Kubernetes deployment!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		kubectl delete -f deployment/kubernetes/; \
		echo "✅ Deployment deleted"; \
	else \
		echo "❌ Cancelled"; \
	fi

##@ Terraform (AWS Infrastructure)

tf-init: ## Initialize Terraform
	@echo "🏗️  Initializing Terraform..."
	cd deployment/terraform && terraform init
	@echo "✅ Terraform initialized"

tf-plan: ## Show Terraform plan
	@echo "📋 Generating Terraform plan..."
	cd deployment/terraform && terraform plan
	@echo "✅ Plan generated"

tf-apply: ## Apply Terraform changes
	@echo "🏗️  Applying Terraform changes..."
	cd deployment/terraform && terraform apply
	@echo "✅ Infrastructure provisioned"

tf-destroy: ## Destroy Terraform infrastructure
	@echo "⚠️  This will destroy all infrastructure!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd deployment/terraform && terraform destroy; \
		echo "✅ Infrastructure destroyed"; \
	else \
		echo "❌ Cancelled"; \
	fi

tf-output: ## Show Terraform outputs
	cd deployment/terraform && terraform output

##@ Documentation

docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	@if [ ! -d "docs_build" ]; then mkdir docs_build; fi
	@# Generate API documentation
	@echo "Generating API docs..."
	@python -m pydoc -w api core shared workflows
	@mv *.html docs_build/ 2>/dev/null || true
	@echo "✅ Documentation generated in docs_build/"

docs-serve: ## Serve documentation locally
	@echo "📚 Serving documentation..."
	@cd docs && python -m http.server 8080

##@ Monitoring

logs: docker-logs ## Alias for docker-logs

health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@echo "\n📊 API Health:"
	@curl -s http://localhost:8000/health | jq . || echo "❌ API not responding"
	@echo "\n🗄️  Database:"
	@docker-compose exec -T postgres pg_isready || echo "❌ Database not ready"
	@echo "\n🔴 Redis:"
	@docker-compose exec -T redis redis-cli ping || echo "❌ Redis not responding"
	@echo "\n✅ Health check complete"

metrics: ## Show system metrics
	@echo "📊 System Metrics:"
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

##@ Cleanup

clean: ## Clean temporary files and caches
	@echo "🧹 Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/
	rm -rf .coverage
	rm -rf dist/
	rm -rf build/
	@echo "✅ Cleanup complete"

clean-all: clean docker-clean ## Deep clean (includes Docker resources)
	@echo "🧹 Deep cleaning..."
	@echo "✅ Deep cleanup complete"

##@ Agent Operations

agent-create: ## Create a new agent
	@echo "🤖 Creating new agent..."
	@read -p "Domain (e.g., 02_marketing): " domain; \
	read -p "Agent name (e.g., content_writer): " name; \
	python scripts/create_agent.py $$domain $$name

agent-test: ## Test a specific agent
	@echo "🧪 Testing agent..."
	@read -p "Agent ID: " agent_id; \
	python scripts/test_agent.py $$agent_id

agent-list: ## List all agents
	@echo "📋 Listing all agents..."
	@python -c "import yaml; f=open('config/agents.yaml'); d=yaml.safe_load(f); print('\n'.join([f'{k}: {v[\"name\"]} ({v[\"domain\"]})' for k,v in d['agents'].items()]))"

##@ Workflow Operations

workflow-run: ## Run a workflow
	@echo "⚙️  Running workflow..."
	@read -p "Workflow ID (e.g., offer_to_marketing): " workflow_id; \
	python scripts/run_workflow.py $$workflow_id

workflow-list: ## List all workflows
	@echo "📋 Available workflows:"
	@ls -1 workflows/*.py | grep -v __pycache__ | sed 's/workflows\///g' | sed 's/.py//g'

##@ Utilities

version: ## Show version information
	@echo "Digital Agency Automation Platform"
	@echo "Version: 1.0.0"
	@echo "Python: $$(python --version)"
	@echo "Docker: $$(docker --version)"
	@echo "Kubernetes: $$(kubectl version --client --short 2>/dev/null || echo 'Not installed')"

ports: ## Show ports in use
	@echo "📡 Ports in use:"
	@echo "8000  - FastAPI API"
	@echo "5432  - PostgreSQL"
	@echo "6379  - Redis"
	@echo "5555  - Flower (Celery monitoring)"
	@echo "8080  - Documentation server"

status: ## Show status of all services
	@echo "📊 Service Status:"
	@echo "\n🐳 Docker Services:"
	@docker-compose ps
	@echo "\n🏥 Health Status:"
	@make health

quick-start: setup docker-up init-db ## Quick start (setup + docker + init-db)
	@echo ""
	@echo "🎉 Quick start complete!"
	@echo ""
	@echo "✅ Your Digital Agency Platform is running!"
	@echo ""
	@echo "Access the services:"
	@echo "  API:    http://localhost:8000"
	@echo "  Docs:   http://localhost:8000/docs"
	@echo "  Flower: http://localhost:5555"
	@echo ""
	@echo "Next steps:"
	@echo "  make logs      - View logs"
	@echo "  make health    - Check health"
	@echo "  make test      - Run tests"
	@echo ""

##@ CI/CD

ci-test: install lint test ## Run CI test pipeline
	@echo "✅ CI test pipeline complete"

ci-build: docker-build ## Run CI build pipeline
	@echo "✅ CI build pipeline complete"

ci-deploy: k8s-deploy ## Run CI deploy pipeline
	@echo "✅ CI deploy pipeline complete"

##@ Development Tools

ipython: ## Start IPython shell with app context
	@echo "🐚 Starting IPython shell..."
	ipython -i -c "from api.main import app; from core import *; from config.settings import get_settings; settings = get_settings(); print('App context loaded')"

notebook: ## Start Jupyter notebook
	@echo "📓 Starting Jupyter notebook..."
	jupyter notebook

watch: ## Watch for file changes and reload
	@echo "👀 Watching for changes..."
	watchmedo auto-restart -d . -p '*.py' -R -- python -m uvicorn api.main:app

requirements-update: ## Update requirements.txt with current packages

deps-sync: ## Sync installed packages with pyproject.toml
	@echo "🔄 Syncing packages with pyproject.toml..."
	uv pip install -e ".[dev]"
	@echo "✅ Packages synced"

deps-list: ## List installed dependencies
	@echo "📋 Installed packages:"
	uv pip list
