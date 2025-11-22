# Base Dockerfile for CodeHornets AI Agents
# Uses custom cli.js instead of official Claude Code CLI for full source control

FROM node:22-slim

# Switch to root for package installation
USER root

# Create agent user - use existing node user (UID 1000) or create new
# node:22-slim already has node:node with UID/GID 1000
RUN usermod -l agent -d /home/agent -m node && \
    groupmod -n agent node && \
    mkdir -p /home/agent && \
    chown -R agent:agent /home/agent

# Install common packages for all agents
RUN apt-get update && apt-get install -y \
    # Core utilities
    curl \
    wget \
    git \
    vim \
    nano \
    jq \
    tree \
    htop \
    # Build tools
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    # Networking
    netcat-openbsd \
    telnet \
    iputils-ping \
    dnsutils \
    # Docker client
    docker.io \
    # Automation
    expect \
    tmux \
    screen \
    # Languages
    python3 \
    python3-pip \
    python3-venv \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install common Python packages
RUN pip3 install --no-cache-dir --break-system-packages \
    requests \
    pyyaml \
    python-dotenv \
    redis \
    asyncio

# Install common Node packages globally
RUN npm install -g \
    pm2 \
    nodemon

# Create custom CLI directory and copy cli.js
COPY core/cli.js /opt/claude-cli/cli.js

# Create wrapper script that invokes custom CLI
RUN echo '#!/usr/bin/env node' > /usr/local/bin/claude && \
    echo 'import("/opt/claude-cli/cli.js");' >> /usr/local/bin/claude && \
    chmod +x /usr/local/bin/claude

# Alternative: direct node execution wrapper
RUN echo '#!/bin/bash' > /usr/local/bin/claude-cli && \
    echo 'exec node /opt/claude-cli/cli.js "$@"' >> /usr/local/bin/claude-cli && \
    chmod +x /usr/local/bin/claude-cli

# Create common directories
RUN mkdir -p \
    /shared/pipes \
    /shared/messages \
    /shared/tasks \
    /shared/results \
    /shared/heartbeats \
    /shared/inbox \
    /shared/triggers \
    /shared/workspaces \
    /opt/claude-cli

# Set ownership
RUN chown -R agent:agent /shared /opt/claude-cli /home/agent

# Set working directory
WORKDIR /home/agent/workspace

# Switch to agent user
USER agent

# Keep container running
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
