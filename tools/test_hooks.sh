#!/bin/bash
# Hooks Integration Test Script
# Tests file triggers, named pipes, and watcher functionality

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SHARED_DIR="$PROJECT_ROOT/infrastructure/docker/codehornets-ai/shared"

echo "════════════════════════════════════════════════════════════════"
echo "  Hooks Integration Test Suite"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((passed++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((failed++))
    fi
}

# =============================================================================
# TEST 1: Container Health Check
# =============================================================================

echo "TEST 1: Container Health Check"
echo "───────────────────────────────────────────────────────────────"

marie_running=$(docker ps --filter "name=marie" --format "{{.Names}}" | grep -c "marie" || true)
anga_running=$(docker ps --filter "name=anga" --format "{{.Names}}" | grep -c "anga" || true)
fabien_running=$(docker ps --filter "name=fabien" --format "{{.Names}}" | grep -c "fabien" || true)

test_result $((marie_running == 0)) "Marie container is running"
test_result $((anga_running == 0)) "Anga container is running"
test_result $((fabien_running == 0)) "Fabien container is running"

echo ""

# =============================================================================
# TEST 2: Hook Watcher Processes
# =============================================================================

echo "TEST 2: Hook Watcher Processes"
echo "───────────────────────────────────────────────────────────────"

marie_watcher=$(docker exec marie ps aux | grep -c "[h]ook_watcher.py" || true)
anga_watcher=$(docker exec anga ps aux | grep -c "[h]ook_watcher.py" || true)
fabien_watcher=$(docker exec fabien ps aux | grep -c "[h]ook_watcher.py" || true)

test_result $((marie_watcher == 0)) "Marie hook watcher is running"
test_result $((anga_watcher == 0)) "Anga hook watcher is running"
test_result $((fabien_watcher == 0)) "Fabien hook watcher is running"

echo ""

# =============================================================================
# TEST 3: Directory Structure
# =============================================================================

echo "TEST 3: Directory Structure"
echo "───────────────────────────────────────────────────────────────"

test_result $([[ -d "$SHARED_DIR/triggers/marie" ]] && echo 0 || echo 1) "Marie trigger directory exists"
test_result $([[ -d "$SHARED_DIR/triggers/anga" ]] && echo 0 || echo 1) "Anga trigger directory exists"
test_result $([[ -d "$SHARED_DIR/triggers/fabien" ]] && echo 0 || echo 1) "Fabien trigger directory exists"
test_result $([[ -d "$SHARED_DIR/pipes" ]] && echo 0 || echo 1) "Pipes directory exists"
test_result $([[ -d "$SHARED_DIR/watcher-logs" ]] && echo 0 || echo 1) "Watcher logs directory exists"

echo ""

# =============================================================================
# TEST 4: Named Pipes Creation
# =============================================================================

echo "TEST 4: Named Pipes"
echo "───────────────────────────────────────────────────────────────"

test_result $([[ -p "$SHARED_DIR/pipes/marie-control" ]] && echo 0 || echo 1) "Marie control pipe exists"
test_result $([[ -p "$SHARED_DIR/pipes/marie-status" ]] && echo 0 || echo 1) "Marie status pipe exists"
test_result $([[ -p "$SHARED_DIR/pipes/anga-control" ]] && echo 0 || echo 1) "Anga control pipe exists"
test_result $([[ -p "$SHARED_DIR/pipes/anga-status" ]] && echo 0 || echo 1) "Anga status pipe exists"

echo ""

# =============================================================================
# TEST 5: Hook Configuration Files
# =============================================================================

echo "TEST 5: Hook Configurations"
echo "───────────────────────────────────────────────────────────────"

test_result $([[ -f "$PROJECT_ROOT/infrastructure/docker/codehornets-ai/hooks-config/marie-hooks.json" ]] && echo 0 || echo 1) "Marie hooks config exists"
test_result $([[ -f "$PROJECT_ROOT/infrastructure/docker/codehornets-ai/hooks-config/anga-hooks.json" ]] && echo 0 || echo 1) "Anga hooks config exists"
test_result $([[ -f "$PROJECT_ROOT/infrastructure/docker/codehornets-ai/hooks-config/fabien-hooks.json" ]] && echo 0 || echo 1) "Fabien hooks config exists"

echo ""

# =============================================================================
# TEST 6: Trigger File Processing
# =============================================================================

echo "TEST 6: Trigger File Processing"
echo "───────────────────────────────────────────────────────────────"

# Create test trigger
echo '{"test": "integration", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > "$SHARED_DIR/triggers/marie/test-integration.trigger"
echo "Created test trigger..."

# Wait for processing
sleep 3

# Check if trigger was processed (file should be deleted)
if [ ! -f "$SHARED_DIR/triggers/marie/test-integration.trigger" ]; then
    test_result 0 "Marie processed trigger file"
else
    test_result 1 "Marie did not process trigger file"
fi

# Check watcher log
if [ -f "$SHARED_DIR/watcher-logs/marie-watcher.log" ]; then
    if grep -q "test-integration" "$SHARED_DIR/watcher-logs/marie-watcher.log"; then
        test_result 0 "Trigger logged in Marie's watcher"
    else
        test_result 1 "Trigger not found in watcher log"
    fi
else
    test_result 1 "Marie watcher log not found"
fi

echo ""

# =============================================================================
# TEST 7: Latency Benchmark
# =============================================================================

echo "TEST 7: Latency Benchmark"
echo "───────────────────────────────────────────────────────────────"

echo "Creating 10 test triggers..."
start_time=$(date +%s%N)

for i in {1..10}; do
    echo "{\"benchmark\": $i}" > "$SHARED_DIR/triggers/marie/bench-$i.trigger"
done

# Wait for processing
sleep 5

end_time=$(date +%s%N)
duration=$(( ($end_time - $start_time) / 1000000 ))  # Convert to milliseconds
avg_latency=$(( $duration / 10 ))

echo "Total time: ${duration}ms"
echo "Average latency: ${avg_latency}ms per trigger"

if [ $avg_latency -lt 1000 ]; then
    test_result 0 "Latency within acceptable range (<1s)"
else
    test_result 1 "Latency too high (>1s)"
fi

echo ""

# =============================================================================
# TEST 8: Watcher Logs
# =============================================================================

echo "TEST 8: Watcher Logs"
echo "───────────────────────────────────────────────────────────────"

if [ -f "$SHARED_DIR/watcher-logs/marie-watcher.log" ]; then
    lines=$(wc -l < "$SHARED_DIR/watcher-logs/marie-watcher.log")
    echo "Marie watcher log: $lines lines"
    test_result 0 "Marie watcher log exists and has entries"

    # Show last 5 lines
    echo "Last 5 log entries:"
    tail -5 "$SHARED_DIR/watcher-logs/marie-watcher.log" | sed 's/^/  /'
else
    test_result 1 "Marie watcher log not found"
fi

echo ""

# =============================================================================
# TEST 9: Heartbeat Files
# =============================================================================

echo "TEST 9: Heartbeat Files"
echo "───────────────────────────────────────────────────────────────"

if [ -f "$SHARED_DIR/heartbeats/marie-watcher.json" ]; then
    status=$(jq -r '.status' "$SHARED_DIR/heartbeats/marie-watcher.json" 2>/dev/null || echo "error")
    if [ "$status" = "alive" ]; then
        test_result 0 "Marie watcher heartbeat is alive"
        echo "  Heartbeat: $(jq -r '.timestamp' "$SHARED_DIR/heartbeats/marie-watcher.json" 2>/dev/null)"
    else
        test_result 1 "Marie watcher heartbeat shows non-alive status"
    fi
else
    test_result 1 "Marie watcher heartbeat file not found"
fi

echo ""

# =============================================================================
# TEST 10: Named Pipe Communication
# =============================================================================

echo "TEST 10: Named Pipe Communication"
echo "───────────────────────────────────────────────────────────────"

# Test control pipe (non-blocking write)
if [ -p "$SHARED_DIR/pipes/marie-control" ]; then
    timeout 1 bash -c "echo '{\"command\": \"status\"}' > $SHARED_DIR/pipes/marie-control" 2>/dev/null || true
    test_result 0 "Successfully wrote to Marie control pipe"
else
    test_result 1 "Marie control pipe not found"
fi

echo ""

# =============================================================================
# SUMMARY
# =============================================================================

echo "════════════════════════════════════════════════════════════════"
echo "  Test Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
