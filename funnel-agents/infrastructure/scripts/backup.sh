#!/bin/bash
# =============================================================================
# FunnelAgents - Database Backup Script
# =============================================================================
# Creates compressed backups of PostgreSQL databases
# Usage: ./backup.sh [options]
# Options:
#   --output <file>      Output file path (default: auto-generated)
#   --s3-bucket <name>   Upload to S3 bucket
#   --gcs-bucket <name>  Upload to GCS bucket
#   --retention <days>   Delete backups older than N days (default: 30)

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.prod.yml"
ENV_FILE="${DOCKER_DIR}/.env.production"
BACKUP_DIR="${DOCKER_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE=""
S3_BUCKET=""
GCS_BUCKET=""
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --s3-bucket)
            S3_BUCKET="$2"
            shift 2
            ;;
        --gcs-bucket)
            GCS_BUCKET="$2"
            shift 2
            ;;
        --retention)
            RETENTION_DAYS="$2"
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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi

    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        exit 1
    fi

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    log_success "Prerequisites check passed"
}

create_postgres_backup() {
    log_info "Creating PostgreSQL backup..."

    # Load environment variables
    source "$ENV_FILE"

    # Get postgres password from secrets
    local POSTGRES_PASSWORD=$(cat "${DOCKER_DIR}/secrets/postgres_password.txt")

    # Set default output file if not specified
    if [ -z "$OUTPUT_FILE" ]; then
        OUTPUT_FILE="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"
    fi

    # Create backup using pg_dump
    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --create | gzip > "$OUTPUT_FILE"

    if [ $? -eq 0 ]; then
        local size=$(du -h "$OUTPUT_FILE" | cut -f1)
        log_success "Backup created: $(basename "$OUTPUT_FILE") ($size)"
        return 0
    else
        log_error "Backup failed"
        return 1
    fi
}

create_redis_backup() {
    log_info "Creating Redis backup..."

    # Create Redis data snapshot
    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis \
        redis-cli --pass "$REDIS_PASSWORD" BGSAVE >/dev/null 2>&1

    # Wait for background save to complete
    sleep 5

    # Copy dump.rdb file
    local redis_backup="${BACKUP_DIR}/redis_dump_${TIMESTAMP}.rdb"
    docker cp funnel-agents-redis:/data/dump.rdb "$redis_backup" 2>/dev/null || true

    if [ -f "$redis_backup" ]; then
        local size=$(du -h "$redis_backup" | cut -f1)
        log_success "Redis backup created: $(basename "$redis_backup") ($size)"
        return 0
    else
        log_warning "Redis backup not found (this is normal if no data has been persisted)"
        return 0
    fi
}

create_n8n_backup() {
    log_info "Creating n8n data backup..."

    # Create tar archive of n8n data
    local n8n_backup="${BACKUP_DIR}/n8n_data_${TIMESTAMP}.tar.gz"

    docker run --rm \
        --volumes-from funnel-agents-n8n \
        -v "${BACKUP_DIR}:/backup" \
        alpine:latest \
        tar czf "/backup/$(basename "$n8n_backup")" /home/node/.n8n 2>/dev/null || true

    if [ -f "$n8n_backup" ]; then
        local size=$(du -h "$n8n_backup" | cut -f1)
        log_success "n8n backup created: $(basename "$n8n_backup") ($size)"
        return 0
    else
        log_warning "n8n backup creation skipped"
        return 0
    fi
}

upload_to_s3() {
    if [ -z "$S3_BUCKET" ]; then
        return 0
    fi

    log_info "Uploading to S3 bucket: $S3_BUCKET"

    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not installed. Skipping S3 upload."
        return 1
    fi

    # Upload backup file
    if [ -f "$OUTPUT_FILE" ]; then
        aws s3 cp "$OUTPUT_FILE" "s3://${S3_BUCKET}/postgres/$(basename "$OUTPUT_FILE")"

        if [ $? -eq 0 ]; then
            log_success "Backup uploaded to S3"
            return 0
        else
            log_error "S3 upload failed"
            return 1
        fi
    fi
}

upload_to_gcs() {
    if [ -z "$GCS_BUCKET" ]; then
        return 0
    fi

    log_info "Uploading to GCS bucket: $GCS_BUCKET"

    # Check if gsutil is installed
    if ! command -v gsutil &> /dev/null; then
        log_warning "gsutil not installed. Skipping GCS upload."
        return 1
    fi

    # Upload backup file
    if [ -f "$OUTPUT_FILE" ]; then
        gsutil cp "$OUTPUT_FILE" "gs://${GCS_BUCKET}/postgres/$(basename "$OUTPUT_FILE")"

        if [ $? -eq 0 ]; then
            log_success "Backup uploaded to GCS"
            return 0
        else
            log_error "GCS upload failed"
            return 1
        fi
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."

    # Find and delete old backup files
    local deleted=0

    # PostgreSQL backups
    while IFS= read -r file; do
        rm -f "$file"
        log_info "Deleted old backup: $(basename "$file")"
        ((deleted++))
    done < <(find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS})

    # Redis backups
    while IFS= read -r file; do
        rm -f "$file"
        log_info "Deleted old backup: $(basename "$file")"
        ((deleted++))
    done < <(find "$BACKUP_DIR" -name "redis_dump_*.rdb" -type f -mtime +${RETENTION_DAYS})

    # n8n backups
    while IFS= read -r file; do
        rm -f "$file"
        log_info "Deleted old backup: $(basename "$file")"
        ((deleted++))
    done < <(find "$BACKUP_DIR" -name "n8n_data_*.tar.gz" -type f -mtime +${RETENTION_DAYS})

    if [ $deleted -gt 0 ]; then
        log_success "Deleted $deleted old backup(s)"
    else
        log_info "No old backups to delete"
    fi
}

verify_backup() {
    if [ ! -f "$OUTPUT_FILE" ]; then
        log_error "Backup file not found: $OUTPUT_FILE"
        return 1
    fi

    # Check if file is not empty
    local size=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
    if [ "$size" -eq 0 ]; then
        log_error "Backup file is empty"
        return 1
    fi

    # Test gzip integrity
    if ! gzip -t "$OUTPUT_FILE" 2>/dev/null; then
        log_error "Backup file is corrupted"
        return 1
    fi

    log_success "Backup verification passed"
    return 0
}

show_backup_info() {
    echo ""
    echo "=========================================="
    echo "Backup Information"
    echo "=========================================="
    echo "Timestamp: $TIMESTAMP"
    echo "PostgreSQL backup: $(basename "$OUTPUT_FILE")"

    if [ -f "$OUTPUT_FILE" ]; then
        local size=$(du -h "$OUTPUT_FILE" | cut -f1)
        echo "Size: $size"
    fi

    echo ""
    echo "All backups location: $BACKUP_DIR"
    echo "Retention period: $RETENTION_DAYS days"
    echo "=========================================="
}

list_backups() {
    echo ""
    echo "=========================================="
    echo "Available Backups"
    echo "=========================================="

    echo ""
    echo "PostgreSQL Backups:"
    find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -exec ls -lh {} \; | \
        awk '{print $9, "(" $5 ")"}'

    echo ""
    echo "Redis Backups:"
    find "$BACKUP_DIR" -name "redis_dump_*.rdb" -type f -exec ls -lh {} \; | \
        awk '{print $9, "(" $5 ")"}'

    echo ""
    echo "n8n Backups:"
    find "$BACKUP_DIR" -name "n8n_data_*.tar.gz" -type f -exec ls -lh {} \; | \
        awk '{print $9, "(" $5 ")"}'

    echo "=========================================="
}

# Main backup flow
main() {
    log_info "Starting FunnelAgents Backup Process"
    log_info "Timestamp: $TIMESTAMP"

    # Check prerequisites
    check_prerequisites

    # Create backups
    if ! create_postgres_backup; then
        log_error "Backup process failed"
        exit 1
    fi

    create_redis_backup
    create_n8n_backup

    # Verify PostgreSQL backup
    if ! verify_backup; then
        log_error "Backup verification failed"
        exit 1
    fi

    # Upload to cloud storage if configured
    upload_to_s3
    upload_to_gcs

    # Cleanup old backups
    cleanup_old_backups

    # Show backup information
    show_backup_info
    list_backups

    log_success "Backup process completed successfully!"
}

# Run main function
main
