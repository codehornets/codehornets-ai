# Base Dockerfile for PTY Wrapper Agents
# This Dockerfile adds node-pty build dependencies and the wrapper module

FROM node:22-slim

USER root

# Rename node user to agent
RUN usermod -l agent -d /home/agent -m node && \
    groupmod -n agent node && \
    mkdir -p /home/agent && \
    chown -R agent:agent /home/agent

# Install system packages including node-pty build dependencies
RUN apt-get update && apt-get install -y \
    # Essential tools
    curl wget git vim nano jq tree htop \
    # Build tools (required for node-pty)
    build-essential gcc g++ make cmake python3 python3-pip python3-venv \
    # Network tools
    netcat-openbsd telnet iputils-ping dnsutils \
    # Docker and automation
    docker.io expect tmux screen \
    # File watching
    inotify-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir --break-system-packages \
    requests pyyaml python-dotenv redis asyncio

# Install global Node.js tools
RUN npm install -g pm2 nodemon

# Create all necessary directories
RUN mkdir -p \
    /shared/pipes \
    /shared/messages \
    /shared/tasks \
    /shared/results \
    /shared/heartbeats \
    /shared/inbox \
    /shared/triggers \
    /shared/workspaces \
    /shared/sockets \
    /tasks \
    /results \
    /home/agent/.claude/hooks \
    /var/log \
    /opt/claude-cli \
    /pty-wrapper

# Copy PTY wrapper module
COPY libs/multi-agents-orchestration/pty-wrapper /pty-wrapper/

# Install PTY wrapper dependencies (includes node-pty compilation)
WORKDIR /pty-wrapper
RUN npm install --build-from-source

# Set proper ownership
RUN chown -R agent:agent /shared /opt/claude-cli /home/agent /tasks /results /var/log /pty-wrapper

WORKDIR /home/agent/workspace
