# Orchestrator Dockerfile with PTY Wrapper Support
FROM node:22-slim

USER root

# Rename node user to agent
RUN usermod -l agent -d /home/agent -m node && \
    groupmod -n agent node && \
    mkdir -p /home/agent && \
    chown -R agent:agent /home/agent

# Install system packages including node-pty build dependencies
RUN apt-get update && apt-get install -y \
    curl wget git vim nano jq tree htop \
    build-essential gcc g++ make cmake python3 python3-pip python3-venv \
    netcat-openbsd telnet iputils-ping dnsutils \
    docker.io expect tmux screen \
    inotify-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir --break-system-packages \
    requests pyyaml python-dotenv redis asyncio

# Install global Node.js tools
RUN npm install -g pm2 nodemon

# Copy ORCHESTRATOR-SPECIFIC CLI
COPY libs/multi-agents-orchestration/cli-agents/orchestrator-cli.js /opt/claude-cli/cli.js

# Create Claude wrapper
RUN echo '#!/bin/bash' > /usr/local/bin/claude && \
    echo 'exec node /opt/claude-cli/cli.js "$@"' >> /usr/local/bin/claude && \
    chmod +x /usr/local/bin/claude

# Create all necessary directories
RUN mkdir -p \
    /shared/pipes /shared/messages /shared/tasks /shared/results \
    /shared/heartbeats /shared/inbox /shared/triggers /shared/workspaces \
    /shared/sockets \
    /tasks /results /home/agent/.claude/hooks /var/log /opt/claude-cli \
    /pty-wrapper/src \
    /orchestrator

# Copy PTY wrapper module
COPY libs/multi-agents-orchestration/pty-wrapper/package.json /pty-wrapper/
COPY libs/multi-agents-orchestration/pty-wrapper/src/ /pty-wrapper/src/

# Copy orchestrator client module
COPY libs/multi-agents-orchestration/orchestrator/ /orchestrator/

# Install PTY wrapper dependencies (includes node-pty compilation)
WORKDIR /pty-wrapper
RUN npm install --build-from-source

# Set proper ownership
RUN chown -R agent:agent /shared /opt/claude-cli /home/agent /tasks /results /var/log /pty-wrapper /orchestrator

WORKDIR /home/agent/workspace
USER agent
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
