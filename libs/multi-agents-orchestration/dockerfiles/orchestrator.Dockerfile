# Orchestrator Dockerfile using custom per-agent CLI
# Supports both tmux and node-pty communication strategies
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
    curl wget git vim nano jq tree htop \
    build-essential gcc g++ make cmake \
    python3 python3-pip python3-venv \
    netcat-openbsd telnet iputils-ping dnsutils \
    docker.io \
    expect tmux screen socat \
    inotify-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python packages for orchestration tools
RUN pip3 install --no-cache-dir --break-system-packages \
    requests pyyaml python-dotenv redis asyncio

# Install global Node.js packages including node-gyp for native modules
RUN npm install -g pm2 nodemon node-gyp

# Set terminal environment for proper color and control sequence support
ENV TERM=xterm-256color
ENV COLORTERM=truecolor

# Copy ORCHESTRATOR-SPECIFIC CLI
COPY libs/multi-agents-orchestration/cli-agents/orchestrator-cli.js /opt/claude-cli/cli.js

# Create wrapper
RUN echo '#!/bin/bash' > /usr/local/bin/claude && \
    echo 'exec node /opt/claude-cli/cli.js "$@"' >> /usr/local/bin/claude && \
    chmod +x /usr/local/bin/claude

# Create all necessary directories including sockets for IPC and tmux logs
RUN mkdir -p /shared/pipes /shared/messages /shared/tasks /shared/results \
    /shared/heartbeats /shared/inbox /shared/triggers /shared/workspaces \
    /shared/sockets \
    /tasks /results /home/agent/.claude/hooks /var/log /opt/claude-cli \
    /tmp/tmux-logs

# Set proper permissions - sockets directory needs specific permissions for IPC
RUN chown -R agent:agent /shared /opt/claude-cli /home/agent /tasks /results /var/log /tmp/tmux-logs && \
    chmod 755 /shared/sockets

# Set tmux temp directory
ENV TMUX_TMPDIR=/tmp

WORKDIR /home/agent/workspace
USER agent
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
