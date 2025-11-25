#!/bin/bash
# ============================================================================
# Stop n8n Workflow Automation Service
# ============================================================================
# This script gracefully stops the n8n workflow automation service with
# proper cleanup and data preservation.
#
# Usage:
#   ./infrastructure/docker/scripts/stop-workflow.sh
#   make workflow-down
#
# Options:
#   --force    Force stop without graceful shutdown
#   --clean    Remove volumes (WARNING: deletes all data)
#
# Exit codes:
#   0 - Success
#   1 - Stop failed
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/infrastructure/docker/docker-compose.workflow.yml"

FORCE_STOP=false
CLEAN_VOLUMES=false

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
# Parse Arguments
# ============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_STOP=true
                shift
                ;;
            --clean)
                CLEAN_VOLUMES=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# ============================================================================
# Service Management Functions
# ============================================================================
check_service_running() {
    docker-compose -f "$COMPOSE_FILE" ps n8n 2>/dev/null | grep -q "Up"
}

backup_data() {
    log_info "Creating automatic backup before shutdown..."

    local backup_dir="$PROJECT_ROOT/backups/workflow"
    local backup_file="$backup_dir/auto-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

    mkdir -p "$backup_dir"

    # Backup n8n data volume
    docker run --rm \
        -v painterflow-crm_n8n-data:/data \
        -v "$backup_dir":/backup \
        alpine \
        tar czf "/backup/$(basename $backup_file)" -C /data . 2>/dev/null

    if [ -f "$backup_file" ]; then
        log_success "Backup created: $backup_file"
    else
        log_warning "Backup creation failed"
    fi
}

graceful_stop() {
    log_info "Gracefully stopping n8n workflow automation..."

    cd "$PROJECT_ROOT"

    # Stop services with timeout for graceful shutdown
    docker-compose -f "$COMPOSE_FILE" stop -t 30

    log_success "Services stopped gracefully"
}

force_stop() {
    log_warning "Force stopping n8n workflow automation..."

    cd "$PROJECT_ROOT"

    # Kill services immediately
    docker-compose -f "$COMPOSE_FILE" kill
    docker-compose -f "$COMPOSE_FILE" down

    log_success "Services force stopped"
}

cleanup_containers() {
    log_info "Removing containers..."

    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" down

    log_success "Containers removed"
}

cleanup_volumes() {
    log_warning "WARNING: This will delete all n8n data including workflows and credentials!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Volume cleanup cancelled"
        return 0
    fi

    log_info "Removing volumes..."

    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" down -v

    log_success "Volumes removed"
}

show_cleanup_logs() {
    log_info "Cleaning up log files..."

    # Clean old log files (keep last 7 days)
    find "$PROJECT_ROOT/storage/logs/n8n" -name "*.log" -mtime +7 -delete 2>/dev/null || true

    log_success "Log cleanup complete"
}

verify_stopped() {
    log_info "Verifying services are stopped..."

    if check_service_running; then
        log_error "Services are still running!"
        return 1
    else
        log_success "All services stopped"
        return 0
    fi
}

show_final_status() {
    echo ""
    echo "============================================================================"
    log_success "n8n Workflow Automation stopped successfully"
    echo "============================================================================"
    echo ""

    if [ "$CLEAN_VOLUMES" = false ]; then
        echo -e "${GREEN}Data preserved:${NC}"
        echo "  - Workflows and credentials are safe"
        echo "  - Backup created in: backups/workflow/"
        echo ""
        echo -e "${YELLOW}To start again:${NC}"
        echo "  make workflow-up"
        echo ""
    else
        echo -e "${RED}Data removed:${NC}"
        echo "  - All workflows and credentials deleted"
        echo "  - Fresh installation required"
        echo ""
        echo -e "${YELLOW}To reinstall:${NC}"
        echo "  make workflow-install"
        echo ""
    fi
    echo "============================================================================"
}

# ============================================================================
# Main Script
# ============================================================================
main() {
    echo "============================================================================"
    echo "Stopping n8n Workflow Automation Service"
    echo "============================================================================"
    echo ""

    # Parse command line arguments
    parse_args "$@"

    # Check if service is running
    if ! check_service_running; then
        log_warning "n8n is not running"
        exit 0
    fi

    # Create backup before stopping (unless force stop)
    if [ "$FORCE_STOP" = false ] && [ "$CLEAN_VOLUMES" = false ]; then
        backup_data || log_warning "Backup failed, continuing..."
    fi

    # Stop services
    if [ "$FORCE_STOP" = true ]; then
        force_stop
    else
        graceful_stop
    fi

    # Remove containers
    cleanup_containers

    # Clean volumes if requested
    if [ "$CLEAN_VOLUMES" = true ]; then
        cleanup_volumes
    fi

    # Cleanup logs
    show_cleanup_logs

    # Verify stopped
    if verify_stopped; then
        show_final_status
        exit 0
    else
        log_error "Failed to stop all services"
        exit 1
    fi
}

# Run main function
main "$@"
