# FunnelAgents Makefile
# Streamlined development commands for Nx + NestJS monorepo

.PHONY: help install dev start stop build test lint clean docker db web up

# Colors
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Config
SHELL := /bin/bash
.DEFAULT_GOAL := help

##@ General

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(CYAN)FunnelAgents$(RESET) - AI-powered multi-agent orchestration\n\nUsage:\n  make $(GREEN)<target>$(RESET)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(RESET)\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Setup

install: ## Install all dependencies
	@echo "$(CYAN)Installing Node dependencies...$(RESET)"
	npm install
	@echo "$(CYAN)Installing web-ui dependencies...$(RESET)"
	cd apps/web-ui && npm install
	@echo "$(GREEN)Installation complete!$(RESET)"

install-root: ## Install root Node dependencies only
	npm install

install-web: ## Install web-ui dependencies only
	cd apps/web-ui && npm install

##@ Up Commands (Start Everything)

up: ## Start everything (full infra with n8n workers + all services + web-ui)
	@echo "$(CYAN)====== Starting Full Stack ======$(RESET)"
	@echo ""
	@echo "$(CYAN)[1/3] Starting infrastructure (PostgreSQL, Redis, n8n + workers, Mailhog)...$(RESET)"
	cd infrastructure/docker && docker compose up -d postgres redis n8n n8n-worker-crm n8n-worker-campaigns n8n-worker-content n8n-worker-reports n8n-worker-automations mailhog
	@echo "$(GREEN)Infrastructure started!$(RESET)"
	@echo "$(CYAN)Waiting for services to be healthy...$(RESET)"
	@sleep 5
	@echo ""
	@echo "$(CYAN)[2/3] Starting NestJS backend services...$(RESET)"
	@echo "$(CYAN)[3/3] Starting web-ui frontend...$(RESET)"
	@echo ""
	npx nx run-many --target=serve --projects=api-gateway,auth-service,crm-service,campaigns-service,content-service,agents-service,tasks-service,automations-service,reports-service,worker-runner,scheduler --parallel & \
	cd apps/web-ui && npm run dev & \
	sleep 10 && echo "" && \
	echo "$(GREEN)====== Full Stack Running ======$(RESET)" && \
	echo "$(CYAN)Access points:$(RESET)" && \
	echo "  API Gateway:     http://localhost:3000" && \
	echo "  Web UI:          http://localhost:5173" && \
	echo "  n8n Workflows:   http://localhost:5678" && \
	echo "  Mailhog:         http://localhost:8025" && \
	echo "" && \
	echo "$(YELLOW)Press Ctrl+C to stop all services$(RESET)" && \
	wait

up-infra: ## Start infrastructure only (PostgreSQL, Redis, n8n, Mailhog)
	@echo "$(CYAN)Starting infrastructure services...$(RESET)"
	cd infrastructure/docker && docker compose up -d postgres redis n8n mailhog
	@echo "$(GREEN)Infrastructure started!$(RESET)"
	@sleep 5
	cd infrastructure/docker && docker compose ps

up-infra-full: ## Start all infrastructure including n8n workers
	@echo "$(CYAN)Starting all infrastructure with n8n workers...$(RESET)"
	cd infrastructure/docker && docker compose up -d postgres redis n8n n8n-worker-crm n8n-worker-campaigns n8n-worker-content n8n-worker-reports n8n-worker-automations mailhog
	@echo "$(GREEN)Full infrastructure started!$(RESET)"
	@sleep 5
	cd infrastructure/docker && docker compose ps

up-infra-tools: ## Start infrastructure with dev tools (pgAdmin, Redis Commander)
	@echo "$(CYAN)Starting infrastructure with dev tools...$(RESET)"
	cd infrastructure/docker && docker compose --profile dev-tools up -d postgres redis n8n n8n-worker-crm n8n-worker-campaigns n8n-worker-content n8n-worker-reports n8n-worker-automations mailhog
	@echo "$(GREEN)Infrastructure with dev tools started!$(RESET)"
	@echo "  pgAdmin:          http://localhost:5050"
	@echo "  Redis Commander:  http://localhost:8081"

up-services: ## Start all NestJS backend services only (requires infra running)
	@echo "$(CYAN)Starting all NestJS backend services...$(RESET)"
	npx nx run-many --target=serve --projects=api-gateway,auth-service,crm-service,campaigns-service,content-service,agents-service,tasks-service,automations-service,reports-service,worker-runner,scheduler --parallel

up-web: ## Start web-ui frontend only (Vite dev server on port 5173)
	@echo "$(CYAN)Starting web-ui frontend...$(RESET)"
	cd apps/web-ui && npm run dev

up-services-docker: ## Start all services via Docker (full containerized stack)
	@echo "$(CYAN)Starting all services in Docker...$(RESET)"
	cd infrastructure/docker && docker compose up -d
	@echo "$(GREEN)All Docker services started!$(RESET)"
	cd infrastructure/docker && docker compose ps

up-backend: up-infra-full ## Start full infra + all backend services (no frontend)
	@echo "$(CYAN)Starting backend services...$(RESET)"
	npx nx run-many --target=serve --projects=api-gateway,auth-service,crm-service,campaigns-service,content-service,agents-service,tasks-service,automations-service,reports-service,worker-runner,scheduler --parallel

up-minimal: up-infra ## Start basic infra + core services only (gateway, auth, tasks)
	@echo "$(CYAN)Starting minimal services...$(RESET)"
	npx nx run-many --target=serve --projects=api-gateway,auth-service,tasks-service --parallel

##@ Development

dev: ## Start all services in development mode
	@echo "$(CYAN)Starting all services...$(RESET)"
	npx nx run-many --target=serve --all --parallel

dev-gateway: ## Start API gateway only (port 3000)
	npx nx serve api-gateway

dev-auth: ## Start auth service only (port 3001)
	npx nx serve auth-service

dev-crm: ## Start CRM service only (port 3002)
	npx nx serve crm-service

dev-campaigns: ## Start campaigns service only (port 3003)
	npx nx serve campaigns-service

dev-content: ## Start content service only (port 3004)
	npx nx serve content-service

dev-agents: ## Start agents service only (port 3005)
	npx nx serve agents-service

dev-tasks: ## Start tasks service only (port 3006)
	npx nx serve tasks-service

dev-automations: ## Start automations service only (port 3007)
	npx nx serve automations-service

dev-reports: ## Start reports service only (port 3008)
	npx nx serve reports-service

dev-worker: ## Start worker runner (port 3009)
	npx nx serve worker-runner

dev-scheduler: ## Start scheduler (port 3010)
	npx nx serve scheduler

dev-web: ## Start web-ui frontend (Vite dev server)
	npx nx serve web-ui

dev-core: ## Start core services (gateway + auth + tasks)
	npx nx run-many --target=serve --projects=api-gateway,auth-service,tasks-service --parallel

dev-full: ## Start backend + frontend together
	npx nx run-many --target=serve --projects=api-gateway,auth-service,web-ui --parallel

watch: ## Start with file watching (hot reload)
	npx nx run-many --target=serve --all --parallel --watch

##@ Build

build: ## Build all services
	@echo "$(CYAN)Building all services...$(RESET)"
	npx nx run-many --target=build --all
	@echo "$(GREEN)Build complete!$(RESET)"

build-prod: ## Build all services for production
	npx nx run-many --target=build --all --configuration=production

build-affected: ## Build only affected services
	npx nx affected --target=build

build-gateway: ## Build API gateway
	npx nx build api-gateway

build-libs: ## Build all shared libraries
	npx nx run-many --target=build --projects=tag:type:lib

##@ Health Checks

health-all: ## Test all service health endpoints
	@echo "$(CYAN)Testing all health endpoints...$(RESET)"
	@./test-health-checks.sh

health-gateway: ## Check API gateway health
	@curl -s http://localhost:3000/health | jq || echo "$(RED)Gateway not responding$(RESET)"

health-auth: ## Check auth service health
	@curl -s http://localhost:3001/health | jq || echo "$(RED)Auth service not responding$(RESET)"

health-crm: ## Check CRM service health
	@curl -s http://localhost:3002/health | jq || echo "$(RED)CRM service not responding$(RESET)"

health-campaigns: ## Check campaigns service health
	@curl -s http://localhost:3003/health | jq || echo "$(RED)Campaigns service not responding$(RESET)"

health-content: ## Check content service health
	@curl -s http://localhost:3004/health | jq || echo "$(RED)Content service not responding$(RESET)"

health-agents: ## Check agents service health
	@curl -s http://localhost:3005/health | jq || echo "$(RED)Agents service not responding$(RESET)"

health-tasks: ## Check tasks service health
	@curl -s http://localhost:3006/health | jq || echo "$(RED)Tasks service not responding$(RESET)"

health-automations: ## Check automations service health
	@curl -s http://localhost:3007/health | jq || echo "$(RED)Automations service not responding$(RESET)"

health-reports: ## Check reports service health
	@curl -s http://localhost:3008/health | jq || echo "$(RED)Reports service not responding$(RESET)"

health-worker: ## Check worker runner health
	@curl -s http://localhost:3009/health | jq || echo "$(RED)Worker runner not responding$(RESET)"

health-scheduler: ## Check scheduler health
	@curl -s http://localhost:3010/health | jq || echo "$(RED)Scheduler not responding$(RESET)"

health-ready: ## Check readiness of all services
	@echo "$(CYAN)Checking service readiness...$(RESET)"
	@for port in 3001 3002 3003 3004 3005 3006 3007 3008 3010; do \
		echo -n "Port $$port: "; \
		curl -s http://localhost:$$port/health/ready | jq -r '.status' || echo "$(RED)not responding$(RESET)"; \
	done

health-services: ## Check API gateway services overview
	@curl -s http://localhost:3000/health/services | jq || echo "$(RED)Gateway not responding$(RESET)"

health-quick: ## Quick health check of core services
	@echo "$(CYAN)Quick health check...$(RESET)"
	@for port in 3000 3001 3002 3005 3006; do \
		curl -s http://localhost:$$port/health | jq -r '.service + ": " + .status' || echo "$(RED)Port $$port not responding$(RESET)"; \
	done

##@ Testing

test: ## Run all tests
	@echo "$(CYAN)Running all tests...$(RESET)"
	npm test
	@echo "$(GREEN)All tests passed!$(RESET)"

test-unit: ## Run unit tests only
	@echo "$(CYAN)Running unit tests...$(RESET)"
	npm run test:unit

test-e2e: ## Run E2E tests
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	npm run test:e2e

test-services: ## Run tests for all services
	@echo "$(CYAN)Running service tests...$(RESET)"
	npm run test:services

test-affected: ## Run tests for affected projects only
	npx nx affected --target=test

test-cov: ## Run tests with coverage report
	@echo "$(CYAN)Running tests with coverage...$(RESET)"
	npm run test:cov
	@echo "$(GREEN)Coverage report generated in coverage/$(RESET)"

test-watch: ## Run tests in watch mode
	npm run test:watch

test-integration: ## Run all integration tests with infrastructure
	@echo "$(CYAN)Starting test infrastructure...$(RESET)"
	cd tests/integration && docker-compose -f docker-compose.test.yml up -d
	@echo "$(CYAN)Waiting for services to be ready...$(RESET)"
	@sleep 5
	@echo "$(CYAN)Running integration tests...$(RESET)"
	npm run test:integration
	@echo "$(YELLOW)Stopping test infrastructure...$(RESET)"
	cd tests/integration && docker-compose -f docker-compose.test.yml down

test-integration-watch: ## Run integration tests in watch mode
	npm run test:integration:watch

test-integration-infra-up: ## Start integration test infrastructure only
	@echo "$(CYAN)Starting integration test infrastructure...$(RESET)"
	cd tests/integration && docker-compose -f docker-compose.test.yml up -d
	@echo "$(GREEN)Test infrastructure started!$(RESET)"
	@echo "  PostgreSQL (test): localhost:5433"
	@echo "  Redis (test):      localhost:6380"

test-integration-infra-down: ## Stop integration test infrastructure
	@echo "$(CYAN)Stopping integration test infrastructure...$(RESET)"
	cd tests/integration && docker-compose -f docker-compose.test.yml down -v
	@echo "$(GREEN)Test infrastructure stopped!$(RESET)"

test-integration-logs: ## View integration test infrastructure logs
	cd tests/integration && docker-compose -f docker-compose.test.yml logs -f

test-gateway: ## Test API gateway
	npx nx test api-gateway

test-auth: ## Test auth service
	npx nx test auth-service

test-crm: ## Test CRM service
	npx nx test crm-service

test-campaigns: ## Test campaigns service
	npx nx test campaigns-service

test-automations: ## Test automations service
	npx nx test automations-service

test-reports: ## Test reports service
	npx nx test reports-service

test-libs: ## Test all shared libraries
	npx nx run-many --target=test --projects=tag:type:lib

test-debug: ## Run tests in debug mode
	@echo "$(CYAN)Starting test debugger...$(RESET)"
	npm run test:debug

test-ci: ## Run tests in CI mode
	@echo "$(CYAN)Running tests in CI mode...$(RESET)"
	npm run test:ci

test-all-e2e: ## Run all E2E test suites
	npm run test:e2e:all

test-clean: ## Clean test cache and coverage
	@echo "$(CYAN)Cleaning test cache...$(RESET)"
	rm -rf coverage .nx/cache
	@echo "$(GREEN)Test cache cleaned!$(RESET)"

##@ Code Quality

lint: ## Lint all projects
	npx nx run-many --target=lint --all

lint-fix: ## Lint and fix all projects
	npx nx run-many --target=lint --all --fix

lint-affected: ## Lint only affected projects
	npx nx affected --target=lint

format: ## Format all files
	npx nx format:write

format-check: ## Check formatting
	npx nx format:check

typecheck: ## Run TypeScript type checking
	npx tsc --noEmit

##@ Monitoring

monitoring-up: ## Start Prometheus and Grafana
	@echo "$(CYAN)Starting monitoring services...$(RESET)"
	cd infrastructure/docker && docker compose up -d prometheus grafana
	@echo "$(GREEN)Monitoring services started!$(RESET)"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana:    http://localhost:3001"

monitoring-down: ## Stop monitoring services
	@echo "$(CYAN)Stopping monitoring services...$(RESET)"
	cd infrastructure/docker && docker compose stop prometheus grafana
	@echo "$(GREEN)Monitoring services stopped!$(RESET)"

monitoring-logs: ## View monitoring logs
	cd infrastructure/docker && docker compose logs -f prometheus grafana

monitoring-status: ## Check monitoring health
	@echo "$(CYAN)Checking monitoring health...$(RESET)"
	@echo -n "Prometheus: "; curl -s http://localhost:9090/-/healthy && echo "$(GREEN)healthy$(RESET)" || echo "$(RED)unhealthy$(RESET)"
	@echo -n "Grafana:    "; curl -s http://localhost:3001/api/health | jq -r '.database + " database"' || echo "$(RED)unhealthy$(RESET)"

monitoring-metrics: ## Check all service metrics endpoints
	@echo "$(CYAN)Checking service metrics endpoints...$(RESET)"
	@for port in 3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do \
		echo -n "Port $$port: "; \
		curl -s http://localhost:$$port/metrics | head -n 1 || echo "$(RED)not available$(RESET)"; \
	done

monitoring-prometheus-reload: ## Reload Prometheus configuration
	@echo "$(CYAN)Reloading Prometheus configuration...$(RESET)"
	curl -X POST http://localhost:9090/-/reload
	@echo "$(GREEN)Configuration reloaded!$(RESET)"

##@ Database

db-up: ## Start database containers
	docker compose up -d postgres redis

db-down: ## Stop database containers
	docker compose down

db-migrate: ## Run database migrations
	npx nx run infrastructure:migrate

db-seed: ## Seed database with sample data
	npx nx run infrastructure:seed

db-seed-users: ## Seed test users
	@echo "$(CYAN)Seeding test users...$(RESET)"
	npx ts-node apps/auth-service/src/seed.ts

db-seed-templates: ## Seed agent templates
	@echo "$(CYAN)Seeding agent templates...$(RESET)"
	npx ts-node apps/agents-service/src/seed-templates.ts

db-seed-all: db-seed-users db-seed-templates ## Seed all data (users + templates)
	@echo "$(GREEN)All seed data created!$(RESET)"

db-reset: ## Reset database (drop + migrate + seed)
	npx nx run infrastructure:reset

db-studio: ## Open Prisma Studio / TypeORM admin
	npx nx run infrastructure:studio

##@ Docker Infrastructure

docker-infra: ## Start infrastructure (PostgreSQL, Redis, n8n, Mailhog)
	@echo "$(CYAN)Starting infrastructure services...$(RESET)"
	cd infrastructure/docker && docker compose up -d postgres redis n8n mailhog
	@echo "$(GREEN)Infrastructure started!$(RESET)"

docker-infra-full: ## Start all infrastructure including n8n workers
	@echo "$(CYAN)Starting all infrastructure services...$(RESET)"
	cd infrastructure/docker && docker compose up -d postgres redis n8n n8n-worker-crm n8n-worker-campaigns n8n-worker-content n8n-worker-reports n8n-worker-automations mailhog
	@echo "$(GREEN)Full infrastructure started!$(RESET)"

docker-infra-tools: ## Start infrastructure with dev tools (pgAdmin, Redis Commander)
	@echo "$(CYAN)Starting infrastructure with dev tools...$(RESET)"
	cd infrastructure/docker && docker compose --profile dev-tools up -d
	@echo "$(GREEN)Infrastructure with dev tools started!$(RESET)"

docker-build: ## Build all Docker images
	@echo "$(CYAN)Building Docker images...$(RESET)"
	cd infrastructure/docker && docker compose build

docker-up: ## Start all containers
	cd infrastructure/docker && docker compose up -d

docker-down: ## Stop all containers
	cd infrastructure/docker && docker compose down

docker-logs: ## View container logs
	cd infrastructure/docker && docker compose logs -f

docker-logs-n8n: ## View n8n logs
	cd infrastructure/docker && docker compose logs -f n8n

docker-logs-service: ## View specific service logs (usage: make docker-logs-service SERVICE=api-gateway)
	cd infrastructure/docker && docker compose logs -f $(SERVICE)

docker-ps: ## List running containers
	cd infrastructure/docker && docker compose ps

docker-clean: ## Remove all containers and volumes
	cd infrastructure/docker && docker compose down -v --remove-orphans
	docker system prune -f

docker-rebuild: ## Rebuild and restart containers
	cd infrastructure/docker && docker compose down
	cd infrastructure/docker && docker compose build --no-cache
	cd infrastructure/docker && docker compose up -d

docker-status: ## Show status of all services
	@echo "$(CYAN)Docker Infrastructure Status$(RESET)"
	@cd infrastructure/docker && docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

##@ Frontend (web-ui)

web-build: ## Build web-ui for production
	npx nx build web-ui

web-preview: ## Preview production build
	npx nx preview web-ui

web-lint: ## Lint web-ui
	npx nx lint web-ui

web-lint-fix: ## Lint and fix web-ui
	npx nx lint-fix web-ui

##@ Nx Utilities

graph: ## Open Nx dependency graph
	npx nx graph

affected-graph: ## Show affected dependency graph
	npx nx affected:graph

reset: ## Reset Nx cache
	npx nx reset

migrate-check: ## Check for Nx migrations
	npx nx migrate latest --dry-run

migrate: ## Run Nx migrations
	npx nx migrate latest
	npx nx migrate --run-migrations

generate-app: ## Generate new NestJS app (usage: make generate-app NAME=my-app)
	npx nx g @nx/nest:application $(NAME)

generate-lib: ## Generate new library (usage: make generate-lib NAME=my-lib)
	npx nx g @nx/nest:library $(NAME)

generate-service: ## Generate NestJS service (usage: make generate-service APP=api-gateway NAME=users)
	npx nx g @nx/nest:service $(NAME) --project=$(APP)

generate-controller: ## Generate NestJS controller (usage: make generate-controller APP=api-gateway NAME=users)
	npx nx g @nx/nest:controller $(NAME) --project=$(APP)

generate-module: ## Generate NestJS module (usage: make generate-module APP=api-gateway NAME=users)
	npx nx g @nx/nest:module $(NAME) --project=$(APP)

##@ Cleanup

clean: ## Clean build artifacts and cache
	@echo "$(CYAN)Cleaning build artifacts...$(RESET)"
	npx nx reset
	rm -rf dist
	rm -rf node_modules/.cache
	@echo "$(GREEN)Clean complete!$(RESET)"

clean-all: ## Clean everything including node_modules
	@echo "$(RED)Cleaning everything...$(RESET)"
	npx nx reset
	rm -rf dist node_modules
	rm -rf apps/web-ui/node_modules apps/web-ui/dist
	@echo "$(GREEN)Full clean complete!$(RESET)"

clean-docker: ## Clean Docker resources
	docker compose down -v --remove-orphans
	docker system prune -af

##@ Production

prod-build: ## Build for production
	NODE_ENV=production npx nx run-many --target=build --all --configuration=production

prod-start: ## Start production server
	NODE_ENV=production node dist/apps/api-gateway/main.js

prod-docker: ## Build and start production Docker
	docker compose -f docker-compose.prod.yml up -d --build

##@ CI/CD

ci-install: ## CI-optimized install
	npm ci

ci-build: ## CI build
	npx nx affected --target=build --base=origin/main

ci-test: ## CI test
	npx nx affected --target=test --base=origin/main --configuration=ci

ci-lint: ## CI lint
	npx nx affected --target=lint --base=origin/main

ci-e2e: ## CI E2E tests
	npx nx affected --target=e2e --base=origin/main

##@ Quick Commands

q: dev ## Alias for dev
s: dev-gateway ## Alias for dev-gateway (start)
w: dev-web ## Alias for dev-web (frontend)
f: dev-full ## Alias for dev-full (backend + frontend)
t: test ## Alias for test
b: build ## Alias for build
l: lint ## Alias for lint
c: clean ## Alias for clean
u: up ## Alias for up (start everything)
d: down ## Alias for down (stop everything)

##@ Down Commands (Stop Everything)

down: ## Stop all Docker containers
	@echo "$(CYAN)Stopping all containers...$(RESET)"
	cd infrastructure/docker && docker compose down
	@echo "$(GREEN)All containers stopped!$(RESET)"

down-v: ## Stop all containers and remove volumes (WARNING: data loss)
	@echo "$(RED)Stopping all containers and removing volumes...$(RESET)"
	cd infrastructure/docker && docker compose down -v
	@echo "$(GREEN)All containers and volumes removed!$(RESET)"

down-clean: ## Stop containers, remove volumes, and prune Docker
	@echo "$(RED)Full Docker cleanup...$(RESET)"
	cd infrastructure/docker && docker compose down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Docker cleanup complete!$(RESET)"

restart: down up ## Restart everything (down + up)

restart-infra: ## Restart infrastructure only
	@echo "$(CYAN)Restarting infrastructure...$(RESET)"
	cd infrastructure/docker && docker compose restart postgres redis n8n mailhog
	@echo "$(GREEN)Infrastructure restarted!$(RESET)"

update-web-ui:
	cd apps/web-ui && npm i baseline-browser-mapping@latest -D

##@ Logging

logs-check: ## Check logging infrastructure setup
	@echo "$(CYAN)Checking logging infrastructure...$(RESET)"
	@echo "$(CYAN)Logging dependencies:$(RESET)"
	@npm list pino pino-pretty nestjs-pino pino-http uuid 2>/dev/null || echo "$(YELLOW)Some logging packages not installed$(RESET)"
	@echo ""
	@echo "$(CYAN)Logging module status:$(RESET)"
	@test -f libs/infrastructure/src/lib/logging/enhanced-logger.service.ts && echo "$(GREEN)✓ Enhanced logger service exists$(RESET)" || echo "$(RED)✗ Enhanced logger service missing$(RESET)"
	@test -f libs/infrastructure/src/lib/logging/logging.module.enhanced.ts && echo "$(GREEN)✓ Enhanced logging module exists$(RESET)" || echo "$(RED)✗ Enhanced logging module missing$(RESET)"
	@test -f libs/infrastructure/src/lib/logging/correlation-id.middleware.ts && echo "$(GREEN)✓ Correlation ID middleware exists$(RESET)" || echo "$(RED)✗ Correlation ID middleware missing$(RESET)"
	@echo ""

logs-migrate: ## Run migration helper for a service (Usage: make logs-migrate SERVICE=auth-service)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter required$(RESET)"; \
		echo "Usage: make logs-migrate SERVICE=auth-service"; \
		exit 1; \
	fi
	@./scripts/migrate-to-enhanced-logging.sh $(SERVICE)

logs-view: ## View logs from all services (Docker)
	@echo "$(CYAN)Viewing logs from all services...$(RESET)"
	cd infrastructure/docker && docker compose logs -f --tail=100

logs-view-service: ## View logs from specific service (Usage: make logs-view-service SERVICE=auth-service)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)Error: SERVICE parameter required$(RESET)"; \
		echo "Usage: make logs-view-service SERVICE=auth-service"; \
		exit 1; \
	fi
	cd infrastructure/docker && docker compose logs -f --tail=100 $(SERVICE)

logs-search: ## Search logs for pattern (Usage: make logs-search PATTERN="error" SERVICE=auth-service)
	@if [ -z "$(PATTERN)" ]; then \
		echo "$(RED)Error: PATTERN parameter required$(RESET)"; \
		echo "Usage: make logs-search PATTERN=\"error\""; \
		exit 1; \
	fi
	@if [ -z "$(SERVICE)" ]; then \
		cd infrastructure/docker && docker compose logs | grep -i "$(PATTERN)"; \
	else \
		cd infrastructure/docker && docker compose logs $(SERVICE) | grep -i "$(PATTERN)"; \
	fi

logs-clear: ## Clear all Docker logs
	@echo "$(YELLOW)Clearing all Docker logs...$(RESET)"
	@docker ps -q | xargs -I {} docker inspect --format='{{.LogPath}}' {} | xargs -I {} sh -c 'truncate -s 0 {} 2>/dev/null || true'
	@echo "$(GREEN)Logs cleared!$(RESET)"

logs-size: ## Show log file sizes
	@echo "$(CYAN)Docker log sizes:$(RESET)"
	@docker ps -q | xargs -I {} sh -c 'echo -n "{}: " && docker inspect --format="{{.Name}} {{.LogPath}}" {} | xargs -I @ sh -c "echo @ && du -h @" 2>/dev/null | tail -1' | grep -v "^$$"

logs-docs: ## Open logging documentation
	@echo "$(CYAN)Logging documentation:$(RESET)"
	@echo "  - README: libs/infrastructure/src/lib/logging/README.md"
	@echo "  - Quick Start: LOGGING_QUICK_START.md"
	@echo "  - Implementation Report: LOGGING_IMPLEMENTATION_REPORT.md"
	@echo "  - Docker Config: infrastructure/docker/logging-config-template.yml"
	@echo ""
	@cat LOGGING_QUICK_START.md 2>/dev/null || echo "$(YELLOW)Quick start guide not found$(RESET)"

start-backend:
	npx nx run-many --target=serve --projects=api-gateway,auth-service --parallel