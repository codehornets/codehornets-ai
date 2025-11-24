# Base Dockerfile for CodeHornets AI agents
# This provides common dependencies for both tmux and node-pty communication strategies
FROM node:22-slim

USER root

# Rename node user to agent for clarity
RUN usermod -l agent -d /home/agent -m node && \
    groupmod -n agent node && \
    mkdir -p /home/agent && \
    chown -R agent:agent /home/agent

# Install base packages including tmux, socat, and build tools for node-pty
# - tmux: Terminal multiplexer for persistent sessions
# - socat: Socket relay for inter-process communication
# - build-essential: Required for compiling native Node modules (node-pty)
# - python3: Required by node-gyp for building native modules
RUN apt-get update && apt-get install -y \
    # Core utilities
    curl wget git vim nano jq tree htop \
    # Build tools for native Node modules (node-pty, node-gyp)
    build-essential gcc g++ make cmake \
    python3 python3-pip python3-venv \
    # Networking utilities
    netcat-openbsd telnet iputils-ping dnsutils \
    # Container tools
    docker.io \
    # Automation and terminal management
    expect tmux screen socat \
    # File system monitoring
    inotify-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python packages for orchestration tools
RUN pip3 install --no-cache-dir --break-system-packages \
    requests pyyaml python-dotenv redis asyncio

# Install global Node.js packages
# - pm2: Process manager for Node applications
# - nodemon: Auto-restart for development
# - node-gyp: Required for compiling native modules
RUN npm install -g pm2 nodemon node-gyp

# Set terminal environment for proper color and control sequence support
ENV TERM=xterm-256color
ENV COLORTERM=truecolor

# Create all necessary directories including sockets
RUN mkdir -p /shared/pipes /shared/messages /shared/tasks /shared/results \
    /shared/heartbeats /shared/inbox /shared/triggers /shared/workspaces \
    /shared/sockets \
    /tasks /results /home/agent/.claude/hooks /var/log /opt/claude-cli

# Set proper permissions
RUN chown -R agent:agent /shared /opt/claude-cli /home/agent /tasks /results /var/log && \
    chmod 755 /shared/sockets

WORKDIR /home/agent/workspace
