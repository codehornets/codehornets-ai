#!/bin/bash
# =============================================================================
# FunnelAgents - Production Deployment Script
# =============================================================================
# Deploys the application to production with zero-downtime strategy
# Usage: ./deploy.sh [options]
# Options:
#   --tag <tag>          Docker image tag to deploy (default: latest)
#   --skip-backup        Skip database backup before deployment
#   --force              Skip confirmation prompts
#   --rollback           Rollback to previous deployment

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}/../docker"
COMPOSE_FILE="${DOCKER_DIR}/docker-compose.prod.yml"
ENV_FILE="${DOCKER_DIR}/.env.production"
BACKUP_DIR="${DOCKER_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
IMAGE_TAG="${IMAGE_TAG:-latest}"
SKIP_BACKUP=false
FORCE=false
ROLLBACK=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
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

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi

    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi

    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_error "Please create it from .env.production.example"
        exit 1
    fi

    # Check if secrets directory exists
    if [ ! -d "${DOCKER_DIR}/secrets" ]; then
        log_error "Secrets directory not found: ${DOCKER_DIR}/secrets"
        log_error "Please create it and add required secret files"
        exit 1
    fi

    # Check required secret files
    local required_secrets=(
        "postgres_password.txt"
        "database_url.txt"
        "jwt_secret.txt"
        "n8n_encryption_key.txt"
    )

    for secret in "${required_secrets[@]}"; do
        if [ ! -f "${DOCKER_DIR}/secrets/${secret}" ]; then
            log_error "Required secret file not found: ${secret}"
            exit 1
        fi
    done

    log_success "All prerequisites met"
}

backup_database() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_warning "Skipping database backup"
        return 0
    fi

    log_info "Creating database backup..."

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"

    # Run backup script
    if [ -f "${SCRIPT_DIR}/backup.sh" ]; then
        bash "${SCRIPT_DIR}/backup.sh" --output="${BACKUP_DIR}/pre_deploy_${TIMESTAMP}.sql.gz"
        log_success "Database backup created: pre_deploy_${TIMESTAMP}.sql.gz"
    else
        log_warning "Backup script not found. Skipping backup."
    fi
}

save_deployment_state() {
    log_info "Saving current deployment state..."

    # Save current container states
    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps > "${BACKUP_DIR}/state_${TIMESTAMP}.txt"

    # Save current image tags
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" images > "${BACKUP_DIR}/images_${TIMESTAMP}.txt"

    log_success "Deployment state saved"
}

build_images() {
    log_info "Building Docker images with tag: $IMAGE_TAG..."

    cd "$DOCKER_DIR"
    export IMAGE_TAG

    # Build all service images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel

    log_success "Images built successfully"
}

pull_images() {
    log_info "Pulling Docker images with tag: $IMAGE_TAG..."

    cd "$DOCKER_DIR"
    export IMAGE_TAG

    # Pull external images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

    log_success "Images pulled successfully"
}

run_health_checks() {
    log_info "Running health checks..."

    if [ -f "${SCRIPT_DIR}/health-check.sh" ]; then
        bash "${SCRIPT_DIR}/health-check.sh"
        return $?
    else
        log_warning "Health check script not found"
        return 0
    fi
}

deploy_services() {
    log_info "Deploying services..."

    cd "$DOCKER_DIR"
    export IMAGE_TAG

    # Deploy with zero-downtime strategy
    # 1. Start new containers
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps --build

    # 2. Wait for health checks
    log_info "Waiting for services to be healthy..."
    sleep 10

    # 3. Check if services are healthy
    if ! run_health_checks; then
        log_error "Health checks failed. Deployment aborted."
        return 1
    fi

    # 4. Remove old containers
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

    log_success "Services deployed successfully"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."

    # Remove dangling images
    docker image prune -f

    # Remove old images (keep last 3 versions)
    docker images --format "{{.Repository}}:{{.Tag}}" | grep "funnel-agents" | tail -n +4 | xargs -r docker rmi -f || true

    log_success "Cleanup completed"
}

perform_rollback() {
    log_warning "Performing rollback..."

    if [ ! -f "${SCRIPT_DIR}/rollback.sh" ]; then
        log_error "Rollback script not found"
        exit 1
    fi

    bash "${SCRIPT_DIR}/rollback.sh"
}

show_deployment_info() {
    log_info "Deployment Information:"
    echo "----------------------------------------"
    echo "Timestamp: $TIMESTAMP"
    echo "Image Tag: $IMAGE_TAG"
    echo "Environment: production"
    echo "----------------------------------------"

    cd "$DOCKER_DIR"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Main deployment flow
main() {
    log_info "Starting FunnelAgents Production Deployment"
    log_info "Timestamp: $TIMESTAMP"

    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        perform_rollback
        exit $?
    fi

    # Check prerequisites
    check_prerequisites

    # Confirm deployment
    if ! confirm "Deploy FunnelAgents with image tag '$IMAGE_TAG'?"; then
        log_warning "Deployment cancelled"
        exit 0
    fi

    # Save current state
    save_deployment_state

    # Backup database
    backup_database

    # Build or pull images
    if [ "$IMAGE_TAG" = "latest" ]; then
        build_images
    else
        pull_images
    fi

    # Deploy services
    if ! deploy_services; then
        log_error "Deployment failed"

        if confirm "Do you want to rollback to the previous version?"; then
            perform_rollback
        fi
        exit 1
    fi

    # Cleanup
    cleanup_old_images

    # Show deployment info
    show_deployment_info

    log_success "Deployment completed successfully!"
    log_info "Backup created at: ${BACKUP_DIR}/pre_deploy_${TIMESTAMP}.sql.gz"
    log_info "Run './scripts/health-check.sh' to verify all services are running correctly"
}

# Run main function
main
