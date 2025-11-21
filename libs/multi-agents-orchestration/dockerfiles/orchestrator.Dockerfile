# Orchestrator Agent Dockerfile
# Specialized for task coordination, delegation, and monitoring

FROM codehornets-base:latest

# Install orchestrator-specific packages
RUN apt-get update && apt-get install -y \
    # Monitoring tools
    sysstat \
    iotop \
    iftop \
    # Process management
    supervisor \
    # Database clients (for querying worker DBs)
    postgresql-client \
    mysql-client \
    redis-tools \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install orchestrator-specific Python packages
RUN pip3 install --no-cache-dir \
    schedule \
    celery \
    flower \
    psutil \
    docker \
    pyyaml \
    jsonschema

# Install orchestrator-specific Node packages
RUN npm install -g \
    commander \
    chalk \
    ora \
    inquirer

# Set environment variables
ENV AGENT_NAME=orchestrator
ENV AGENT_ROLE=orchestrator

# Set working directory
WORKDIR /home/agent/workspace

LABEL ai.codehornets.agent="orchestrator"
LABEL ai.codehornets.role="coordinator"
LABEL ai.codehornets.description="Task coordination and delegation"
