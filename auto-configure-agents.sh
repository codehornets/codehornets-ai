#!/bin/bash

# Auto-configure all agents with default settings
# This skips the interactive theme selection wizard

# Get script directory and change to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "════════════════════════════════════════════════════════════════"
echo "   Auto-configuring Agent Settings"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Function to create settings.json for an agent
configure_agent() {
    local agent_name=$1
    local auth_home="core/shared/auth-homes/${agent_name}"

    echo "Configuring ${agent_name}..."

    # Create settings.json with theme preference
    cat > "${auth_home}/settings.json" <<EOF
{
  "theme": "dark",
  "setupComplete": true
}
EOF

    echo "  ✓ Created settings.json"

    # Ensure settings.local.json exists (created by docker-compose for workers)
    if [ "${agent_name}" != "orchestrator" ]; then
        if [ ! -f "${auth_home}/settings.local.json" ]; then
            echo "{\"outputStyle\": \"${agent_name}\"}" > "${auth_home}/settings.local.json"
            echo "  ✓ Created settings.local.json"
        else
            echo "  ✓ settings.local.json already exists"
        fi
    fi

    echo ""
}

# Configure all agents
configure_agent "orchestrator"
configure_agent "marie"
configure_agent "anga"
configure_agent "fabien"

echo "════════════════════════════════════════════════════════════════"
echo "   Configuration Complete!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Now restart the containers to apply settings:"
echo "  make restart"
echo ""
echo "Then attach to orchestrator:"
echo "  make attach"
echo ""
