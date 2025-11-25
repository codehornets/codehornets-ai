#!/bin/bash
# =============================================================================
# FunnelAgents - Health Check Script
# =============================================================================
# Performs comprehensive health checks on all services
# Usage: ./health-check.sh [options]
# Options:
#   --service <name>     Check specific service only
#   --timeout <seconds>  Timeout for each check (default: 30)
#   --continuous         Run checks continuously
#   --interval <seconds> Interval for continuous checks (default: 60)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.prod.yml"
ENV_FILE="${DOCKER_DIR}/.env.production"
TIMEOUT=30
CONTINUOUS=false
INTERVAL=60
SPECIFIC_SERVICE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SPECIFIC_SERVICE="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --continuous)
            CONTINUOUS=true
            shift
            ;;
        --interval)
            INTERVAL="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_docker() {
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        return 1
    fi
    return 0
}

check_container_status() {
    local service=$1
    local container_name="funnel-agents-${service}"

    log_info "Checking $service container status..."

    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$container_name")
        if [ "$status" = "running" ]; then
            log_success "$service is running"
            return 0
        else
            log_error "$service is not running (status: $status)"
            return 1
        fi
    else
        log_error "$service container not found"
        return 1
    fi
}

check_container_health() {
    local service=$1
    local container_name="funnel-agents-${service}"

    log_info "Checking $service health status..."

    if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

        case $health in
            healthy)
                log_success "$service is healthy"
                return 0
                ;;
            unhealthy)
                log_error "$service is unhealthy"
                return 1
                ;;
            starting)
                log_warning "$service is starting..."
                return 0
                ;;
            none)
                log_warning "$service has no health check configured"
                return 0
                ;;
            *)
                log_warning "$service health status: $health"
                return 0
                ;;
        esac
    else
        log_error "$service container not found"
        return 1
    fi
}

check_http_endpoint() {
    local service=$1
    local port=$2
    local path=${3:-/health}

    log_info "Checking $service HTTP endpoint..."

    # Try internal docker network first
    local container_name="funnel-agents-${service}"
    if docker exec "$container_name" wget --spider --timeout=$TIMEOUT -q "http://localhost:${port}${path}" 2>/dev/null; then
        log_success "$service HTTP endpoint is responding"
        return 0
    else
        log_error "$service HTTP endpoint is not responding"
        return 1
    fi
}

check_postgres() {
    log_info "Checking PostgreSQL..."

    if ! check_container_status "postgres"; then
        return 1
    fi

    if ! check_container_health "postgres"; then
        return 1
    fi

    # Check if PostgreSQL is accepting connections
    if docker exec funnel-agents-postgres pg_isready -U postgres >/dev/null 2>&1; then
        log_success "PostgreSQL is accepting connections"
        return 0
    else
        log_error "PostgreSQL is not accepting connections"
        return 1
    fi
}

check_redis() {
    log_info "Checking Redis..."

    if ! check_container_status "redis"; then
        return 1
    fi

    if ! check_container_health "redis"; then
        return 1
    fi

    # Check if Redis is responding
    source "$ENV_FILE"
    if docker exec funnel-agents-redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        log_success "Redis is responding"
        return 0
    else
        log_error "Redis is not responding"
        return 1
    fi
}

check_nginx() {
    log_info "Checking Nginx..."

    if ! check_container_status "nginx"; then
        return 1
    fi

    if ! check_container_health "nginx"; then
        return 1
    fi

    # Check if Nginx configuration is valid
    if docker exec funnel-agents-nginx nginx -t >/dev/null 2>&1; then
        log_success "Nginx configuration is valid"
        return 0
    else
        log_error "Nginx configuration is invalid"
        return 1
    fi
}

check_microservice() {
    local service=$1
    local port=$2

    log_info "Checking $service microservice..."

    if ! check_container_status "$service"; then
        return 1
    fi

    if ! check_container_health "$service"; then
        return 1
    fi

    if ! check_http_endpoint "$service" "$port" "/health"; then
        return 1
    fi

    return 0
}

check_all_services() {
    local failed=0

    echo ""
    echo "=========================================="
    echo "FunnelAgents Health Check"
    echo "Timestamp: $(date)"
    echo "=========================================="
    echo ""

    # Infrastructure services
    echo "Infrastructure Services:"
    echo "----------------------------------------"
    check_postgres || ((failed++))
    check_redis || ((failed++))
    check_nginx || ((failed++))
    echo ""

    # Microservices
    echo "Microservices:"
    echo "----------------------------------------"
    check_microservice "api-gateway" 3000 || ((failed++))
    check_microservice "auth-service" 3001 || ((failed++))
    check_microservice "crm-service" 3002 || ((failed++))
    check_microservice "campaigns-service" 3003 || ((failed++))
    check_microservice "content-service" 3004 || ((failed++))
    check_microservice "agents-service" 3005 || ((failed++))
    check_microservice "tasks-service" 3006 || ((failed++))
    check_microservice "automations-service" 3007 || ((failed++))
    check_microservice "reports-service" 3008 || ((failed++))
    check_microservice "worker-runner" 3009 || ((failed++))
    check_microservice "scheduler" 3010 || ((failed++))
    echo ""

    # n8n
    echo "Workflow Automation:"
    echo "----------------------------------------"
    check_container_status "n8n" || ((failed++))
    check_container_health "n8n" || ((failed++))
    echo ""

    # Web UI
    echo "Frontend:"
    echo "----------------------------------------"
    check_container_status "web-ui" || ((failed++))
    echo ""

    # Summary
    echo "=========================================="
    if [ $failed -eq 0 ]; then
        log_success "All health checks passed!"
        return 0
    else
        log_error "$failed health check(s) failed"
        return 1
    fi
}

check_specific_service() {
    local service=$SPECIFIC_SERVICE

    echo ""
    echo "=========================================="
    echo "Checking $service"
    echo "=========================================="
    echo ""

    case $service in
        postgres)
            check_postgres
            ;;
        redis)
            check_redis
            ;;
        nginx)
            check_nginx
            ;;
        api-gateway)
            check_microservice "api-gateway" 3000
            ;;
        auth-service)
            check_microservice "auth-service" 3001
            ;;
        crm-service)
            check_microservice "crm-service" 3002
            ;;
        campaigns-service)
            check_microservice "campaigns-service" 3003
            ;;
        content-service)
            check_microservice "content-service" 3004
            ;;
        agents-service)
            check_microservice "agents-service" 3005
            ;;
        tasks-service)
            check_microservice "tasks-service" 3006
            ;;
        automations-service)
            check_microservice "automations-service" 3007
            ;;
        reports-service)
            check_microservice "reports-service" 3008
            ;;
        worker-runner)
            check_microservice "worker-runner" 3009
            ;;
        scheduler)
            check_microservice "scheduler" 3010
            ;;
        n8n)
            check_container_status "n8n"
            check_container_health "n8n"
            ;;
        web-ui)
            check_container_status "web-ui"
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
}

show_resource_usage() {
    echo ""
    echo "=========================================="
    echo "Resource Usage"
    echo "=========================================="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -20
    echo ""
}

# Main function
main() {
    # Check if Docker is running
    if ! check_docker; then
        exit 1
    fi

    # Check if running in continuous mode
    if [ "$CONTINUOUS" = true ]; then
        log_info "Running in continuous mode (interval: ${INTERVAL}s). Press Ctrl+C to stop."
        while true; do
            if [ -n "$SPECIFIC_SERVICE" ]; then
                check_specific_service
            else
                check_all_services
                show_resource_usage
            fi
            sleep "$INTERVAL"
            clear
        done
    else
        # Single check
        if [ -n "$SPECIFIC_SERVICE" ]; then
            check_specific_service
        else
            check_all_services
            show_resource_usage
        fi
    fi
}

# Run main function
main
