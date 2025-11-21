# Anga Agent Dockerfile
# Specialized for coding, backend development, and software engineering

FROM codehornets-base:latest

# Install coding-specific packages
RUN apt-get update && apt-get install -y \
    # Version control
    git-lfs \
    tig \
    # Code analysis
    cloc \
    shellcheck \
    # Databases
    sqlite3 \
    postgresql-client \
    mysql-client \
    mongodb-clients \
    redis-tools \
    # Backend tools
    nginx \
    apache2-utils \
    # API testing
    httpie \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install multiple Python versions
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3.11 \
    python3-pip \
    && apt-get clean

# Install coding-specific Python packages
RUN pip3 install --no-cache-dir \
    # Web frameworks
    fastapi \
    uvicorn \
    flask \
    django \
    # Database ORMs
    sqlalchemy \
    psycopg2-binary \
    pymongo \
    # Testing
    pytest \
    pytest-cov \
    pytest-asyncio \
    # Code quality
    black \
    flake8 \
    pylint \
    mypy \
    # Async
    aiohttp \
    asyncpg \
    # Data processing
    pandas \
    numpy

# Install Node.js development tools
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    jest \
    eslint \
    prettier \
    webpack \
    vite

# Install Go
RUN wget -q https://go.dev/dl/go1.21.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz && \
    rm go1.21.5.linux-amd64.tar.gz

ENV PATH=$PATH:/usr/local/go/bin
ENV GOPATH=/home/agent/go

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set environment variables
ENV AGENT_NAME=anga
ENV AGENT_ROLE=worker

# Set working directory
WORKDIR /home/agent/workspace

LABEL ai.codehornets.agent="anga"
LABEL ai.codehornets.role="coding_assistant"
LABEL ai.codehornets.description="Software development and backend engineering"
LABEL ai.codehornets.specialties="python,nodejs,go,rust,databases,apis"
