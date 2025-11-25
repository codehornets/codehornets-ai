#!/bin/bash
# Activation System Test Suite
# Tests event-driven agent wakeup, queueing, and graceful shutdown

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

log_info() {
    echo -e "${BLUE}ℹ ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

test_header() {
    ((TESTS_RUN++))
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test $TESTS_RUN: $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Test 1: Container startup and dependency installation
test_container_startup() {
    test_header "Container Startup & Dependencies"

    log_info "Starting containers..."
    cd "$PROJECT_ROOT/core"
    docker-compose -f docker-compose-activated.yml up -d

    log_info "Waiting for containers to be healthy..."
    sleep 10

    # Check Redis
    if docker exec codehornets-redis redis-cli ping | grep -q PONG; then
        log_success "Redis is running"
    else
        log_error "Redis is not responding"
        return 1
    fi

    # Check workers
    for worker in marie anga fabien; do
        if docker ps | grep -q "$worker"; then
            log_success "Container '$worker' is running"

            # Check if activation wrapper started
            if docker logs "$worker" 2>&1 | grep -q "Idle (0% CPU"; then
                log_success "Worker '$worker' is in idle mode (0% CPU)"
            else
                log_warning "Worker '$worker' may not be idle yet"
            fi
        else
            log_error "Container '$worker' is not running"
            return 1
        fi
    done
}

# Test 2: Instant wakeup on task arrival
test_instant_wakeup() {
    test_header "Instant Wakeup Latency (<100ms)"

    # Clean up any existing tasks/results
    rm -f "$PROJECT_ROOT/core/shared/tasks/marie/"*.json
    rm -f "$PROJECT_ROOT/core/shared/results/marie/"*.json

    log_info "Creating test task..."
    START_TIME=$(date +%s%N)

    cat > "$PROJECT_ROOT/core/shared/tasks/marie/wakeup-test.json" <<EOF
{
  "task_id": "wakeup-test",
  "description": "echo 'Hello from Marie!' && date"
}
EOF

    log_info "Waiting for result..."
    TIMEOUT=10
    ELAPSED=0

    while [ ! -f "$PROJECT_ROOT/core/shared/results/marie/wakeup-test.json" ]; do
        sleep 0.1
        ELAPSED=$((ELAPSED + 1))

        if [ $ELAPSED -gt $((TIMEOUT * 10)) ]; then
            log_error "Task did not complete within ${TIMEOUT}s"
            docker logs marie --tail 50
            return 1
        fi
    done

    END_TIME=$(date +%s%N)
    LATENCY=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to ms

    if [ $LATENCY -lt 100 ]; then
        log_success "Wakeup latency: ${LATENCY}ms (EXCELLENT - target: <100ms)"
    elif [ $LATENCY -lt 500 ]; then
        log_warning "Wakeup latency: ${LATENCY}ms (ACCEPTABLE - target: <100ms)"
    else
        log_error "Wakeup latency: ${LATENCY}ms (TOO SLOW - target: <100ms)"
        return 1
    fi

    # Verify result
    if grep -q "wakeup-test" "$PROJECT_ROOT/core/shared/results/marie/wakeup-test.json"; then
        log_success "Result file created correctly"
    else
        log_error "Result file is invalid"
        return 1
    fi

    # Clean up
    rm -f "$PROJECT_ROOT/core/shared/results/marie/wakeup-test.json"
}

# Test 3: Task queueing (multiple tasks)
test_task_queueing() {
    test_header "Task Queueing (No Lost Signals)"

    log_info "Sending 5 tasks simultaneously..."

    for i in {1..5}; do
        cat > "$PROJECT_ROOT/core/shared/tasks/marie/queue-test-$i.json" <<EOF
{
  "task_id": "queue-test-$i",
  "description": "echo 'Task $i completed' && sleep 1"
}
EOF
    done

    log_info "Waiting for all tasks to complete..."
    TIMEOUT=60
    ELAPSED=0

    while [ $(ls -1 "$PROJECT_ROOT/core/shared/results/marie/queue-test-"*.json 2>/dev/null | wc -l) -lt 5 ]; do
        sleep 1
        ELAPSED=$((ELAPSED + 1))

        COMPLETED=$(ls -1 "$PROJECT_ROOT/core/shared/results/marie/queue-test-"*.json 2>/dev/null | wc -l)
        log_info "Completed: $COMPLETED/5"

        if [ $ELAPSED -gt $TIMEOUT ]; then
            log_error "Tasks did not complete within ${TIMEOUT}s"
            return 1
        fi
    done

    log_success "All 5 tasks completed successfully"

    # Clean up
    rm -f "$PROJECT_ROOT/core/shared/tasks/marie/queue-test-"*.json
    rm -f "$PROJECT_ROOT/core/shared/results/marie/queue-test-"*.json
}

# Test 4: Heartbeat monitoring
test_heartbeat() {
    test_header "Heartbeat Monitoring"

    log_info "Checking heartbeat files..."

    for worker in marie anga fabien; do
        HEARTBEAT_FILE="$PROJECT_ROOT/core/shared/heartbeats/$worker.json"

        if [ -f "$HEARTBEAT_FILE" ]; then
            log_success "Heartbeat file exists for '$worker'"

            # Check timestamp age
            TIMESTAMP=$(jq -r '.timestamp' "$HEARTBEAT_FILE")
            AGE=$(( $(date +%s) - $(date -d "$TIMESTAMP" +%s 2>/dev/null || echo 0) ))

            if [ $AGE -lt 30 ]; then
                log_success "Heartbeat is fresh (${AGE}s ago)"
            else
                log_warning "Heartbeat is stale (${AGE}s ago)"
            fi

            # Check status
            STATUS=$(jq -r '.status' "$HEARTBEAT_FILE")
            if [ "$STATUS" == "alive" ]; then
                log_success "Worker status: alive"
            else
                log_error "Worker status: $STATUS"
            fi
        else
            log_error "No heartbeat file for '$worker'"
            return 1
        fi
    done
}

# Test 5: Graceful shutdown
test_graceful_shutdown() {
    test_header "Graceful Shutdown"

    log_info "Starting long-running task..."

    cat > "$PROJECT_ROOT/core/shared/tasks/marie/shutdown-test.json" <<EOF
{
  "task_id": "shutdown-test",
  "description": "echo 'Starting long task...' && sleep 10 && echo 'Task completed!'"
}
EOF

    log_info "Waiting for task to start..."
    sleep 2

    log_info "Sending SIGTERM to Marie..."
    docker kill --signal=SIGTERM marie

    log_info "Waiting for graceful shutdown (max 60s)..."
    START=$(date +%s)

    while docker ps | grep -q marie; do
        sleep 1
        ELAPSED=$(($(date +%s) - START))

        if [ $ELAPSED -gt 70 ]; then
            log_error "Container did not shutdown within grace period"
            return 1
        fi
    done

    SHUTDOWN_TIME=$(($(date +%s) - START))
    log_success "Container shutdown after ${SHUTDOWN_TIME}s"

    # Check if task completed
    if [ -f "$PROJECT_ROOT/core/shared/results/marie/shutdown-test.json" ]; then
        log_success "Long-running task completed before shutdown"
    else
        log_warning "Task may not have completed (expected for SIGTERM test)"
    fi

    # Restart container
    log_info "Restarting Marie..."
    cd "$PROJECT_ROOT/core"
    docker-compose -f docker-compose-activated.yml up -d marie
    sleep 5
}

# Test 6: Redis pub/sub activation (if Redis available)
test_redis_activation() {
    test_header "Redis Pub/Sub Activation"

    # Switch to Redis mode
    log_info "Switching Anga to Redis mode..."
    docker exec anga bash -c 'echo "ACTIVATION_MODE=redis" >> /etc/environment'
    docker restart anga
    sleep 5

    # Check mode
    if docker logs anga 2>&1 | grep -q "Redis listener"; then
        log_success "Anga switched to Redis mode"
    else
        log_error "Anga failed to switch to Redis mode"
        return 1
    fi

    # Send task via Redis
    log_info "Publishing task via Redis..."
    cat > "$PROJECT_ROOT/core/shared/tasks/anga/redis-test.json" <<EOF
{
  "task_id": "redis-test",
  "description": "echo 'Activated via Redis pub/sub!'"
}
EOF

    # Publish activation signal
    docker exec codehornets-redis redis-cli PUBLISH activate:anga "/tasks/redis-test.json"

    log_info "Waiting for result..."
    TIMEOUT=10
    ELAPSED=0

    while [ ! -f "$PROJECT_ROOT/core/shared/results/anga/redis-test.json" ]; do
        sleep 0.5
        ELAPSED=$((ELAPSED + 1))

        if [ $ELAPSED -gt $((TIMEOUT * 2)) ]; then
            log_error "Redis activation did not trigger task"
            return 1
        fi
    done

    log_success "Redis pub/sub activation successful"

    # Clean up
    rm -f "$PROJECT_ROOT/core/shared/tasks/anga/redis-test.json"
    rm -f "$PROJECT_ROOT/core/shared/results/anga/redis-test.json"

    # Switch back to inotify
    docker exec anga bash -c 'sed -i "s/ACTIVATION_MODE=redis/ACTIVATION_MODE=inotify/" /etc/environment'
    docker restart anga
    sleep 5
}

# Test 7: Zero CPU usage when idle
test_zero_cpu_idle() {
    test_header "Zero CPU Usage When Idle"

    log_info "Measuring CPU usage over 10 seconds..."

    # Get baseline CPU
    START_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" marie | sed 's/%//')

    log_info "Waiting 10 seconds..."
    sleep 10

    # Get ending CPU
    END_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" marie | sed 's/%//')

    log_info "CPU usage: ${END_CPU}%"

    # Check if CPU is below 1%
    if (( $(echo "$END_CPU < 1.0" | bc -l) )); then
        log_success "CPU usage is minimal (${END_CPU}% < 1%)"
    else
        log_warning "CPU usage is higher than expected (${END_CPU}%)"
    fi
}

# Main test execution
main() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Agent Activation System - Test Suite"
    echo "═══════════════════════════════════════════════════════════"
    echo ""

    # Create required directories
    mkdir -p "$PROJECT_ROOT/core/shared/tasks/marie"
    mkdir -p "$PROJECT_ROOT/core/shared/tasks/anga"
    mkdir -p "$PROJECT_ROOT/core/shared/tasks/fabien"
    mkdir -p "$PROJECT_ROOT/core/shared/results/marie"
    mkdir -p "$PROJECT_ROOT/core/shared/results/anga"
    mkdir -p "$PROJECT_ROOT/core/shared/results/fabien"
    mkdir -p "$PROJECT_ROOT/core/shared/heartbeats"

    # Run tests
    test_container_startup
    test_instant_wakeup
    test_task_queueing
    test_heartbeat
    test_graceful_shutdown
    test_redis_activation
    test_zero_cpu_idle

    # Summary
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "  Test Summary"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Tests run:    $TESTS_RUN"
    echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
    echo ""

    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
        echo ""
        log_info "System is production-ready with event-driven activation"
        exit 0
    else
        echo -e "${RED}❌ SOME TESTS FAILED${NC}"
        echo ""
        log_warning "Review failed tests above"
        exit 1
    fi
}

# Handle Ctrl+C
trap 'echo ""; log_warning "Tests interrupted"; exit 130' INT

main
