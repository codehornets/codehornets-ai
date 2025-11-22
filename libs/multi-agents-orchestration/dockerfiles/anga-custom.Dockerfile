# Anga Worker Dockerfile using custom per-agent CLI
FROM node:22-slim

USER root

RUN usermod -l agent -d /home/agent -m node && \
    groupmod -n agent node && \
    mkdir -p /home/agent && \
    chown -R agent:agent /home/agent

RUN apt-get update && apt-get install -y \
    curl wget git vim nano jq tree htop \
    build-essential gcc g++ make cmake \
    netcat-openbsd telnet iputils-ping dnsutils \
    docker.io expect tmux screen \
    python3 python3-pip python3-venv inotify-tools \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --break-system-packages \
    requests pyyaml python-dotenv redis asyncio

RUN npm install -g pm2 nodemon

# Copy ANGA-SPECIFIC CLI
COPY libs/multi-agents-orchestration/cli-agents/anga-cli.js /opt/claude-cli/cli.js

RUN echo '#!/bin/bash' > /usr/local/bin/claude && \
    echo 'exec node /opt/claude-cli/cli.js "$@"' >> /usr/local/bin/claude && \
    chmod +x /usr/local/bin/claude

RUN mkdir -p /shared/pipes /shared/messages /shared/tasks /shared/results \
    /shared/heartbeats /shared/inbox /shared/triggers /shared/workspaces \
    /tasks /results /home/agent/.claude/hooks /var/log /opt/claude-cli

RUN chown -R agent:agent /shared /opt/claude-cli /home/agent /tasks /results /var/log

WORKDIR /home/agent/workspace
USER agent
CMD ["/bin/bash", "-c", "tail -f /dev/null"]
