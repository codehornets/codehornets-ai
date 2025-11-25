# CRM Service Makefile

.PHONY: help dev build test lint format clean db-setup db-migrate db-reset

# Default target
help:
	@echo "CRM Service - Available Commands:"
	@echo ""
	@echo "  make dev         - Run service in development mode"
	@echo "  make build       - Build the service"
	@echo "  make test        - Run tests"
	@echo "  make test-watch  - Run tests in watch mode"
	@echo "  make test-cov    - Run tests with coverage"
	@echo "  make lint        - Lint the code"
	@echo "  make lint-fix    - Lint and fix the code"
	@echo "  make format      - Format the code"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make db-setup    - Setup database (run migrations)"
	@echo "  make db-reset    - Reset database"
	@echo ""

# Development
dev:
	npx nx serve crm-service

# Build
build:
	npx nx build crm-service

# Testing
test:
	npx nx test crm-service

test-watch:
	npx nx test crm-service --watch

test-cov:
	npx nx test crm-service --coverage

# Code Quality
lint:
	npx nx lint crm-service

lint-fix:
	npx nx lint crm-service --fix

format:
	npx prettier --write "apps/crm-service/src/**/*.ts"

# Clean
clean:
	rm -rf dist/apps/crm-service
	rm -rf apps/crm-service/coverage

# Database
db-setup:
	@echo "Running database migrations..."
	psql $(DATABASE_URL) -f apps/crm-service/migrations/001_initial_schema.sql

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		psql $(DATABASE_URL) -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"; \
		$(MAKE) db-setup; \
	fi

# Docker
docker-build:
	docker build -t funnelagents/crm-service -f apps/crm-service/Dockerfile .

docker-run:
	docker run -p 3002:3002 --env-file .env funnelagents/crm-service

# All in one setup
setup: db-setup
	@echo "CRM Service setup complete!"
