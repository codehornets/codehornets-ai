# =============================================================================
# FunnelAgents - Docker Infrastructure Makefile
# =============================================================================
# Provides convenient commands for managing development and production environments

.PHONY: help dev prod build deploy backup restore health clean

# Default target
.DEFAULT_GOAL := help

# Configuration
DOCKER_DIR := $(shell pwd)
COMPOSE_DEV := docker-compose.yml
COMPOSE_PROD := docker-compose.prod.yml
ENV_DEV := .env.example
ENV_PROD := .env.production
SCRIPTS_DIR := ../scripts

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ Help

help: ## Display this help message
	@echo "$(BLUE)FunnelAgents Docker Infrastructure$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development Environment

dev-up: ## Start all services in development mode
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) up -d
	@echo "$(GREEN)Development environment started!$(NC)"
	@echo "API Gateway: http://localhost:3000"
	@echo "Web UI: http://localhost:4200"
	@echo "n8n: http://localhost:5678"

dev-down: ## Stop all development services
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) down

dev-restart: ## Restart all development services
	@echo "$(YELLOW)Restarting development environment...$(NC)"
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) restart

dev-logs: ## View logs from all development services
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) logs -f

dev-logs-service: ## View logs from specific service (usage: make dev-logs-service SERVICE=api-gateway)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE not specified$(NC)"; \
		echo "Usage: make dev-logs-service SERVICE=api-gateway"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) logs -f $(SERVICE)

dev-ps: ## Show status of development services
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) ps

dev-shell: ## Open shell in a service container (usage: make dev-shell SERVICE=api-gateway)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE not specified$(NC)"; \
		echo "Usage: make dev-shell SERVICE=api-gateway"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) exec $(SERVICE) sh

dev-clean: ## Clean development environment (removes containers, volumes, and images)
	@echo "$(RED)WARNING: This will remove all containers, volumes, and images!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) down -v --rmi all; \
		echo "$(GREEN)Development environment cleaned!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

##@ Production Environment

prod-check: ## Check production prerequisites
	@echo "$(BLUE)Checking production prerequisites...$(NC)"
	@if [ ! -f "$(ENV_PROD)" ]; then \
		echo "$(RED)Error: $(ENV_PROD) not found$(NC)"; \
		echo "Copy .env.production.example to .env.production and configure it"; \
		exit 1; \
	fi
	@if [ ! -d "secrets" ]; then \
		echo "$(RED)Error: secrets directory not found$(NC)"; \
		echo "Create secrets directory and add required secret files"; \
		exit 1; \
	fi
	@echo "$(GREEN)Prerequisites check passed!$(NC)"

prod-secrets: ## Generate production secrets (creates secrets directory with random values)
	@echo "$(BLUE)Generating production secrets...$(NC)"
	@mkdir -p secrets
	@openssl rand -base64 32 > secrets/postgres_password.txt
	@openssl rand -base64 64 > secrets/jwt_secret.txt
	@openssl rand -base64 32 > secrets/n8n_encryption_key.txt
	@echo "$(GREEN)Secrets generated! Update secrets/database_url.txt manually$(NC)"
	@echo "$(YELLOW)Don't forget to update .env.production with matching values!$(NC)"

prod-build: prod-check ## Build production images
	@echo "$(BLUE)Building production images...$(NC)"
	IMAGE_TAG=$(shell git rev-parse --short HEAD) docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) build --parallel
	@echo "$(GREEN)Production images built successfully!$(NC)"

prod-up: prod-check ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) up -d
	@echo "$(GREEN)Production environment started!$(NC)"

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) down

prod-restart: ## Restart production services
	@echo "$(YELLOW)Restarting production services...$(NC)"
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) restart

prod-logs: ## View production logs
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) logs -f

prod-logs-service: ## View logs from specific production service
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE not specified$(NC)"; \
		echo "Usage: make prod-logs-service SERVICE=api-gateway"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) logs -f $(SERVICE)

prod-ps: ## Show status of production services
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) ps

prod-scale: ## Scale a production service (usage: make prod-scale SERVICE=api-gateway REPLICAS=3)
	@if [ -z "$(SERVICE)" ] || [ -z "$(REPLICAS)" ]; then \
		echo "$(RED)Error: SERVICE and REPLICAS must be specified$(NC)"; \
		echo "Usage: make prod-scale SERVICE=api-gateway REPLICAS=3"; \
		exit 1; \
	fi
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) up -d --scale $(SERVICE)=$(REPLICAS) $(SERVICE)

##@ Deployment

deploy: prod-check ## Deploy to production (zero-downtime)
	@bash $(SCRIPTS_DIR)/deploy.sh

deploy-tag: prod-check ## Deploy specific image tag (usage: make deploy-tag TAG=v1.0.0)
	@if [ -z "$(TAG)" ]; then \
		echo "$(RED)Error: TAG not specified$(NC)"; \
		echo "Usage: make deploy-tag TAG=v1.0.0"; \
		exit 1; \
	fi
	@bash $(SCRIPTS_DIR)/deploy.sh --tag $(TAG)

deploy-force: prod-check ## Force deploy without confirmation
	@bash $(SCRIPTS_DIR)/deploy.sh --force

rollback: ## Rollback to previous deployment
	@bash $(SCRIPTS_DIR)/rollback.sh

rollback-list: ## List available backups for rollback
	@bash $(SCRIPTS_DIR)/rollback.sh --list

##@ Database Operations

backup: ## Create database backup
	@bash $(SCRIPTS_DIR)/backup.sh

backup-s3: ## Create backup and upload to S3 (requires AWS_S3_BUCKET env var)
	@if [ -z "$(S3_BUCKET)" ]; then \
		echo "$(RED)Error: S3_BUCKET not specified$(NC)"; \
		echo "Usage: make backup-s3 S3_BUCKET=my-bucket"; \
		exit 1; \
	fi
	@bash $(SCRIPTS_DIR)/backup.sh --s3-bucket $(S3_BUCKET)

backup-gcs: ## Create backup and upload to GCS (requires GCS_BUCKET env var)
	@if [ -z "$(GCS_BUCKET)" ]; then \
		echo "$(RED)Error: GCS_BUCKET not specified$(NC)"; \
		echo "Usage: make backup-gcs GCS_BUCKET=my-bucket"; \
		exit 1; \
	fi
	@bash $(SCRIPTS_DIR)/backup.sh --gcs-bucket $(GCS_BUCKET)

restore: ## Restore database from backup
	@echo "$(YELLOW)This will restore the database from a backup$(NC)"
	@bash $(SCRIPTS_DIR)/rollback.sh --list
	@read -p "Enter backup file path: " backup_file; \
	bash $(SCRIPTS_DIR)/rollback.sh --backup $$backup_file

db-shell: ## Open PostgreSQL shell
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) exec postgres psql -U funnel_agents -d funnel_agents

db-shell-prod: ## Open PostgreSQL shell in production
	docker-compose -f $(COMPOSE_PROD) --env-file $(ENV_PROD) exec postgres psql -U $$(grep POSTGRES_USER $(ENV_PROD) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_PROD) | cut -d '=' -f2)

##@ Health & Monitoring

health: ## Run health checks on all services
	@bash $(SCRIPTS_DIR)/health-check.sh

health-continuous: ## Run continuous health checks (every 60s)
	@bash $(SCRIPTS_DIR)/health-check.sh --continuous

health-service: ## Check specific service health
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE not specified$(NC)"; \
		echo "Usage: make health-service SERVICE=api-gateway"; \
		exit 1; \
	fi
	@bash $(SCRIPTS_DIR)/health-check.sh --service $(SERVICE)

stats: ## Show resource usage statistics
	docker stats --no-stream

stats-watch: ## Watch resource usage in real-time
	docker stats

##@ Maintenance

clean-logs: ## Clean old log files
	@echo "$(YELLOW)Cleaning old log files...$(NC)"
	find ../../storage/logs -name "*.log" -mtime +30 -delete
	@echo "$(GREEN)Log files cleaned!$(NC)"

clean-backups: ## Clean old backups (keeps last 30 days)
	@echo "$(YELLOW)Cleaning old backups...$(NC)"
	find backups -name "*.sql.gz" -mtime +30 -delete
	find backups -name "*.rdb" -mtime +30 -delete
	find backups -name "*.tar.gz" -mtime +30 -delete
	@echo "$(GREEN)Old backups cleaned!$(NC)"

clean-images: ## Remove unused Docker images
	@echo "$(YELLOW)Removing unused Docker images...$(NC)"
	docker image prune -a -f
	@echo "$(GREEN)Unused images removed!$(NC)"

clean-volumes: ## Remove unused Docker volumes
	@echo "$(RED)WARNING: This will remove unused volumes!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker volume prune -f; \
		echo "$(GREEN)Unused volumes removed!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

clean-all: ## Clean everything (containers, volumes, images, logs, backups)
	@echo "$(RED)WARNING: This will remove EVERYTHING!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(MAKE) dev-down; \
		$(MAKE) prod-down; \
		$(MAKE) clean-logs; \
		$(MAKE) clean-backups; \
		$(MAKE) clean-images; \
		docker volume prune -f; \
		echo "$(GREEN)Everything cleaned!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

##@ SSL/TLS

ssl-generate: ## Generate self-signed SSL certificates for development
	@echo "$(BLUE)Generating self-signed SSL certificates...$(NC)"
	@mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=State/L=City/O=FunnelAgents/CN=localhost"
	@echo "$(GREEN)SSL certificates generated!$(NC)"
	@echo "$(YELLOW)Note: These are self-signed certificates for development only$(NC)"

ssl-info: ## Show SSL certificate information
	@if [ -f "nginx/ssl/cert.pem" ]; then \
		openssl x509 -in nginx/ssl/cert.pem -text -noout; \
	else \
		echo "$(RED)No SSL certificate found$(NC)"; \
	fi

##@ Utilities

init: ## Initialize project (create directories and example files)
	@echo "$(BLUE)Initializing project structure...$(NC)"
	@mkdir -p backups secrets postgres/init nginx/ssl nginx/conf.d
	@if [ ! -f "$(ENV_PROD)" ]; then \
		cp .env.production.example $(ENV_PROD); \
		echo "$(GREEN)Created $(ENV_PROD)$(NC)"; \
	fi
	@echo "$(GREEN)Project initialized!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Configure $(ENV_PROD)"
	@echo "2. Generate secrets: make prod-secrets"
	@echo "3. Generate SSL certificates: make ssl-generate"
	@echo "4. Build images: make prod-build"

update: ## Pull latest images and restart services
	@echo "$(BLUE)Updating services...$(NC)"
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) pull
	docker-compose -f $(COMPOSE_DEV) --env-file $(ENV_DEV) up -d
	@echo "$(GREEN)Services updated!$(NC)"

version: ## Show version information
	@echo "$(BLUE)FunnelAgents Version Information$(NC)"
	@echo "Docker version: $$(docker --version)"
	@echo "Docker Compose version: $$(docker-compose --version)"
	@echo "Git commit: $$(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
	@echo "Git branch: $$(git branch --show-current 2>/dev/null || echo 'N/A')"

##@ NX Build System

build: ## Build all services with NX (parallel)
	@echo "$(BLUE)Building all services with SWC...$(NC)"
	cd ../.. && npx nx run-many --target=build --all --parallel=3
	@echo "$(GREEN)All services built successfully!$(NC)"

build-service: ## Build a specific service (usage: make build-service SERVICE=api-gateway)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE must be specified$(NC)"; \
		echo "Usage: make build-service SERVICE=api-gateway"; \
		exit 1; \
	fi
	@echo "$(BLUE)Building $(SERVICE)...$(NC)"
	cd ../.. && npx nx build $(SERVICE)
	@echo "$(GREEN)$(SERVICE) built successfully!$(NC)"

build-clean: ## Clean dist and rebuild all services
	@echo "$(YELLOW)Cleaning dist directory...$(NC)"
	cd ../.. && rm -rf dist
	@echo "$(BLUE)Rebuilding all services...$(NC)"
	cd ../.. && npx nx run-many --target=build --all --parallel=3
	@echo "$(GREEN)Clean build complete!$(NC)"

build-verify: ## Verify build output for all services
	@echo "$(BLUE)Verifying build outputs...$(NC)"
	@cd ../.. && for service in api-gateway auth-service crm-service campaigns-service content-service agents-service tasks-service automations-service reports-service worker-runner scheduler; do \
		if [ -d "dist/apps/$$service" ]; then \
			file_count=$$(find dist/apps/$$service -type f | wc -l); \
			echo "$(GREEN)✓$(NC) $$service: $$file_count files"; \
		else \
			echo "$(RED)✗$(NC) $$service: build output missing"; \
		fi \
	done
	@echo "$(GREEN)Verification complete!$(NC)"

build-list: ## List all buildable projects
	@echo "$(BLUE)Buildable NX Projects:$(NC)"
	@cd ../.. && npx nx show projects --with-target=build

build-graph: ## Show build dependency graph
	@echo "$(BLUE)Opening NX project graph...$(NC)"
	@cd ../.. && npx nx graph

build-help: ## Show build system quick reference
	@echo "$(BLUE)NX Build System Quick Reference$(NC)"
	@echo ""
	@echo "$(GREEN)Build Commands:$(NC)"
	@echo "  make build                    - Build all services in parallel"
	@echo "  make build-service SERVICE=X  - Build specific service"
	@echo "  make build-clean              - Clean and rebuild all"
	@echo "  make build-verify             - Verify build outputs"
	@echo ""
	@echo "$(GREEN)NX Tools:$(NC)"
	@echo "  make build-list               - List buildable projects"
	@echo "  make build-graph              - Show dependency graph"
	@echo ""
	@echo "$(GREEN)Individual Services:$(NC)"
	@echo "  api-gateway, auth-service, crm-service"
	@echo "  campaigns-service, content-service, agents-service"
	@echo "  tasks-service, automations-service, reports-service"
	@echo "  worker-runner, scheduler"
	@echo ""
	@echo "$(YELLOW)Migration Documentation:$(NC)"
	@echo "  infrastructure/docker/BUILD_EXECUTOR_MIGRATION.md"
	@echo "  infrastructure/docker/SWC_MIGRATION_IMPLEMENTATION_REPORT.md"
	@echo ""
	@echo "$(GREEN)Executor:$(NC) @nx/js:swc (SWC Compiler)"
	@echo "$(GREEN)Performance:$(NC) 2-5x faster than TypeScript compiler"

##@ CI/CD Operations

ci-build: ## Build Docker images for CI (all services)
	@echo "$(BLUE)Building all Docker images for CI...$(NC)"
	@for service in api-gateway auth-service crm-service campaigns-service content-service agents-service tasks-service automations-service reports-service worker-runner scheduler; do \
		echo "Building $$service..."; \
		docker build \
			-f Dockerfile \
			--build-arg SERVICE=$$service \
			-t ghcr.io/funnel-agents/funnel-agents-$$service:$(shell git rev-parse --short HEAD) \
			../.. || exit 1; \
	done
	@echo "$(GREEN)All images built successfully!$(NC)"

ci-test: ## Run tests locally (simulates CI)
	@echo "$(BLUE)Running CI test suite...$(NC)"
	cd ../.. && npm ci && npm run test:unit && npm run test:integration
	@echo "$(GREEN)All tests passed!$(NC)"

ci-scan: ## Run security scans locally
	@echo "$(BLUE)Running security scans...$(NC)"
	@if command -v trivy >/dev/null 2>&1; then \
		for service in api-gateway auth-service crm-service; do \
			echo "Scanning $$service..."; \
			trivy image --severity HIGH,CRITICAL ghcr.io/funnel-agents/funnel-agents-$$service:$(shell git rev-parse --short HEAD) || true; \
		done; \
	else \
		echo "$(YELLOW)Trivy not installed. Install: https://github.com/aquasecurity/trivy$(NC)"; \
	fi
	@echo "$(GREEN)Security scans complete!$(NC)"

ci-lint: ## Run linting locally
	@echo "$(BLUE)Running linters...$(NC)"
	cd ../.. && npm ci && npm run lint && npm run format:check
	@echo "$(GREEN)Linting complete!$(NC)"

deploy-staging: ## Trigger staging deployment via GitHub Actions
	@echo "$(BLUE)Triggering staging deployment...$(NC)"
	@if command -v gh >/dev/null 2>&1; then \
		gh workflow run deploy.yml --ref main; \
		echo "$(GREEN)Staging deployment triggered!$(NC)"; \
		echo "View status: gh run watch"; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		echo "Install: https://cli.github.com/"; \
		exit 1; \
	fi

deploy-production: ## Trigger production deployment via GitHub Actions (requires approval)
	@echo "$(BLUE)Triggering production deployment...$(NC)"
	@echo "$(YELLOW)Note: This requires manual approval in GitHub$(NC)"
	@if command -v gh >/dev/null 2>&1; then \
		gh workflow run deploy.yml --ref main -f environment=production; \
		echo "$(GREEN)Production deployment triggered!$(NC)"; \
		echo "Approve at: https://github.com/$$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		echo "Install: https://cli.github.com/"; \
		exit 1; \
	fi

workflow-list: ## List recent workflow runs
	@if command -v gh >/dev/null 2>&1; then \
		gh run list --limit 10; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		exit 1; \
	fi

workflow-watch: ## Watch current workflow run
	@if command -v gh >/dev/null 2>&1; then \
		gh run watch; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		exit 1; \
	fi

workflow-logs: ## View logs from latest workflow run
	@if command -v gh >/dev/null 2>&1; then \
		gh run view --log; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		exit 1; \
	fi

docker-login-ghcr: ## Login to GitHub Container Registry
	@echo "$(BLUE)Logging in to GHCR...$(NC)"
	@if command -v gh >/dev/null 2>&1; then \
		echo $$(gh auth token) | docker login ghcr.io -u $$(gh api user --jq .login) --password-stdin; \
		echo "$(GREEN)Logged in to GHCR!$(NC)"; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		echo "Install: https://cli.github.com/"; \
		exit 1; \
	fi

docker-pull-latest: ## Pull latest images from GHCR
	@echo "$(BLUE)Pulling latest images from GHCR...$(NC)"
	@for service in api-gateway auth-service crm-service campaigns-service content-service agents-service tasks-service automations-service reports-service worker-runner scheduler; do \
		echo "Pulling $$service..."; \
		docker pull ghcr.io/funnel-agents/funnel-agents-$$service:latest || echo "$(YELLOW)Failed to pull $$service$(NC)"; \
	done
	@echo "$(GREEN)Images pulled!$(NC)"

docker-tag-release: ## Tag and push release images (usage: make docker-tag-release VERSION=v1.0.0)
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION not specified$(NC)"; \
		echo "Usage: make docker-tag-release VERSION=v1.0.0"; \
		exit 1; \
	fi
	@echo "$(BLUE)Tagging images as $(VERSION)...$(NC)"
	@for service in api-gateway auth-service crm-service campaigns-service content-service agents-service tasks-service automations-service reports-service worker-runner scheduler; do \
		echo "Tagging $$service..."; \
		docker tag ghcr.io/funnel-agents/funnel-agents-$$service:latest ghcr.io/funnel-agents/funnel-agents-$$service:$(VERSION); \
		docker push ghcr.io/funnel-agents/funnel-agents-$$service:$(VERSION); \
	done
	@echo "$(GREEN)Release tagged as $(VERSION)!$(NC)"

secrets-list: ## List GitHub secrets (requires gh CLI)
	@if command -v gh >/dev/null 2>&1; then \
		echo "$(BLUE)Repository Secrets:$(NC)"; \
		gh secret list; \
		echo ""; \
		echo "$(BLUE)Staging Environment Secrets:$(NC)"; \
		gh secret list --env staging || echo "No staging environment"; \
		echo ""; \
		echo "$(BLUE)Production Environment Secrets:$(NC)"; \
		gh secret list --env production || echo "No production environment"; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		exit 1; \
	fi

secrets-set: ## Set a GitHub secret (usage: make secrets-set NAME=AWS_ACCESS_KEY_ID VALUE=xxx)
	@if [ -z "$(NAME)" ] || [ -z "$(VALUE)" ]; then \
		echo "$(RED)Error: NAME and VALUE must be specified$(NC)"; \
		echo "Usage: make secrets-set NAME=AWS_ACCESS_KEY_ID VALUE=xxx"; \
		exit 1; \
	fi
	@if command -v gh >/dev/null 2>&1; then \
		echo "$(VALUE)" | gh secret set $(NAME); \
		echo "$(GREEN)Secret $(NAME) set successfully!$(NC)"; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		exit 1; \
	fi

secrets-delete: ## Delete a GitHub secret (usage: make secrets-delete NAME=OLD_SECRET)
	@if [ -z "$(NAME)" ]; then \
		echo "$(RED)Error: NAME must be specified$(NC)"; \
		echo "Usage: make secrets-delete NAME=OLD_SECRET"; \
		exit 1; \
	fi
	@if command -v gh >/dev/null 2>&1; then \
		gh secret delete $(NAME); \
		echo "$(GREEN)Secret $(NAME) deleted!$(NC)"; \
	else \
		echo "$(RED)GitHub CLI not installed$(NC)"; \
		exit 1; \
	fi

ci-help: ## Show CI/CD quick reference
	@echo "$(BLUE)CI/CD Quick Reference$(NC)"
	@echo ""
	@echo "$(GREEN)Local Testing:$(NC)"
	@echo "  make ci-lint          - Run linting"
	@echo "  make ci-test          - Run tests"
	@echo "  make ci-build         - Build all images"
	@echo "  make ci-scan          - Security scanning"
	@echo ""
	@echo "$(GREEN)Deployments:$(NC)"
	@echo "  make deploy-staging   - Deploy to staging"
	@echo "  make deploy-production - Deploy to production (requires approval)"
	@echo ""
	@echo "$(GREEN)Monitoring:$(NC)"
	@echo "  make workflow-list    - List recent runs"
	@echo "  make workflow-watch   - Watch current run"
	@echo "  make workflow-logs    - View run logs"
	@echo ""
	@echo "$(GREEN)Docker Registry:$(NC)"
	@echo "  make docker-login-ghcr    - Login to GHCR"
	@echo "  make docker-pull-latest   - Pull latest images"
	@echo "  make docker-tag-release VERSION=v1.0.0  - Tag release"
	@echo ""
	@echo "$(GREEN)Secrets Management:$(NC)"
	@echo "  make secrets-list         - List all secrets"
	@echo "  make secrets-set NAME=X VALUE=Y  - Set secret"
	@echo "  make secrets-delete NAME=X       - Delete secret"
	@echo ""
	@echo "$(YELLOW)Documentation:$(NC)"
	@echo "  .github/workflows/README.md - Complete workflow guide"
	@echo "  CICD_QUICK_REFERENCE.md     - Quick reference"
	@echo "  CICD_IMPLEMENTATION_REPORT.md - Implementation details"
