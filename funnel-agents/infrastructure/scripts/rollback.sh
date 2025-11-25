#!/bin/bash
# =============================================================================
# FunnelAgents - Rollback Script
# =============================================================================
# Rolls back to a previous deployment state
# Usage: ./rollback.sh [options]
# Options:
#   --backup <file>      Restore from specific backup file
#   --list               List available backups
#   --force              Skip confirmation prompts

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.prod.yml"
ENV_FILE="${DOCKER_DIR}/.env.production"
BACKUP_DIR="${DOCKER_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE=""
LIST_BACKUPS=false
FORCE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --list)
            LIST_BACKUPS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    if [ "$FORCE" = true ]; then
        return 0
    fi
    read -p "$1 (y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

list_available_backups() {
    log_info "Available backups:"
    echo "----------------------------------------"

    if [ ! -d "$BACKUP_DIR" ]; then
        log_warning "No backup directory found"
        return 1
    fi

    # List SQL backup files
    local backups=$(find "$BACKUP_DIR" -name "pre_deploy_*.sql.gz" -type f | sort -r)

    if [ -z "$backups" ]; then
        log_warning "No backups found"
        return 1
    fi

    local count=1
    while IFS= read -r backup; do
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" | cut -f1)
        local date=$(stat -c %y "$backup" 2>/dev/null || stat -f "%Sm" "$backup")
        echo "$count) $filename ($size) - $date"
        count=$((count + 1))
    done <<< "$backups"

    echo "----------------------------------------"
}

select_backup() {
    if [ -n "$BACKUP_FILE" ]; then
        if [ ! -f "$BACKUP_FILE" ]; then
            log_error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
        return 0
    fi

    # List available backups
    list_available_backups

    # Prompt user to select backup
    echo ""
    read -p "Enter backup number to restore (or 'q' to quit): " selection

    if [ "$selection" = "q" ]; then
        log_warning "Rollback cancelled"
        exit 0
    fi

    # Get the selected backup file
    local backups=$(find "$BACKUP_DIR" -name "pre_deploy_*.sql.gz" -type f | sort -r)
    BACKUP_FILE=$(echo "$backups" | sed -n "${selection}p")

    if [ -z "$BACKUP_FILE" ]; then
        log_error "Invalid selection"
        exit 1
    fi

    log_info "Selected backup: $(basename "$BACKUP_FILE")"
}

create_safety_backup() {
    log_info "Creating safety backup before rollback..."

    if [ -f "${SCRIPT_DIR}/backup.sh" ]; then
        mkdir -p "$BACKUP_DIR"
        bash "${SCRIPT_DIR}/backup.sh" --output="${BACKUP_DIR}/pre_rollback_${TIMESTAMP}.sql.gz"
        log_success "Safety backup created: pre_rollback_${TIMESTAMP}.sql.gz"
    else
        log_warning "Backup script not found. Skipping safety backup."
    fi
}

stop_services() {
    log_info "Stopping services..."

    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop

    log_success "Services stopped"
}

restore_database() {
    log_info "Restoring database from backup..."

    if [ -z "$BACKUP_FILE" ]; then
        log_error "No backup file specified"
        return 1
    fi

    # Get database credentials from environment
    source "$ENV_FILE"

    # Get postgres password from secrets
    local POSTGRES_PASSWORD=$(cat "${DOCKER_DIR}/secrets/postgres_password.txt")

    # Start postgres if not running
    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres

    # Wait for postgres to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    sleep 10

    # Restore database
    log_info "Restoring from: $(basename "$BACKUP_FILE")"

    # Drop and recreate database
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -c "CREATE DATABASE ${POSTGRES_DB};"

    # Restore backup
    gunzip -c "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

    if [ $? -eq 0 ]; then
        log_success "Database restored successfully"
        return 0
    else
        log_error "Database restoration failed"
        return 1
    fi
}

restart_services() {
    log_info "Restarting all services..."

    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 15

    log_success "Services restarted"
}

verify_rollback() {
    log_info "Verifying rollback..."

    if [ -f "${SCRIPT_DIR}/health-check.sh" ]; then
        bash "${SCRIPT_DIR}/health-check.sh"
        return $?
    else
        log_warning "Health check script not found"
        return 0
    fi
}

show_rollback_info() {
    log_info "Rollback Information:"
    echo "----------------------------------------"
    echo "Timestamp: $TIMESTAMP"
    echo "Restored from: $(basename "$BACKUP_FILE")"
    echo "Safety backup: pre_rollback_${TIMESTAMP}.sql.gz"
    echo "----------------------------------------"

    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Main rollback flow
main() {
    log_warning "Starting FunnelAgents Rollback Process"
    log_info "Timestamp: $TIMESTAMP"

    # Handle list command
    if [ "$LIST_BACKUPS" = true ]; then
        list_available_backups
        exit 0
    fi

    # Select backup to restore
    select_backup

    # Confirm rollback
    if ! confirm "Are you sure you want to rollback to $(basename "$BACKUP_FILE")?"; then
        log_warning "Rollback cancelled"
        exit 0
    fi

    log_warning "This will restore the database and restart all services!"
    if ! confirm "Continue with rollback?"; then
        log_warning "Rollback cancelled"
        exit 0
    fi

    # Create safety backup
    create_safety_backup

    # Stop services
    stop_services

    # Restore database
    if ! restore_database; then
        log_error "Rollback failed during database restoration"
        exit 1
    fi

    # Restart services
    restart_services

    # Verify rollback
    if ! verify_rollback; then
        log_warning "Health checks failed after rollback"
        log_warning "Please investigate the issue"
    fi

    # Show rollback info
    show_rollback_info

    log_success "Rollback completed successfully!"
    log_info "If you need to undo this rollback, you can restore from: pre_rollback_${TIMESTAMP}.sql.gz"
}

# Run main function
main
