#!/bin/bash

# ============================================================================
# Workflow Module Setup Verification Script
# ============================================================================
# This script verifies that the workflow module is properly configured
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================"
echo -e "Workflow Module Setup Verification"
echo -e "========================================${NC}"
echo ""

ERRORS=0
WARNINGS=0

# ============================================================================
# Check 1: Docker Compose Configuration
# ============================================================================
echo -e "${YELLOW}Check 1: Docker Compose Configuration${NC}"
if grep -q "handymate-n8n" infrastructure/docker/docker-compose.yml; then
    echo -e "  ${GREEN}✓${NC} n8n service defined in docker-compose.yml"
else
    echo -e "  ${RED}✗${NC} n8n service NOT found in docker-compose.yml"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "n8n-data:" infrastructure/docker/docker-compose.yml; then
    echo -e "  ${GREEN}✓${NC} n8n volumes configured"
else
    echo -e "  ${RED}✗${NC} n8n volumes NOT configured"
    ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# Check 2: Makefile Commands
# ============================================================================
echo -e "\n${YELLOW}Check 2: Makefile Commands${NC}"
if grep -q "workflow-init:" Makefile; then
    echo -e "  ${GREEN}✓${NC} workflow-init command exists"
else
    echo -e "  ${RED}✗${NC} workflow-init command NOT found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "workflow-up:" Makefile; then
    echo -e "  ${GREEN}✓${NC} workflow-up command exists"
else
    echo -e "  ${RED}✗${NC} workflow-up command NOT found"
    ERRORS=$((ERRORS + 1))
fi

if grep -q "Step 13/13:" Makefile; then
    echo -e "  ${GREEN}✓${NC} Setup command updated with workflow initialization"
else
    echo -e "  ${YELLOW}⚠${NC}  Setup command may not include workflow initialization"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# Check 3: Initialization Script
# ============================================================================
echo -e "\n${YELLOW}Check 3: Initialization Script${NC}"
if [ -f "infrastructure/docker/scripts/init-workflow.sh" ]; then
    echo -e "  ${GREEN}✓${NC} init-workflow.sh exists"
    if [ -x "infrastructure/docker/scripts/init-workflow.sh" ]; then
        echo -e "  ${GREEN}✓${NC} init-workflow.sh is executable"
    else
        echo -e "  ${YELLOW}⚠${NC}  init-workflow.sh is not executable (run: chmod +x infrastructure/docker/scripts/init-workflow.sh)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} init-workflow.sh NOT found"
    ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# Check 4: Environment Configuration
# ============================================================================
echo -e "\n${YELLOW}Check 4: Environment Configuration${NC}"
if grep -q "N8N_URL" .env.example; then
    echo -e "  ${GREEN}✓${NC} n8n configuration in .env.example"
else
    echo -e "  ${YELLOW}⚠${NC}  n8n configuration NOT in .env.example"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f ".env" ]; then
    if grep -q "N8N_URL" .env; then
        echo -e "  ${GREEN}✓${NC} n8n configuration in .env"
    else
        echo -e "  ${YELLOW}⚠${NC}  n8n configuration NOT in .env (will be added on setup)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  .env file not found (will be created on setup)"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# Check 5: n8n Custom Hooks
# ============================================================================
echo -e "\n${YELLOW}Check 5: n8n Custom Hooks${NC}"
if [ -f "infrastructure/docker/n8n/custom-hooks.js" ]; then
    echo -e "  ${GREEN}✓${NC} custom-hooks.js exists"
else
    echo -e "  ${YELLOW}⚠${NC}  custom-hooks.js NOT found (optional, but recommended)"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# Check 6: Storage Directories
# ============================================================================
echo -e "\n${YELLOW}Check 6: Storage Directories${NC}"
if [ -d "storage" ]; then
    echo -e "  ${GREEN}✓${NC} storage directory exists"
    if [ -d "storage/logs" ]; then
        echo -e "  ${GREEN}✓${NC} storage/logs directory exists"
    else
        echo -e "  ${YELLOW}⚠${NC}  storage/logs will be created on setup"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} storage directory NOT found"
    ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# Check 7: Workflow Package
# ============================================================================
echo -e "\n${YELLOW}Check 7: Workflow Package${NC}"
if [ -d "packages/Webkul/Workflow" ]; then
    echo -e "  ${GREEN}✓${NC} Workflow package exists"

    if [ -f "packages/Webkul/Workflow/src/Providers/WorkflowServiceProvider.php" ]; then
        echo -e "  ${GREEN}✓${NC} WorkflowServiceProvider exists"
    else
        echo -e "  ${RED}✗${NC} WorkflowServiceProvider NOT found"
        ERRORS=$((ERRORS + 1))
    fi

    if [ -d "packages/Webkul/Workflow/src/Database/Migrations" ]; then
        echo -e "  ${GREEN}✓${NC} Migrations directory exists"
    else
        echo -e "  ${RED}✗${NC} Migrations directory NOT found"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} Workflow package NOT found at packages/Webkul/Workflow"
    ERRORS=$((ERRORS + 1))
fi

# ============================================================================
# Check 8: Documentation
# ============================================================================
echo -e "\n${YELLOW}Check 8: Documentation${NC}"
if [ -f "WORKFLOW_SETUP.md" ]; then
    echo -e "  ${GREEN}✓${NC} WORKFLOW_SETUP.md exists"
else
    echo -e "  ${YELLOW}⚠${NC}  WORKFLOW_SETUP.md NOT found"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "packages/Webkul/Workflow/README.md" ]; then
    echo -e "  ${GREEN}✓${NC} Workflow package README exists"
else
    echo -e "  ${YELLOW}⚠${NC}  Workflow package README NOT found"
    WARNINGS=$((WARNINGS + 1))
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}========================================"
echo -e "Verification Summary"
echo -e "========================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo -e "${GREEN}Your workflow module is properly configured.${NC}"
    echo -e "Run ${YELLOW}make setup${NC} to complete the installation."
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo -e "${YELLOW}Your workflow module is configured but has some optional items missing.${NC}"
    echo -e "You can still run ${YELLOW}make setup${NC} successfully."
else
    echo -e "${RED}✗ ${ERRORS} error(s) and ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo -e "${RED}Your workflow module setup is incomplete.${NC}"
    echo -e "Please fix the errors above before running ${YELLOW}make setup${NC}."
fi

echo ""

exit $ERRORS
