#!/bin/bash
# =============================================================================
# FunnelAgents - Production Setup Validator
# =============================================================================
# Validates that all required files and configurations are in place
# Usage: ./validate-production-setup.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0
WARNINGS=0

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; ((WARNINGS++)); }
log_error() { echo -e "${RED}[✗]${NC} $1"; ((ERRORS++)); }

echo "========================================"
echo "FunnelAgents Production Setup Validator"
echo "========================================"
echo ""

# Check Docker Compose files
log_info "Checking Docker Compose files..."
if [ -f "$SCRIPT_DIR/docker-compose.prod.yml" ]; then
    log_success "docker-compose.prod.yml exists"
else
    log_error "docker-compose.prod.yml not found"
fi

# Check Dockerfiles
log_info "Checking Dockerfiles..."
if [ -f "$SCRIPT_DIR/Dockerfile.prod" ]; then
    log_success "Dockerfile.prod exists"
else
    log_error "Dockerfile.prod not found"
fi

if [ -f "$SCRIPT_DIR/Dockerfile.web-prod" ]; then
    log_success "Dockerfile.web-prod exists"
else
    log_error "Dockerfile.web-prod not found"
fi

# Check environment files
log_info "Checking environment files..."
if [ -f "$SCRIPT_DIR/.env.production.example" ]; then
    log_success ".env.production.example exists"
else
    log_error ".env.production.example not found"
fi

if [ -f "$SCRIPT_DIR/.env.production" ]; then
    log_success ".env.production exists"
else
    log_warning ".env.production not found (create from .env.production.example)"
fi

# Check nginx configuration
log_info "Checking nginx configuration..."
if [ -f "$SCRIPT_DIR/nginx/nginx.conf" ]; then
    log_success "nginx/nginx.conf exists"
else
    log_error "nginx/nginx.conf not found"
fi

if [ -f "$SCRIPT_DIR/nginx/conf.d/default.conf" ]; then
    log_success "nginx/conf.d/default.conf exists"
else
    log_error "nginx/conf.d/default.conf not found"
fi

if [ -f "$SCRIPT_DIR/nginx/web-ui.conf" ]; then
    log_success "nginx/web-ui.conf exists"
else
    log_error "nginx/web-ui.conf not found"
fi

# Check scripts directory
log_info "Checking deployment scripts..."
SCRIPTS_DIR="$SCRIPT_DIR/../scripts"

for script in deploy.sh rollback.sh health-check.sh backup.sh; do
    if [ -f "$SCRIPTS_DIR/$script" ]; then
        if [ -x "$SCRIPTS_DIR/$script" ]; then
            log_success "$script exists and is executable"
        else
            log_warning "$script exists but is not executable (chmod +x needed)"
        fi
    else
        log_error "$script not found in $SCRIPTS_DIR"
    fi
done

# Check Makefile
log_info "Checking Makefile..."
if [ -f "$SCRIPT_DIR/Makefile" ]; then
    log_success "Makefile exists"

    # Check for key targets
    if grep -q "^prod-build:" "$SCRIPT_DIR/Makefile"; then
        log_success "Makefile contains prod-build target"
    else
        log_warning "Makefile missing prod-build target"
    fi

    if grep -q "^deploy:" "$SCRIPT_DIR/Makefile"; then
        log_success "Makefile contains deploy target"
    else
        log_warning "Makefile missing deploy target"
    fi
else
    log_error "Makefile not found"
fi

# Check secrets directory
log_info "Checking secrets directory..."
if [ -d "$SCRIPT_DIR/secrets" ]; then
    log_success "secrets/ directory exists"

    if [ -f "$SCRIPT_DIR/secrets/README.md" ]; then
        log_success "secrets/README.md exists"
    else
        log_warning "secrets/README.md not found"
    fi

    # Check for required secret files
    for secret in postgres_password.txt database_url.txt jwt_secret.txt n8n_encryption_key.txt; do
        if [ -f "$SCRIPT_DIR/secrets/$secret" ]; then
            log_success "secrets/$secret exists"
        else
            log_warning "secrets/$secret not found (run 'make prod-secrets')"
        fi
    done
else
    log_error "secrets/ directory not found (run 'make init')"
fi

# Check SSL directory
log_info "Checking SSL directory..."
if [ -d "$SCRIPT_DIR/nginx/ssl" ]; then
    log_success "nginx/ssl/ directory exists"

    if [ -f "$SCRIPT_DIR/nginx/ssl/cert.pem" ] && [ -f "$SCRIPT_DIR/nginx/ssl/key.pem" ]; then
        log_success "SSL certificates found"
    else
        log_warning "SSL certificates not found (run 'make ssl-generate' or add real certs)"
    fi
else
    log_warning "nginx/ssl/ directory not found (run 'make init')"
fi

# Check backups directory
log_info "Checking backups directory..."
if [ -d "$SCRIPT_DIR/backups" ]; then
    log_success "backups/ directory exists"
else
    log_warning "backups/ directory not found (will be auto-created)"
fi

# Check documentation
log_info "Checking documentation..."
for doc in PRODUCTION_DEPLOYMENT.md PRODUCTION_IMPLEMENTATION_REPORT.md PRODUCTION_QUICK_START.md; do
    if [ -f "$SCRIPT_DIR/$doc" ]; then
        log_success "$doc exists"
    else
        log_error "$doc not found"
    fi
done

# Check Docker daemon
log_info "Checking Docker daemon..."
if docker info >/dev/null 2>&1; then
    log_success "Docker daemon is running"

    docker_version=$(docker --version | awk '{print $3}' | tr -d ',')
    log_info "Docker version: $docker_version"
else
    log_error "Docker daemon is not running"
fi

# Check Docker Compose
log_info "Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    log_success "Docker Compose is installed"

    compose_version=$(docker-compose --version | awk '{print $4}' | tr -d ',')
    log_info "Docker Compose version: $compose_version"
else
    log_error "Docker Compose is not installed"
fi

# Check Make
log_info "Checking Make..."
if command -v make &> /dev/null; then
    log_success "Make is installed"
else
    log_warning "Make is not installed (optional but recommended)"
fi

# Check OpenSSL
log_info "Checking OpenSSL..."
if command -v openssl &> /dev/null; then
    log_success "OpenSSL is installed"
else
    log_warning "OpenSSL is not installed (required for secrets generation)"
fi

# Summary
echo ""
echo "========================================"
echo "Validation Summary"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Production setup is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure .env.production with your settings"
    echo "2. Add SSL certificates to nginx/ssl/"
    echo "3. Run 'make deploy' to deploy to production"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found.${NC}"
    echo ""
    echo "Warnings should be addressed before deployment:"
    echo "- Run 'make init' to create missing directories"
    echo "- Run 'make prod-secrets' to generate secrets"
    echo "- Run 'make ssl-generate' for development SSL certs"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found, $WARNINGS warning(s).${NC}"
    echo ""
    echo "Fix errors before proceeding with deployment."
    echo "Some files may be missing from the production setup."
    exit 1
fi
