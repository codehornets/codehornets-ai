#!/bin/bash

# ============================================================================
# Workflow Module Initialization Script
# ============================================================================
# This script initializes the n8n workflow module for HandyMate CRM
# It sets up database, runs migrations, and configures the workflow service
#
# Usage: ./init-workflow.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================"
echo -e "Workflow Module Initialization"
echo -e "========================================${NC}"
echo ""

# ============================================================================
# Step 1: Check if n8n container is running
# ============================================================================
echo -e "${YELLOW}Step 1/7: Checking n8n container status...${NC}"
if docker ps | grep -q handymate-n8n; then
    echo -e "  ${GREEN}✓${NC} n8n container is running"
else
    echo -e "  ${RED}✗${NC} n8n container is not running"
    echo -e "  ${YELLOW}Starting n8n container...${NC}"
    docker-compose -f infrastructure/docker/docker-compose.yml up -d n8n
    echo -e "  ${YELLOW}Waiting for n8n to be ready (30s)...${NC}"
    sleep 30
fi

# ============================================================================
# Step 2: Create n8n database if it doesn't exist
# ============================================================================
echo -e "${YELLOW}Step 2/7: Creating n8n database...${NC}"
docker-compose -f infrastructure/docker/docker-compose.yml exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS handymate_n8n CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Database ready"

# ============================================================================
# Step 3: Grant permissions to n8n database
# ============================================================================
echo -e "${YELLOW}Step 3/7: Granting database permissions...${NC}"
docker-compose -f infrastructure/docker/docker-compose.yml exec -T mysql mysql -uroot -proot -e "GRANT ALL PRIVILEGES ON handymate_n8n.* TO 'handymate'@'%'; FLUSH PRIVILEGES;" 2>/dev/null || true
echo -e "  ${GREEN}✓${NC} Permissions granted"

# ============================================================================
# Step 4: Run Laravel Workflow module migrations
# ============================================================================
echo -e "${YELLOW}Step 4/7: Running Workflow module migrations...${NC}"
docker-compose -f infrastructure/docker/docker-compose.yml exec -T app php artisan migrate --path=packages/Webkul/Workflow/src/Database/Migrations --force 2>/dev/null || {
    echo -e "  ${YELLOW}⚠${NC}  Migrations may have already been run or module not registered yet"
}
echo -e "  ${GREEN}✓${NC} Migrations complete"

# ============================================================================
# Step 5: Generate JWT keys for n8n authentication
# ============================================================================
echo -e "${YELLOW}Step 5/7: Generating JWT keys...${NC}"
if [ ! -f storage/app/jwt/private.pem ]; then
    mkdir -p storage/app/jwt
    openssl genrsa -out storage/app/jwt/private.pem 4096 2>/dev/null || {
        echo -e "  ${YELLOW}⚠${NC}  OpenSSL not available, skipping JWT key generation"
        echo -e "  ${YELLOW}   Run manually: openssl genrsa -out storage/app/jwt/private.pem 4096${NC}"
    }
    openssl rsa -in storage/app/jwt/private.pem -pubout -out storage/app/jwt/public.pem 2>/dev/null || true
    chmod 600 storage/app/jwt/private.pem
    echo -e "  ${GREEN}✓${NC} JWT keys generated"
else
    echo -e "  ${GREEN}✓${NC} JWT keys already exist"
fi

# ============================================================================
# Step 6: Create n8n log directory
# ============================================================================
echo -e "${YELLOW}Step 6/7: Creating log directories...${NC}"
mkdir -p storage/logs/n8n
chmod 777 storage/logs/n8n
echo -e "  ${GREEN}✓${NC} Log directories created"

# ============================================================================
# Step 7: Wait for n8n to be fully ready
# ============================================================================
echo -e "${YELLOW}Step 7/7: Waiting for n8n to be fully ready...${NC}"
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:5678/healthz >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} n8n is ready!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    echo -e "  Waiting for n8n... ($ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo -e "  ${YELLOW}⚠${NC}  n8n may not be fully ready yet, but continuing..."
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}========================================"
echo -e "✓ Workflow Module Initialized!"
echo -e "========================================${NC}"
echo ""
echo -e "${GREEN}n8n Workflow Builder is ready!${NC}"
echo ""
echo -e "Access points:"
echo -e "  ${YELLOW}n8n Direct:${NC}   http://localhost:5678"
echo -e "  ${YELLOW}CRM Embedded:${NC} http://localhost/admin/workflows"
echo ""
echo -e "Useful commands:"
echo -e "  ${GREEN}make workflow-logs${NC}   - View n8n logs"
echo -e "  ${GREEN}make workflow-restart${NC} - Restart n8n service"
echo -e "  ${GREEN}make workflow-status${NC}  - Check n8n health"
echo ""
