#!/bin/bash
# Install make in orchestrator container
# This is needed for Option C (Makefile support in orchestrator)
# Run this once after starting the orchestrator container

set -e

echo "🔧 Installing make in orchestrator container..."

docker exec --user root codehornets-orchestrator bash -c "
    apt-get update -qq && \
    apt-get install -y -qq make > /dev/null 2>&1 && \
    echo '✓ Make installed successfully'
"

echo ""
echo "✅ Orchestrator can now use Makefile commands:"
echo "   docker exec codehornets-orchestrator make msg-anga MSG='your message'"
echo "   docker exec codehornets-orchestrator make msg-marie MSG='your message'"
echo "   docker exec codehornets-orchestrator make msg-fabien MSG='your message'"
