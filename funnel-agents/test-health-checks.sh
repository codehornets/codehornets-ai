#!/bin/bash

# Health Check Test Script
# Tests all service health endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Testing Health Check Endpoints"
echo "=========================================="
echo ""

# Service definitions: name:port
SERVICES=(
  "api-gateway:3000"
  "auth-service:3001"
  "crm-service:3002"
  "campaigns-service:3003"
  "content-service:3004"
  "agents-service:3005"
  "tasks-service:3006"
  "automations-service:3007"
  "reports-service:3008"
  "scheduler:3010"
  "worker-runner:3009"
)

# Function to test health endpoint
test_endpoint() {
  local service=$1
  local port=$2
  local endpoint=$3
  local url="http://localhost:${port}${endpoint}"

  echo -n "Testing ${service} ${endpoint}... "

  if response=$(curl -s -f -m 5 "$url" 2>&1); then
    # Check if response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
      status=$(echo "$response" | jq -r '.status // "unknown"')
      echo -e "${GREEN}✓ OK${NC} (status: $status)"
      return 0
    else
      echo -e "${YELLOW}⚠ Invalid JSON${NC}"
      return 1
    fi
  else
    echo -e "${RED}✗ FAILED${NC} (service not responding)"
    return 1
  fi
}

# Test all services
total=0
passed=0
failed=0

for service_def in "${SERVICES[@]}"; do
  IFS=':' read -r service port <<< "$service_def"

  echo ""
  echo "Testing ${service} (port ${port})"
  echo "----------------------------------------"

  # Test liveness endpoint
  total=$((total + 1))
  if test_endpoint "$service" "$port" "/health"; then
    passed=$((passed + 1))
  else
    failed=$((failed + 1))
  fi

  # Test readiness endpoint (if applicable)
  if [[ "$service" != "api-gateway" ]]; then
    total=$((total + 1))
    if test_endpoint "$service" "$port" "/health/ready"; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi
  fi

  # API Gateway has special endpoints
  if [[ "$service" == "api-gateway" ]]; then
    total=$((total + 1))
    if test_endpoint "$service" "$port" "/health/services"; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi
  fi

  # Worker runner has special endpoints
  if [[ "$service" == "worker-runner" ]]; then
    total=$((total + 1))
    if test_endpoint "$service" "$port" "/health/queues"; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi

    total=$((total + 1))
    if test_endpoint "$service" "$port" "/health/detailed"; then
      passed=$((passed + 1))
    else
      failed=$((failed + 1))
    fi
  fi
done

# Print summary
echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo "Total tests:  $total"
echo -e "Passed:       ${GREEN}$passed${NC}"
echo -e "Failed:       ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}✓ All health checks passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some health checks failed${NC}"
  exit 1
fi
