#!/bin/bash
# ============================================================================
# Comprehensive Health Check for n8n Workflow Automation
# ============================================================================
# This script performs comprehensive health checks for the n8n service
# and all its dependencies. Use for monitoring and alerting.
#
# Usage:
#   ./infrastructure/docker/scripts/health-check-workflow.sh
#   make workflow-health
#
# Exit codes:
#   0 - All checks passed (healthy)
#   1 - One or more checks failed (unhealthy)
#   2 - Critical failure
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/infrastructure/docker/docker-compose.workflow.yml"

N8N_URL="${N8N_URL:-http://localhost:5678}"
HEALTH_ENDPOINT="${N8N_URL}/healthz"

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# ============================================================================
# Colors
# ============================================================================
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
NC='\033[0m'

# ============================================================================
# Utility Functions
# ============================================================================
log_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((CHECKS_WARNING++))
}

log_info() {
    echo -e "${GRAY}       $1${NC}"
}

# ============================================================================
# Health Check Functions
# ============================================================================

check_docker_running() {
    log_check "Docker daemon status"

    if docker info &> /dev/null; then
        log_pass "Docker daemon is running"
        return 0
    else
        log_fail "Docker daemon is not running"
        return 1
    fi
}

check_containers_running() {
    log_check "Container status"

    local containers=("n8n" "mysql" "redis")
    local all_running=true

    for container in "${containers[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps "$container" 2>/dev/null | grep -q "Up"; then
            log_info "✓ $container is running"
        else
            log_fail "$container is not running"
            all_running=false
        fi
    done

    if [ "$all_running" = true ]; then
        log_pass "All containers are running"
        return 0
    else
        return 1
    fi
}

check_n8n_http() {
    log_check "n8n HTTP endpoint"

    local response=$(curl -sf -w "%{http_code}" -o /dev/null "$HEALTH_ENDPOINT" 2>/dev/null)

    if [ "$response" = "200" ]; then
        log_pass "n8n HTTP endpoint is healthy (HTTP $response)"
        return 0
    else
        log_fail "n8n HTTP endpoint is unhealthy (HTTP $response)"
        return 1
    fi
}

check_n8n_response_time() {
    log_check "n8n response time"

    local response_time=$(curl -sf -w "%{time_total}" -o /dev/null "$HEALTH_ENDPOINT" 2>/dev/null || echo "999")

    # Convert to milliseconds
    local ms=$(echo "$response_time * 1000 / 1" | bc)

    if [ "$ms" -lt 500 ]; then
        log_pass "n8n response time is good (${ms}ms)"
        log_info "Response time: ${ms}ms"
    elif [ "$ms" -lt 2000 ]; then
        log_warn "n8n response time is slow (${ms}ms)"
        log_info "Response time: ${ms}ms"
    else
        log_fail "n8n response time is too slow (${ms}ms)"
        log_info "Response time: ${ms}ms"
        return 1
    fi
}

check_database_connection() {
    log_check "MySQL database connection"

    if docker-compose -f "$COMPOSE_FILE" exec -T mysql mysqladmin ping -h localhost &>/dev/null; then
        log_pass "MySQL is reachable and healthy"

        # Check database exists
        local db_exists=$(docker-compose -f "$COMPOSE_FILE" exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD:-root}" -e "SHOW DATABASES LIKE 'n8n';" 2>/dev/null | grep -c "n8n" || echo "0")

        if [ "$db_exists" -gt 0 ]; then
            log_info "n8n database exists"
        else
            log_warn "n8n database does not exist"
        fi
    else
        log_fail "MySQL is not responding"
        return 1
    fi
}

check_redis_connection() {
    log_check "Redis connection"

    local redis_ping=$(docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null || echo "")

    if [ "$redis_ping" = "PONG" ]; then
        log_pass "Redis is reachable and healthy"

        # Check memory usage
        local memory_info=$(docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        log_info "Redis memory usage: $memory_info"
    else
        log_fail "Redis is not responding"
        return 1
    fi
}

check_disk_space() {
    log_check "Disk space availability"

    local n8n_container=$(docker-compose -f "$COMPOSE_FILE" ps -q n8n 2>/dev/null)

    if [ -n "$n8n_container" ]; then
        local disk_info=$(docker exec "$n8n_container" df -h /home/node/.n8n 2>/dev/null | awk 'NR==2 {print $4 " available (" $5 " used)"}')

        local usage=$(docker exec "$n8n_container" df /home/node/.n8n 2>/dev/null | awk 'NR==2 {print $5}' | tr -d '%')

        if [ "$usage" -lt 80 ]; then
            log_pass "Disk space is healthy"
            log_info "$disk_info"
        elif [ "$usage" -lt 90 ]; then
            log_warn "Disk space is running low"
            log_info "$disk_info"
        else
            log_fail "Disk space is critically low"
            log_info "$disk_info"
            return 1
        fi
    else
        log_warn "Cannot check disk space (container not found)"
    fi
}

check_memory_usage() {
    log_check "Container memory usage"

    local n8n_container=$(docker-compose -f "$COMPOSE_FILE" ps -q n8n 2>/dev/null)

    if [ -n "$n8n_container" ]; then
        local mem_stats=$(docker stats --no-stream --format "{{.MemUsage}}" "$n8n_container" 2>/dev/null)

        if [ -n "$mem_stats" ]; then
            log_pass "Memory usage: $mem_stats"
            log_info "$mem_stats"
        else
            log_warn "Cannot retrieve memory statistics"
        fi
    else
        log_warn "Cannot check memory usage (container not found)"
    fi
}

check_network_connectivity() {
    log_check "Network connectivity"

    local n8n_container=$(docker-compose -f "$COMPOSE_FILE" ps -q n8n 2>/dev/null)

    if [ -n "$n8n_container" ]; then
        # Test MySQL connection from n8n
        if docker exec "$n8n_container" nc -z mysql 3306 2>/dev/null; then
            log_info "✓ n8n → MySQL connection OK"
        else
            log_fail "n8n → MySQL connection failed"
            return 1
        fi

        # Test Redis connection from n8n
        if docker exec "$n8n_container" nc -z redis 6379 2>/dev/null; then
            log_info "✓ n8n → Redis connection OK"
        else
            log_fail "n8n → Redis connection failed"
            return 1
        fi

        log_pass "Network connectivity is healthy"
    else
        log_warn "Cannot check network (container not found)"
    fi
}

check_container_restarts() {
    log_check "Container restart count"

    local restart_count=$(docker inspect $(docker-compose -f "$COMPOSE_FILE" ps -q n8n 2>/dev/null) --format='{{.RestartCount}}' 2>/dev/null || echo "0")

    if [ "$restart_count" -eq 0 ]; then
        log_pass "No container restarts (stable)"
    elif [ "$restart_count" -lt 3 ]; then
        log_warn "Container has restarted $restart_count times"
    else
        log_fail "Container has restarted $restart_count times (unstable)"
        return 1
    fi
}

check_logs_for_errors() {
    log_check "Recent error logs"

    local error_count=$(docker-compose -f "$COMPOSE_FILE" logs --tail=100 n8n 2>/dev/null | grep -ci "error" || echo "0")

    if [ "$error_count" -eq 0 ]; then
        log_pass "No errors in recent logs"
    elif [ "$error_count" -lt 5 ]; then
        log_warn "$error_count errors found in recent logs"
    else
        log_fail "$error_count errors found in recent logs"
        log_info "Check logs with: make workflow-logs"
        return 1
    fi
}

check_webhook_availability() {
    log_check "Webhook endpoint availability"

    local webhook_url="${N8N_URL}/webhook/test"
    local response=$(curl -sf -w "%{http_code}" -o /dev/null "$webhook_url" 2>/dev/null || echo "000")

    # 404 is expected for non-existent webhook, means service is responding
    if [ "$response" = "404" ] || [ "$response" = "200" ]; then
        log_pass "Webhook endpoint is available (HTTP $response)"
    else
        log_fail "Webhook endpoint is not available (HTTP $response)"
        return 1
    fi
}

check_ssl_certificate() {
    log_check "SSL certificate (if HTTPS)"

    if [[ "$N8N_URL" == https://* ]]; then
        local domain=$(echo "$N8N_URL" | sed -e 's|^https://||' -e 's|/.*$||')
        local expiry=$(echo | openssl s_client -servername "$domain" -connect "${domain}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

        if [ -n "$expiry" ]; then
            log_pass "SSL certificate is valid"
            log_info "Expires: $expiry"
        else
            log_fail "SSL certificate check failed"
            return 1
        fi
    else
        log_info "Skipped (HTTP configuration)"
    fi
}

# ============================================================================
# Summary and Reporting
# ============================================================================
show_summary() {
    echo ""
    echo "============================================================================"
    echo "Health Check Summary"
    echo "============================================================================"
    echo ""

    echo -e "${GREEN}Passed:${NC}   $CHECKS_PASSED"
    echo -e "${YELLOW}Warnings:${NC} $CHECKS_WARNING"
    echo -e "${RED}Failed:${NC}   $CHECKS_FAILED"
    echo ""

    local total=$((CHECKS_PASSED + CHECKS_WARNING + CHECKS_FAILED))
    local success_rate=$(echo "scale=2; $CHECKS_PASSED * 100 / $total" | bc)

    echo "Success Rate: ${success_rate}%"
    echo ""

    if [ "$CHECKS_FAILED" -eq 0 ]; then
        echo -e "${GREEN}Status: HEALTHY ✓${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}Status: UNHEALTHY ✗${NC}"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Check logs: make workflow-logs"
        echo "  2. Restart service: make workflow-restart"
        echo "  3. Check configuration: infrastructure/docker/docker-compose.workflow.yml"
        echo ""
        return 1
    fi
}

# ============================================================================
# Main Script
# ============================================================================
main() {
    echo "============================================================================"
    echo "n8n Workflow Automation - Comprehensive Health Check"
    echo "============================================================================"
    echo ""
    echo "Timestamp: $(date)"
    echo "Environment: ${APP_ENV:-local}"
    echo ""

    # Run all health checks
    check_docker_running || exit 2
    check_containers_running || exit 2
    check_n8n_http
    check_n8n_response_time
    check_database_connection
    check_redis_connection
    check_disk_space
    check_memory_usage
    check_network_connectivity
    check_container_restarts
    check_logs_for_errors
    check_webhook_availability
    check_ssl_certificate

    # Show summary and exit
    show_summary
}

# Run main function
main "$@"
