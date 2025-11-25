#!/bin/bash
# Integration Test Setup Verification Script
# Checks if all dependencies are properly configured

set -e

echo "================================================"
echo "Integration Test Setup Verification"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track status
ALL_OK=true

# Function to check command existence
check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 is installed"
  else
    echo -e "${RED}✗${NC} $1 is not installed"
    ALL_OK=false
  fi
}

# Function to check port availability
check_port() {
  if lsof -i :$1 &> /dev/null; then
    echo -e "${YELLOW}!${NC} Port $1 is in use (expected if service is running)"
  else
    echo -e "${GREEN}✓${NC} Port $1 is available"
  fi
}

# Function to check Docker container
check_container() {
  if docker ps | grep -q $1; then
    echo -e "${GREEN}✓${NC} Container $1 is running"
  else
    echo -e "${YELLOW}!${NC} Container $1 is not running"
  fi
}

echo "Checking required tools..."
echo "----------------------------"
check_command "node"
check_command "npm"
check_command "docker"
check_command "docker-compose"
check_command "redis-cli"
check_command "psql"
echo ""

echo "Checking Node.js version..."
echo "----------------------------"
NODE_VERSION=$(node -v)
if [[ "$NODE_VERSION" =~ ^v1[8-9]\. ]] || [[ "$NODE_VERSION" =~ ^v[2-9][0-9]\. ]]; then
  echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"
else
  echo -e "${RED}✗${NC} Node.js version $NODE_VERSION (need 18+)"
  ALL_OK=false
fi
echo ""

echo "Checking required ports..."
echo "----------------------------"
echo "Test Infrastructure:"
check_port 5433  # PostgreSQL test
check_port 6380  # Redis test
echo ""
echo "Services (if running):"
check_port 3011  # Auth Service TCP
check_port 3012  # CRM Service TCP
check_port 3015  # Agents Service TCP
check_port 8000  # Python Agent API
echo ""

echo "Checking Docker test containers..."
echo "----------------------------"
check_container "funnel-agents-postgres-test"
check_container "funnel-agents-redis-test"
echo ""

echo "Checking test infrastructure connectivity..."
echo "----------------------------"
if docker ps | grep -q funnel-agents-postgres-test; then
  if PGPASSWORD=secret psql -h localhost -p 5433 -U funnel_agents -d funnel_agents_test -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL test database is accessible"
  else
    echo -e "${RED}✗${NC} Cannot connect to PostgreSQL test database"
    ALL_OK=false
  fi
else
  echo -e "${YELLOW}!${NC} PostgreSQL test container not running (run: make test-integration-infra-up)"
fi

if docker ps | grep -q funnel-agents-redis-test; then
  if redis-cli -h localhost -p 6380 ping &> /dev/null; then
    echo -e "${GREEN}✓${NC} Redis test instance is accessible"
  else
    echo -e "${RED}✗${NC} Cannot connect to Redis test instance"
    ALL_OK=false
  fi
else
  echo -e "${YELLOW}!${NC} Redis test container not running (run: make test-integration-infra-up)"
fi
echo ""

echo "Checking test files..."
echo "----------------------------"
TEST_FILES=(
  "setup.ts"
  "microservices.spec.ts"
  "queues.spec.ts"
  "database.spec.ts"
  "agent-api.spec.ts"
  "docker-compose.test.yml"
)

for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${RED}✗${NC} $file is missing"
    ALL_OK=false
  fi
done
echo ""

echo "Checking Jest configuration..."
echo "----------------------------"
if [ -f "../../jest.integration.config.js" ]; then
  echo -e "${GREEN}✓${NC} jest.integration.config.js exists"
else
  echo -e "${RED}✗${NC} jest.integration.config.js is missing"
  ALL_OK=false
fi
echo ""

echo "Checking npm scripts..."
echo "----------------------------"
cd ../..
if npm run | grep -q "test:integration"; then
  echo -e "${GREEN}✓${NC} npm script 'test:integration' is configured"
else
  echo -e "${RED}✗${NC} npm script 'test:integration' is missing"
  ALL_OK=false
fi

if npm run | grep -q "test:integration:watch"; then
  echo -e "${GREEN}✓${NC} npm script 'test:integration:watch' is configured"
else
  echo -e "${RED}✗${NC} npm script 'test:integration:watch' is missing"
  ALL_OK=false
fi
cd tests/integration
echo ""

echo "================================================"
if [ "$ALL_OK" = true ]; then
  echo -e "${GREEN}All checks passed! Ready to run integration tests.${NC}"
  echo ""
  echo "To start testing:"
  echo "  1. Start infrastructure: make test-integration-infra-up"
  echo "  2. Run tests: npm run test:integration"
  echo "  3. Cleanup: make test-integration-infra-down"
  echo ""
  echo "Or run everything: make test-integration"
  exit 0
else
  echo -e "${RED}Some checks failed. Please fix the issues above.${NC}"
  exit 1
fi
