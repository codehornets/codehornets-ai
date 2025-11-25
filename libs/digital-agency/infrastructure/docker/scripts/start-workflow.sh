#!/bin/bash
# ============================================================================
# Start n8n Workflow Automation Service
# ============================================================================
# This script starts the n8n workflow automation service with proper
# validation, health checks, and initialization.
#
# Usage:
#   ./infrastructure/docker/scripts/start-workflow.sh
#   make workflow-up
#
# Exit codes:
#   0 - Success
#   1 - Configuration error
#   2 - Service start failed
#   3 - Health check failed
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/infrastructure/docker/docker-compose.workflow.yml"
ENV_FILE="$PROJECT_ROOT/.env.workflow"
HEALTH_CHECK_TIMEOUT=120
HEALTH_CHECK_INTERVAL=5

# ============================================================================
# Colors
# ============================================================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Utility Functions
# ============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# Validation Functions
# ============================================================================
check_requirements() {
    log_info "Checking requirements..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log_success "All requirements satisfied"
}

validate_configuration() {
    log_info "Validating configuration..."

    # Check compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found: $ENV_FILE"
        log_info "Creating from template..."

        if [ -f "$PROJECT_ROOT/.env.workflow.template" ]; then
            cp "$PROJECT_ROOT/.env.workflow.template" "$ENV_FILE"
        else
            log_error "No environment template found"
            exit 1
        fi
    fi

    # Validate compose file syntax
    if ! docker-compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
        log_error "Invalid Docker Compose configuration"
        docker-compose -f "$COMPOSE_FILE" config
        exit 1
    fi

    log_success "Configuration validated"
}

# ============================================================================
# Service Management Functions
# ============================================================================
check_service_running() {
    docker-compose -f "$COMPOSE_FILE" ps n8n | grep -q "Up"
}

start_services() {
    log_info "Starting n8n workflow automation services..."

    cd "$PROJECT_ROOT"

    # Pull latest images (optional)
    if [ "${PULL_IMAGES:-false}" = "true" ]; then
        log_info "Pulling latest images..."
        docker-compose -f "$COMPOSE_FILE" pull
    fi

    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d

    log_success "Services started"
}

wait_for_health() {
    log_info "Waiting for n8n to become healthy..."

    local elapsed=0
    local n8n_url="http://localhost:5678/healthz"

    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        if curl -sf "$n8n_url" > /dev/null 2>&1; then
            log_success "n8n is healthy!"
            return 0
        fi

        echo -n "."
        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
    done

    echo ""
    log_error "n8n failed to become healthy within ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

check_database() {
    log_info "Checking database connectivity..."

    # Wait for MySQL to be ready
    docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        log_success "Database is healthy"
        return 0
    else
        log_error "Database is not responding"
        return 1
    fi
}

check_redis() {
    log_info "Checking Redis connectivity..."

    # Wait for Redis to be ready
    docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping > /dev/null 2>&1

    if [ $? -eq 0 ]; then
        log_success "Redis is healthy"
        return 0
    else
        log_error "Redis is not responding"
        return 1
    fi
}

initialize_database() {
    log_info "Initializing n8n database..."

    # Create database if it doesn't exist
    docker-compose -f "$COMPOSE_FILE" exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD:-root}" -e "CREATE DATABASE IF NOT EXISTS n8n CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

    # Grant privileges
    docker-compose -f "$COMPOSE_FILE" exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD:-root}" -e "GRANT ALL PRIVILEGES ON n8n.* TO '${DB_USERNAME:-krayin_user}'@'%';" 2>/dev/null

    log_success "Database initialized"
}

show_status() {
    log_info "Service Status:"
    echo ""
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
}

show_access_info() {
    echo ""
    echo "============================================================================"
    log_success "n8n Workflow Automation is now running!"
    echo "============================================================================"
    echo ""
    echo -e "${GREEN}Access URLs:${NC}"
    echo "  - n8n UI:      http://localhost:5678"
    echo "  - Webhooks:    http://localhost/workflow/webhook/*"
    echo "  - Health:      http://localhost:5678/healthz"
    echo ""
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  - View logs:   make workflow-logs"
    echo "  - Status:      make workflow-status"
    echo "  - Stop:        make workflow-down"
    echo "  - Restart:     make workflow-restart"
    echo "  - Shell:       make workflow-shell"
    echo ""
    echo "============================================================================"
}

# ============================================================================
# Main Script
# ============================================================================
main() {
    echo "============================================================================"
    echo "Starting n8n Workflow Automation Service"
    echo "============================================================================"
    echo ""

    # Check if already running
    if check_service_running; then
        log_warning "n8n is already running"
        show_status
        exit 0
    fi

    # Pre-flight checks
    check_requirements
    validate_configuration

    # Start services
    start_services

    # Wait for dependencies
    sleep 5
    check_database || log_warning "Database check failed, continuing..."
    check_redis || log_warning "Redis check failed, continuing..."

    # Initialize database
    initialize_database

    # Health check
    if wait_for_health; then
        show_status
        show_access_info
        exit 0
    else
        log_error "Service health check failed"
        log_info "Showing recent logs:"
        docker-compose -f "$COMPOSE_FILE" logs --tail=50 n8n
        exit 3
    fi
}

# Run main function
main "$@"
