#!/bin/sh
# ============================================================================
# n8n Health Check Script
# ============================================================================
# This script performs comprehensive health checks for the n8n service:
# - HTTP endpoint availability
# - Database connectivity
# - Redis connectivity
# - Disk space availability
# - Memory usage
#
# Exit codes:
#   0 - Healthy
#   1 - Unhealthy
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
N8N_URL="${N8N_URL:-http://localhost:5678}"
HEALTH_ENDPOINT="${N8N_URL}/healthz"
MAX_MEMORY_PERCENT=90
MIN_DISK_MB=100

# ============================================================================
# Color output (if terminal supports it)
# ============================================================================
if [ -t 1 ]; then
    GREEN='\033[0;32m'
    RED='\033[0;31m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
else
    GREEN=''
    RED=''
    YELLOW=''
    NC=''
fi

# ============================================================================
# Utility Functions
# ============================================================================
log_success() {
    echo "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo "${YELLOW}[WARN]${NC} $1"
}

# ============================================================================
# Health Check Functions
# ============================================================================

# Check HTTP endpoint
check_http_endpoint() {
    if wget --no-verbose --tries=1 --spider --timeout=5 "$HEALTH_ENDPOINT" 2>/dev/null; then
        log_success "HTTP endpoint is responding"
        return 0
    else
        log_error "HTTP endpoint is not responding"
        return 1
    fi
}

# Check database connectivity (MySQL)
check_database() {
    if [ -n "$DB_MYSQLDB_HOST" ]; then
        if nc -z -w5 "$DB_MYSQLDB_HOST" "${DB_MYSQLDB_PORT:-3306}" 2>/dev/null; then
            log_success "Database is reachable"
            return 0
        else
            log_error "Database is not reachable"
            return 1
        fi
    else
        log_warning "Database check skipped (not configured)"
        return 0
    fi
}

# Check Redis connectivity
check_redis() {
    if [ -n "$QUEUE_BULL_REDIS_HOST" ]; then
        if nc -z -w5 "$QUEUE_BULL_REDIS_HOST" "${QUEUE_BULL_REDIS_PORT:-6379}" 2>/dev/null; then
            log_success "Redis is reachable"
            return 0
        else
            log_error "Redis is not reachable"
            return 1
        fi
    else
        log_warning "Redis check skipped (not configured)"
        return 0
    fi
}

# Check disk space
check_disk_space() {
    AVAILABLE_MB=$(df -m /home/node/.n8n 2>/dev/null | awk 'NR==2 {print $4}')

    if [ -n "$AVAILABLE_MB" ] && [ "$AVAILABLE_MB" -gt "$MIN_DISK_MB" ]; then
        log_success "Disk space available: ${AVAILABLE_MB}MB"
        return 0
    else
        log_error "Low disk space: ${AVAILABLE_MB}MB (minimum: ${MIN_DISK_MB}MB)"
        return 1
    fi
}

# Check memory usage
check_memory() {
    if [ -f /proc/meminfo ]; then
        MEM_TOTAL=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
        MEM_AVAIL=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
        MEM_USED=$((MEM_TOTAL - MEM_AVAIL))
        MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))

        if [ "$MEM_PERCENT" -lt "$MAX_MEMORY_PERCENT" ]; then
            log_success "Memory usage: ${MEM_PERCENT}%"
            return 0
        else
            log_warning "High memory usage: ${MEM_PERCENT}%"
            return 0  # Warning, not failure
        fi
    else
        log_warning "Memory check skipped (no /proc/meminfo)"
        return 0
    fi
}

# Check if n8n process is running
check_process() {
    if pgrep -f "n8n" > /dev/null 2>&1; then
        log_success "n8n process is running"
        return 0
    else
        log_error "n8n process is not running"
        return 1
    fi
}

# ============================================================================
# Main Health Check
# ============================================================================
main() {
    echo "============================================================================"
    echo "n8n Health Check - $(date)"
    echo "============================================================================"

    HEALTH_STATUS=0

    # Run all health checks
    check_http_endpoint || HEALTH_STATUS=1
    check_process || HEALTH_STATUS=1
    check_database || HEALTH_STATUS=1
    check_redis || HEALTH_STATUS=1
    check_disk_space || HEALTH_STATUS=1
    check_memory || HEALTH_STATUS=1

    echo "============================================================================"

    if [ $HEALTH_STATUS -eq 0 ]; then
        echo "${GREEN}Overall Status: HEALTHY${NC}"
        exit 0
    else
        echo "${RED}Overall Status: UNHEALTHY${NC}"
        exit 1
    fi
}

# Run health check
main "$@"
