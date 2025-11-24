# FunnelAgents Makefile
# Streamlined development commands for Nx + NestJS monorepo

.PHONY: help install dev start stop build test lint clean docker db web

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

##@ Testing

test: ## Run all tests
	npx nx run-many --target=test --all

test-affected: ## Run tests for affected projects only
	npx nx affected --target=test

test-coverage: ## Run tests with coverage report
	npx nx run-many --target=test --all --coverage

test-watch: ## Run tests in watch mode
	npx nx run-many --target=test --all --watch

test-gateway: ## Test API gateway
	npx nx test api-gateway

test-libs: ## Test all shared libraries
	npx nx run-many --target=test --projects=tag:type:lib

e2e: ## Run E2E tests
	npx nx run-many --target=e2e --all

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

##@ Database

db-up: ## Start database containers
	docker compose up -d postgres redis

db-down: ## Stop database containers
	docker compose down

db-migrate: ## Run database migrations
	npx nx run infrastructure:migrate

db-seed: ## Seed database with sample data
	npx nx run infrastructure:seed

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
