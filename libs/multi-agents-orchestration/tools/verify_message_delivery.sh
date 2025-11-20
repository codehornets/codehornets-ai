#!/bin/bash
# Verify if messages are actually being delivered to agents
# This sends a unique test message and checks if it appears in logs

AGENT="$1"
TEST_ID="TEST_$(date +%s)"

if [ -z "$AGENT" ]; then
    echo "Usage: $0 <agent>"
    exit 1
fi

echo "Sending unique test message: $TEST_ID"
bash tools/send_agent_message.sh "$AGENT" "DELIVERY_TEST_$TEST_ID" > /dev/null 2>&1

echo "Waiting 3 seconds for delivery..."
sleep 3

echo "Checking if message appears in $AGENT logs..."
if docker logs "codehornets-worker-$AGENT" --since 5s 2>&1 | grep -q "$TEST_ID"; then
    echo "✓ SUCCESS: Message was delivered to $AGENT"
    exit 0
else
    echo "✗ FAILED: Message NOT found in $AGENT logs"
    echo ""
    echo "Last 20 lines of $AGENT logs:"
    docker logs "codehornets-worker-$AGENT" --tail 20 2>&1 | cat -v | tail -10
    exit 1
fi
