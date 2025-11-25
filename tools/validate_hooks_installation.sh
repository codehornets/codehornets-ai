#!/bin/bash
# Hooks Installation Validation Script
# Verifies all components are correctly installed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "════════════════════════════════════════════════════════════════"
echo "  Hooks Installation Validation"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

passed=0
failed=0

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $2"
        ((failed++))
    fi
}

# 1. Check files exist
echo "1. Checking required files..."
echo "───────────────────────────────────────────────────────────────"

check $([[ -f "$PROJECT_ROOT/infrastructure/docker/codehornets-ai/docker-compose.hooks.yml" ]] && echo 0 || echo 1) \
    "docker-compose.hooks.yml exists"

check $([[ -f "$PROJECT_ROOT/tools/entrypoint.sh" ]] && echo 0 || echo 1) \
    "entrypoint.sh exists"

check $([[ -f "$PROJECT_ROOT/tools/hook_watcher.py" ]] && echo 0 || echo 1) \
    "hook_watcher.py exists"

check $([[ -f "$PROJECT_ROOT/tools/test_hooks.sh" ]] && echo 0 || echo 1) \
    "test_hooks.sh exists"

echo ""

# 2. Check hook configurations
echo "2. Checking hook configurations..."
echo "───────────────────────────────────────────────────────────────"

for worker in marie anga fabien orchestrator; do
    config_file="$PROJECT_ROOT/infrastructure/docker/codehornets-ai/hooks-config/${worker}-hooks.json"
    if [ -f "$config_file" ]; then
        if jq . "$config_file" > /dev/null 2>&1; then
            check 0 "${worker}-hooks.json is valid JSON"
        else
            check 1 "${worker}-hooks.json has invalid JSON"
        fi
    else
        check 1 "${worker}-hooks.json not found"
    fi
done

echo ""

# 3. Check scripts are executable
echo "3. Checking script permissions..."
echo "───────────────────────────────────────────────────────────────"

check $([[ -x "$PROJECT_ROOT/tools/entrypoint.sh" ]] && echo 0 || echo 1) \
    "entrypoint.sh is executable"

check $([[ -x "$PROJECT_ROOT/tools/hook_watcher.py" ]] && echo 0 || echo 1) \
    "hook_watcher.py is executable"

check $([[ -x "$PROJECT_ROOT/tools/test_hooks.sh" ]] && echo 0 || echo 1) \
    "test_hooks.sh is executable"

echo ""

# 4. Check Makefile commands
echo "4. Checking Makefile commands..."
echo "───────────────────────────────────────────────────────────────"

if [ -f "$PROJECT_ROOT/Makefile" ]; then
    for cmd in start-hooks stop-hooks restart-hooks start-hybrid logs-watcher-marie test-hooks hooks-status; do
        if grep -q "^${cmd}:" "$PROJECT_ROOT/Makefile"; then
            check 0 "Makefile has '${cmd}' target"
        else
            check 1 "Makefile missing '${cmd}' target"
        fi
    done
else
    check 1 "Makefile not found"
fi

echo ""

# 5. Check GitHub Actions workflow
echo "5. Checking CI/CD workflow..."
echo "───────────────────────────────────────────────────────────────"

check $([[ -f "$PROJECT_ROOT/.github/workflows/test-hooks.yml" ]] && echo 0 || echo 1) \
    "GitHub Actions workflow exists"

echo ""

# 6. Check Kubernetes manifests
echo "6. Checking Kubernetes manifests..."
echo "───────────────────────────────────────────────────────────────"

check $([[ -f "$PROJECT_ROOT/infrastructure/kubernetes/hooks/configmap-hooks.yaml" ]] && echo 0 || echo 1) \
    "Kubernetes ConfigMap manifest exists"

check $([[ -f "$PROJECT_ROOT/infrastructure/kubernetes/hooks/deployment-marie.yaml" ]] && echo 0 || echo 1) \
    "Kubernetes Deployment manifest exists"

echo ""

# 7. Check documentation
echo "7. Checking documentation..."
echo "───────────────────────────────────────────────────────────────"

check $([[ -f "$PROJECT_ROOT/docs/HOOKS_DEPLOYMENT_GUIDE.md" ]] && echo 0 || echo 1) \
    "Deployment guide exists"

check $([[ -f "$PROJECT_ROOT/docs/HOOKS_TROUBLESHOOTING.md" ]] && echo 0 || echo 1) \
    "Troubleshooting guide exists"

check $([[ -f "$PROJECT_ROOT/infrastructure/docker/codehornets-ai/HOOKS_README.md" ]] && echo 0 || echo 1) \
    "Hooks README exists"

check $([[ -f "$PROJECT_ROOT/HOOKS_INTEGRATION_SUMMARY.md" ]] && echo 0 || echo 1) \
    "Integration summary exists"

echo ""

# 8. Check Python syntax
echo "8. Checking Python syntax..."
echo "───────────────────────────────────────────────────────────────"

if command -v python3 > /dev/null 2>&1; then
    if python3 -m py_compile "$PROJECT_ROOT/tools/hook_watcher.py" 2>/dev/null; then
        check 0 "hook_watcher.py syntax is valid"
    else
        check 1 "hook_watcher.py has syntax errors"
    fi

    if python3 -m py_compile "$PROJECT_ROOT/tools/activation_wrapper.py" 2>/dev/null; then
        check 0 "activation_wrapper.py syntax is valid"
    else
        check 1 "activation_wrapper.py has syntax errors"
    fi
else
    echo -e "${YELLOW}⚠${NC} Python3 not found, skipping syntax checks"
fi

echo ""

# 9. Check Docker Compose syntax
echo "9. Checking Docker Compose syntax..."
echo "───────────────────────────────────────────────────────────────"

if command -v docker-compose > /dev/null 2>&1; then
    cd "$PROJECT_ROOT/infrastructure/docker/codehornets-ai"
    if docker-compose -f docker-compose.hooks.yml config > /dev/null 2>&1; then
        check 0 "docker-compose.hooks.yml syntax is valid"
    else
        check 1 "docker-compose.hooks.yml has syntax errors"
    fi
    cd "$PROJECT_ROOT"
else
    echo -e "${YELLOW}⚠${NC} docker-compose not found, skipping syntax check"
fi

echo ""

# 10. Check required tools
echo "10. Checking required tools..."
echo "───────────────────────────────────────────────────────────────"

for tool in docker jq make; do
    if command -v "$tool" > /dev/null 2>&1; then
        check 0 "$tool is installed"
    else
        check 1 "$tool is not installed"
    fi
done

echo ""

# Summary
echo "════════════════════════════════════════════════════════════════"
echo "  Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Hooks system is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start hooks mode:  make start-hooks"
    echo "  2. Check status:      make hooks-status"
    echo "  3. Run tests:         make test-hooks"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Missing files: Re-run installation"
    echo "  - Permission errors: chmod +x tools/*.sh tools/*.py"
    echo "  - Syntax errors: Check file contents"
    echo ""
    exit 1
fi
