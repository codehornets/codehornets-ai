#!/bin/bash

# E2E Test Environment Verification Script
# Run this to verify all test files and setup are correct

set -e

echo "================================================================================"
echo "E2E Test Environment Verification"
echo "================================================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

check_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $description"
    echo "  → $file"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  → Missing: $file"
    ((FAILED++))
  fi
}

check_command() {
  local cmd=$1
  local description=$2

  if command -v $cmd &> /dev/null; then
    echo -e "${GREEN}✓${NC} $description"
    echo "  → $(which $cmd)"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $description"
    echo "  → Command not found: $cmd"
    ((FAILED++))
  fi
}

echo "Checking Test Files..."
echo "---"

check_file "apps/api-gateway/test/test-helpers.ts" "Test helpers module"
check_file "apps/api-gateway/test/app.e2e-spec.ts" "Basic E2E tests"
check_file "apps/api-gateway/test/critical-flows.e2e-spec.ts" "Critical flows tests"

echo ""
echo "Checking Documentation..."
echo "---"

check_file "apps/api-gateway/test/README.md" "Full documentation"
check_file "apps/api-gateway/test/QUICK_START.md" "Quick start guide"
check_file "apps/api-gateway/test/SUMMARY.md" "Executive summary"
check_file "apps/api-gateway/test/E2E_TESTS_IMPLEMENTATION_REPORT.md" "Implementation report"

echo ""
echo "Checking Docker Setup..."
echo "---"

check_file "infrastructure/docker/docker-compose.test.yml" "Test environment compose file"
check_file "infrastructure/docker/Makefile.test" "Test makefile"

echo ""
echo "Checking Required Commands..."
echo "---"

check_command "node" "Node.js"
check_command "npm" "NPM"
check_command "docker" "Docker"
check_command "docker-compose" "Docker Compose"

echo ""
echo "Checking Node Modules..."
echo "---"

if [ -d "node_modules" ]; then
  echo -e "${GREEN}✓${NC} Node modules installed"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} Node modules not installed (run: npm install)"
fi

if [ -d "node_modules/supertest" ]; then
  echo -e "${GREEN}✓${NC} Supertest installed"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Supertest not installed"
  ((FAILED++))
fi

if [ -d "node_modules/@nestjs/testing" ]; then
  echo -e "${GREEN}✓${NC} NestJS testing installed"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} NestJS testing not installed"
  ((FAILED++))
fi

echo ""
echo "Checking Test Helper Functions..."
echo "---"

if grep -q "verifyAllServicesHealthy" "apps/api-gateway/test/test-helpers.ts" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} verifyAllServicesHealthy() function exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} verifyAllServicesHealthy() function not found"
  ((FAILED++))
fi

if grep -q "assertNotServiceError" "apps/api-gateway/test/test-helpers.ts" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} assertNotServiceError() function exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} assertNotServiceError() function not found"
  ((FAILED++))
fi

if grep -q "generateTestEmail" "apps/api-gateway/test/test-helpers.ts" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} generateTestEmail() function exists"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} generateTestEmail() function not found"
  ((FAILED++))
fi

echo ""
echo "Checking Test Files for Issues..."
echo "---"

# Check for console.log in test files
CONSOLE_LOGS=$(grep -n "console\.log" apps/api-gateway/test/*.e2e-spec.ts 2>/dev/null || true)
if [ -z "$CONSOLE_LOGS" ]; then
  echo -e "${GREEN}✓${NC} No console.log found in test files"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} console.log found in test files (should be removed)"
  echo "$CONSOLE_LOGS"
  ((FAILED++))
fi

# Check for service error acceptance
SERVICE_ERRORS=$(grep -n "\[.*502.*503.*\]" apps/api-gateway/test/*.e2e-spec.ts 2>/dev/null || true)
if [ -z "$SERVICE_ERRORS" ]; then
  echo -e "${GREEN}✓${NC} No acceptance of 502/503 as success"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Tests accepting 502/503 as success (should be fixed)"
  echo "$SERVICE_ERRORS"
  ((FAILED++))
fi

# Check that tests import test-helpers
if grep -q "from './test-helpers'" apps/api-gateway/test/app.e2e-spec.ts 2>/dev/null; then
  echo -e "${GREEN}✓${NC} app.e2e-spec.ts imports test-helpers"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} app.e2e-spec.ts doesn't import test-helpers"
  ((FAILED++))
fi

if grep -q "from './test-helpers'" apps/api-gateway/test/critical-flows.e2e-spec.ts 2>/dev/null; then
  echo -e "${GREEN}✓${NC} critical-flows.e2e-spec.ts imports test-helpers"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} critical-flows.e2e-spec.ts doesn't import test-helpers"
  ((FAILED++))
fi

# Check that tests call verifyAllServicesHealthy
if grep -q "verifyAllServicesHealthy()" apps/api-gateway/test/app.e2e-spec.ts 2>/dev/null; then
  echo -e "${GREEN}✓${NC} app.e2e-spec.ts calls verifyAllServicesHealthy()"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} app.e2e-spec.ts doesn't call verifyAllServicesHealthy()"
  ((FAILED++))
fi

if grep -q "verifyAllServicesHealthy()" apps/api-gateway/test/critical-flows.e2e-spec.ts 2>/dev/null; then
  echo -e "${GREEN}✓${NC} critical-flows.e2e-spec.ts calls verifyAllServicesHealthy()"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} critical-flows.e2e-spec.ts doesn't call verifyAllServicesHealthy()"
  ((FAILED++))
fi

echo ""
echo "Checking Docker Compose Configuration..."
echo "---"

if grep -q "postgres-test:" infrastructure/docker/docker-compose.test.yml 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Test PostgreSQL service configured"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Test PostgreSQL service not found"
  ((FAILED++))
fi

if grep -q "redis-test:" infrastructure/docker/docker-compose.test.yml 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Test Redis service configured"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Test Redis service not found"
  ((FAILED++))
fi

if grep -q "auth-service-test:" infrastructure/docker/docker-compose.test.yml 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Test Auth service configured"
  ((PASSED++))
else
  echo -e "${RED}✗${NC} Test Auth service not found"
  ((FAILED++))
fi

if grep -q "healthcheck:" infrastructure/docker/docker-compose.test.yml 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Health checks configured"
  ((PASSED++))
else
  echo -e "${YELLOW}⚠${NC} No health checks found (recommended)"
fi

echo ""
echo "================================================================================"
echo "Summary"
echo "================================================================================"
echo ""

TOTAL=$((PASSED + FAILED))
echo -e "Checks passed: ${GREEN}$PASSED${NC}"
echo -e "Checks failed: ${RED}$FAILED${NC}"
echo "Total checks: $TOTAL"

echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC} Ready to run E2E tests."
  echo ""
  echo "Next steps:"
  echo "  1. cd infrastructure/docker"
  echo "  2. docker-compose -f docker-compose.test.yml up -d"
  echo "  3. sleep 20  # Wait for services"
  echo "  4. cd ../../apps/api-gateway"
  echo "  5. npm test"
  echo ""
  echo "Or use: make -f infrastructure/docker/Makefile.test test"
  exit 0
else
  echo -e "${RED}✗ Some checks failed.${NC} Please fix the issues above."
  echo ""
  echo "Common fixes:"
  echo "  - Run: npm install"
  echo "  - Check file paths are correct"
  echo "  - Ensure all files were created properly"
  exit 1
fi
