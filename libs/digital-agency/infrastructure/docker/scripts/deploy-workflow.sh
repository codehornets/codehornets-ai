#!/bin/bash
# ============================================================================
# Deploy n8n to Production
# ============================================================================
# This script deploys n8n workflow automation to production environment
# using systemd for service management.
#
# Usage:
#   sudo ./infrastructure/docker/scripts/deploy-workflow.sh
#   make workflow-production-deploy
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - systemd available
#   - Root/sudo access
#
# Exit codes:
#   0 - Success
#   1 - Deployment failed
# ============================================================================

set -e

# ============================================================================
# Configuration
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

SERVICE_NAME="n8n-painterflow"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
LOGROTATE_FILE="/etc/logrotate.d/${SERVICE_NAME}"

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
# Pre-flight Checks
# ============================================================================
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

check_prerequisites() {
    log_info "Checking prerequisites..."

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

    # Check systemd
    if ! command -v systemctl &> /dev/null; then
        log_error "systemd is not available"
        exit 1
    fi

    log_success "All prerequisites met"
}

# ============================================================================
# Deployment Functions
# ============================================================================
install_systemd_service() {
    log_info "Installing systemd service..."

    local source_service="$PROJECT_ROOT/infrastructure/systemd/n8n-painterflow.service"

    if [ ! -f "$source_service" ]; then
        log_error "Service file not found: $source_service"
        exit 1
    fi

    # Copy service file
    cp "$source_service" "$SERVICE_FILE"
    chmod 644 "$SERVICE_FILE"

    log_success "Systemd service installed"
}

install_logrotate() {
    log_info "Installing logrotate configuration..."

    local source_logrotate="$PROJECT_ROOT/infrastructure/systemd/n8n-logrotate"

    if [ -f "$source_logrotate" ]; then
        cp "$source_logrotate" "$LOGROTATE_FILE"
        chmod 644 "$LOGROTATE_FILE"
        log_success "Logrotate configuration installed"
    else
        log_warning "Logrotate configuration not found, skipping"
    fi
}

create_log_directories() {
    log_info "Creating log directories..."

    mkdir -p "$PROJECT_ROOT/storage/logs/n8n"
    chown -R www-data:www-data "$PROJECT_ROOT/storage/logs/n8n"

    log_success "Log directories created"
}

configure_environment() {
    log_info "Configuring production environment..."

    # Check if .env.workflow exists
    if [ ! -f "$PROJECT_ROOT/.env.workflow" ]; then
        log_warning "Environment file not found, creating from template..."
        cp "$PROJECT_ROOT/.env.workflow.template" "$PROJECT_ROOT/.env.workflow"
    fi

    # Ensure proper ownership
    chown www-data:www-data "$PROJECT_ROOT/.env.workflow"
    chmod 600 "$PROJECT_ROOT/.env.workflow"

    log_success "Environment configured"
}

pull_docker_images() {
    log_info "Pulling latest Docker images..."

    cd "$PROJECT_ROOT"
    docker-compose -f infrastructure/docker/docker-compose.workflow.yml pull

    log_success "Docker images pulled"
}

enable_systemd_service() {
    log_info "Enabling systemd service..."

    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"

    log_success "Service enabled"
}

start_service() {
    log_info "Starting n8n service..."

    systemctl start "$SERVICE_NAME"

    # Wait for service to start
    sleep 5

    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "Service started successfully"
    else
        log_error "Service failed to start"
        log_info "Checking service status..."
        systemctl status "$SERVICE_NAME" --no-pager
        exit 1
    fi
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Check service status
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        log_success "Service is active"
    else
        log_error "Service is not active"
        return 1
    fi

    # Check health endpoint
    sleep 10
    if curl -sf http://localhost:5678/healthz > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warning "Health check failed (service may still be starting)"
    fi

    return 0
}

configure_nginx() {
    log_info "Configuring nginx reverse proxy..."

    local nginx_conf="$PROJECT_ROOT/infrastructure/docker/nginx/workflow.conf"
    local nginx_sites="/etc/nginx/sites-available"

    if [ -f "$nginx_conf" ] && [ -d "$nginx_sites" ]; then
        cp "$nginx_conf" "$nginx_sites/workflow"
        ln -sf "$nginx_sites/workflow" /etc/nginx/sites-enabled/workflow 2>/dev/null || true

        # Test nginx configuration
        if nginx -t &> /dev/null; then
            systemctl reload nginx
            log_success "Nginx configured and reloaded"
        else
            log_warning "Nginx configuration test failed, skipping reload"
        fi
    else
        log_warning "Nginx configuration not found or nginx not installed, skipping"
    fi
}

create_backup() {
    log_info "Creating pre-deployment backup..."

    if systemctl is-active --quiet "$SERVICE_NAME"; then
        bash "$SCRIPT_DIR/backup-workflow.sh" "pre-deployment-$(date +%Y%m%d-%H%M%S)" || log_warning "Backup failed"
    else
        log_info "Service not running, skipping backup"
    fi
}

show_deployment_info() {
    echo ""
    echo "============================================================================"
    log_success "Production deployment completed!"
    echo "============================================================================"
    echo ""
    echo "Service Management:"
    echo "  Status:  systemctl status $SERVICE_NAME"
    echo "  Start:   systemctl start $SERVICE_NAME"
    echo "  Stop:    systemctl stop $SERVICE_NAME"
    echo "  Restart: systemctl restart $SERVICE_NAME"
    echo "  Logs:    journalctl -u $SERVICE_NAME -f"
    echo ""
    echo "Makefile Commands:"
    echo "  Status:  make workflow-production-status"
    echo "  Logs:    make workflow-production-logs"
    echo "  Restart: make workflow-production-restart"
    echo ""
    echo "Access URLs:"
    echo "  Direct:  http://localhost:5678"
    echo "  Proxy:   https://your-domain.com/workflow/"
    echo ""
    echo "Next Steps:"
    echo "  1. Update .env.workflow with production settings"
    echo "  2. Configure SSL certificates for nginx"
    echo "  3. Set up monitoring and alerting"
    echo "  4. Configure automated backups"
    echo "  5. Test disaster recovery procedures"
    echo ""
    echo "============================================================================"
}

# ============================================================================
# Main Deployment Flow
# ============================================================================
main() {
    echo "============================================================================"
    echo "n8n Workflow Automation - Production Deployment"
    echo "============================================================================"
    echo ""

    # Pre-flight checks
    check_root
    check_prerequisites

    # Stop existing service if running
    if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
        log_info "Stopping existing service..."
        create_backup
        systemctl stop "$SERVICE_NAME"
    fi

    # Deployment steps
    configure_environment
    create_log_directories
    pull_docker_images
    install_systemd_service
    install_logrotate
    enable_systemd_service
    start_service
    configure_nginx

    # Verification
    if verify_deployment; then
        show_deployment_info
        exit 0
    else
        log_error "Deployment verification failed"
        log_info "Check logs: journalctl -u $SERVICE_NAME -f"
        exit 1
    fi
}

main "$@"
