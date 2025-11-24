#!/bin/bash
# ============================================================================
# Backup n8n Workflow Data
# ============================================================================
# This script creates a complete backup of n8n data including:
# - Workflows
# - Credentials (encrypted)
# - Settings
# - Execution history
# - Database
#
# Usage:
#   ./infrastructure/docker/scripts/backup-workflow.sh [backup_name]
#   make workflow-backup
#
# Exit codes:
#   0 - Success
#   1 - Backup failed
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/infrastructure/docker/docker-compose.workflow.yml"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/workflow}"
BACKUP_NAME="${1:-backup-$(date +%Y%m%d-%H%M%S)}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Retention policy (days)
RETENTION_DAYS=${RETENTION_DAYS:-30}

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================================
# Backup Functions
# ============================================================================
prepare_backup_dir() {
    log_info "Preparing backup directory..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/temp"
}

backup_n8n_data() {
    log_info "Backing up n8n data volume..."

    docker run --rm \
        -v painterflow-crm_n8n-data:/data:ro \
        -v "$BACKUP_DIR/temp":/backup \
        alpine \
        tar czf /backup/n8n-data.tar.gz -C /data . 2>/dev/null

    if [ -f "$BACKUP_DIR/temp/n8n-data.tar.gz" ]; then
        log_success "n8n data backed up"
    else
        log_error "Failed to backup n8n data"
        return 1
    fi
}

backup_n8n_files() {
    log_info "Backing up n8n files..."

    docker run --rm \
        -v painterflow-crm_n8n-files:/files:ro \
        -v "$BACKUP_DIR/temp":/backup \
        alpine \
        tar czf /backup/n8n-files.tar.gz -C /files . 2>/dev/null

    if [ -f "$BACKUP_DIR/temp/n8n-files.tar.gz" ]; then
        log_success "n8n files backed up"
    else
        log_error "Failed to backup n8n files"
        return 1
    fi
}

backup_database() {
    log_info "Backing up n8n database..."

    docker-compose -f "$COMPOSE_FILE" exec -T mysql \
        mysqldump -u root -p"${DB_ROOT_PASSWORD:-root}" \
        --databases n8n \
        --single-transaction \
        --quick \
        --lock-tables=false \
        > "$BACKUP_DIR/temp/n8n-database.sql" 2>/dev/null

    if [ -f "$BACKUP_DIR/temp/n8n-database.sql" ]; then
        gzip "$BACKUP_DIR/temp/n8n-database.sql"
        log_success "Database backed up"
    else
        log_error "Failed to backup database"
        return 1
    fi
}

create_metadata() {
    log_info "Creating backup metadata..."

    cat > "$BACKUP_DIR/temp/metadata.json" <<EOF
{
    "backup_name": "$BACKUP_NAME",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "${APP_ENV:-local}",
    "n8n_version": "$(docker-compose -f $COMPOSE_FILE exec -T n8n n8n --version 2>/dev/null || echo 'unknown')",
    "hostname": "$(hostname)",
    "backup_type": "full"
}
EOF

    log_success "Metadata created"
}

create_archive() {
    log_info "Creating backup archive..."

    cd "$BACKUP_DIR/temp"
    tar czf "$BACKUP_PATH" ./*

    if [ -f "$BACKUP_PATH" ]; then
        local size=$(du -h "$BACKUP_PATH" | cut -f1)
        log_success "Backup archive created: $BACKUP_PATH ($size)"
    else
        log_error "Failed to create backup archive"
        return 1
    fi
}

cleanup_temp() {
    log_info "Cleaning up temporary files..."
    rm -rf "$BACKUP_DIR/temp"
    log_success "Cleanup complete"
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."

    find "$BACKUP_DIR" -name "backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

    local count=$(find "$BACKUP_DIR" -name "backup-*.tar.gz" -type f | wc -l)
    log_success "Backup retention: $count backups kept"
}

verify_backup() {
    log_info "Verifying backup integrity..."

    if tar tzf "$BACKUP_PATH" > /dev/null 2>&1; then
        log_success "Backup integrity verified"
        return 0
    else
        log_error "Backup integrity check failed"
        return 1
    fi
}

# ============================================================================
# Main Script
# ============================================================================
main() {
    echo "============================================================================"
    echo "n8n Workflow Automation - Backup"
    echo "============================================================================"
    echo ""

    prepare_backup_dir

    # Create backups
    backup_n8n_data || exit 1
    backup_n8n_files || exit 1
    backup_database || exit 1
    create_metadata

    # Create archive
    create_archive || exit 1

    # Cleanup
    cleanup_temp
    cleanup_old_backups

    # Verify
    verify_backup || exit 1

    echo ""
    echo "============================================================================"
    log_success "Backup completed successfully!"
    echo "============================================================================"
    echo ""
    echo "Backup location: $BACKUP_PATH"
    echo ""
    echo "To restore this backup:"
    echo "  make workflow-restore backup=$BACKUP_PATH"
    echo ""
}

main "$@"
