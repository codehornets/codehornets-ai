# Worker Dockerfile using custom cli.js
# Builds on base-custom for full source control

FROM codehornets-base-custom:latest

USER root

# Worker-specific packages (if any)
RUN apt-get update && apt-get install -y \
    inotify-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Ensure directories exist
RUN mkdir -p \
    /tasks \
    /results \
    /home/agent/.claude/hooks \
    /var/log

# Set ownership
RUN chown -R agent:agent /tasks /results /home/agent /var/log

WORKDIR /home/agent/workspace

USER agent

CMD ["/bin/bash", "-c", "tail -f /dev/null"]
