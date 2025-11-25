#!/bin/bash

SERVICES=(
  "api-gateway"
  "auth-service"
  "crm-service"
  "campaigns-service"
  "content-service"
  "agents-service"
  "tasks-service"
  "automations-service"
  "reports-service"
  "worker-runner"
  "scheduler"
)

echo "========================================="
echo "NestJS Services Build Verification Report"
echo "========================================="
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_SERVICES=()

for service in "${SERVICES[@]}"; do
  echo "Testing $service..."
  if timeout 120 npx nx build $service > /tmp/${service}-build.log 2>&1; then
    echo "✓ $service - BUILD SUCCESS"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo "✗ $service - BUILD FAILED"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILED_SERVICES+=("$service")
    echo "  Error preview:"
    tail -30 /tmp/${service}-build.log | grep -E "ERROR|error" | head -5 | sed 's/^/    /'
  fi
  echo ""
done

echo "========================================="
echo "Summary:"
echo "  Success: $SUCCESS_COUNT/$((SUCCESS_COUNT + FAIL_COUNT))"
echo "  Failed:  $FAIL_COUNT/$((SUCCESS_COUNT + FAIL_COUNT))"
echo "========================================="

if [ $FAIL_COUNT -gt 0 ]; then
  echo ""
  echo "Failed services:"
  for service in "${FAILED_SERVICES[@]}"; do
    echo "  - $service (log: /tmp/${service}-build.log)"
  done
  exit 1
fi

echo ""
echo "All services built successfully!"
exit 0
