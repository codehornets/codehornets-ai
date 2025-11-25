#!/bin/bash
# Monitoring Infrastructure Validation Script

set -e

echo "=================================================="
echo "FunnelAgents Monitoring Validation"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
ERRORS=0

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}✗${NC} $1 - MISSING"
        ERRORS=$((ERRORS + 1))
    fi
}

check_dependency() {
    if npm list "$1" &>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 installed"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}✗${NC} $1 - NOT INSTALLED"
        ERRORS=$((ERRORS + 1))
    fi
}

check_port() {
    if curl -s "http://localhost:$1" &>/dev/null; then
        echo -e "${GREEN}✓${NC} Port $1 responding"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${YELLOW}!${NC} Port $1 not responding (may not be started)"
        WARNINGS=$((WARNINGS + 1))
    fi
}

check_docker_service() {
    if docker ps --format '{{.Names}}' | grep -q "$1"; then
        echo -e "${GREEN}✓${NC} Docker service $1 running"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${YELLOW}!${NC} Docker service $1 not running"
        WARNINGS=$((WARNINGS + 1))
    fi
}

echo "1. Checking Metrics Infrastructure Files..."
echo "-------------------------------------------"
check_file "libs/infrastructure/src/lib/metrics/metrics.module.ts"
check_file "libs/infrastructure/src/lib/metrics/metrics.service.ts"
check_file "libs/infrastructure/src/lib/metrics/metrics.controller.ts"
check_file "libs/infrastructure/src/lib/metrics/metrics.interceptor.ts"
check_file "libs/infrastructure/src/lib/metrics/index.ts"
echo ""

echo "2. Checking Prometheus Configuration..."
echo "---------------------------------------"
check_file "infrastructure/docker/prometheus/prometheus.yml"
check_file "infrastructure/docker/prometheus/rules/alerts.yml"
echo ""

echo "3. Checking Grafana Configuration..."
echo "------------------------------------"
check_file "infrastructure/docker/grafana/provisioning/datasources/prometheus.yml"
check_file "infrastructure/docker/grafana/provisioning/dashboards/dashboards.yml"
check_file "infrastructure/docker/grafana/dashboards/service-health.json"
check_file "infrastructure/docker/grafana/dashboards/api-performance.json"
check_file "infrastructure/docker/grafana/dashboards/queue-metrics.json"
check_file "infrastructure/docker/grafana/dashboards/business-metrics.json"
echo ""

echo "4. Checking Documentation..."
echo "----------------------------"
check_file "infrastructure/docker/MONITORING.md"
check_file "infrastructure/docker/MONITORING_QUICK_START.md"
check_file "infrastructure/docker/MONITORING_IMPLEMENTATION_REPORT.md"
check_file "infrastructure/docker/MONITORING_SUMMARY.md"
echo ""

echo "5. Checking Dependencies..."
echo "--------------------------"
check_dependency "@willsoto/nestjs-prometheus"
check_dependency "prom-client"
echo ""

echo "6. Checking Docker Services..."
echo "-----------------------------"
check_docker_service "funnel-agents-prometheus"
check_docker_service "funnel-agents-grafana"
echo ""

echo "7. Checking Service Endpoints..."
echo "--------------------------------"
check_port 9090 # Prometheus
check_port 3001 # Grafana
echo ""

echo "=================================================="
echo "Validation Summary"
echo "=================================================="
echo -e "${GREEN}Successful checks: $SUCCESS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation FAILED with $ERRORS error(s)${NC}"
    echo ""
    echo "To fix errors:"
    echo "  1. Run: npm install"
    echo "  2. Verify all files are present"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Validation completed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "To start monitoring services:"
    echo "  make monitoring-up"
    exit 0
else
    echo -e "${GREEN}All checks passed! Monitoring infrastructure is ready.${NC}"
    echo ""
    echo "Quick Start:"
    echo "  1. Start monitoring: make monitoring-up"
    echo "  2. Access Prometheus: http://localhost:9090"
    echo "  3. Access Grafana: http://localhost:3001 (admin/admin)"
    exit 0
fi
