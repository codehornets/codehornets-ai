# Base Dockerfile for CodeHornets AI Agents
# Extends docker/sandbox-templates:claude-code with common packages

FROM docker/sandbox-templates:claude-code

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
    nodejs \
    npm \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install common Python packages
RUN pip3 install --no-cache-dir \
    requests \
    pyyaml \
    python-dotenv \
    redis \
    asyncio

# Install common Node packages globally
RUN npm install -g \
    pm2 \
    nodemon

# Create common directories
RUN mkdir -p \
    /shared/pipes \
    /shared/messages \
    /shared/tasks \
    /shared/results \
    /shared/heartbeats \
    /shared/inbox \
    /shared/triggers \
    /shared/workspaces

# Set working directory
WORKDIR /home/agent/workspace

# Keep container running
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
