# ============================================================================
# n8n Workflow Automation - Custom Dockerfile
# ============================================================================
# This Dockerfile extends the official n8n image with:
# - Custom nodes for HandyMate integration
# - Laravel authentication integration
# - Additional security hardening
# - Performance optimizations
#
# Based on: n8nio/n8n:latest
# ============================================================================

FROM n8nio/n8n:latest

# Metadata
LABEL maintainer="HandyMate <dev@handymate.com>"
LABEL description="Custom n8n image for HandyMate CRM integration"
LABEL version="1.0.0"

# ============================================================================
# Build Arguments
# ============================================================================
ARG NODE_ENV=production
ARG N8N_VERSION=latest

# ============================================================================
# Environment Variables
# ============================================================================
ENV NODE_ENV=${NODE_ENV} \
    N8N_USER_FOLDER=/home/node/.n8n \
    N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom

# ============================================================================
# Switch to root for installations
# ============================================================================
USER root

# ============================================================================
# Install Additional Dependencies
# ============================================================================
RUN apk add --no-cache \
    # Security scanning and monitoring
    curl \
    wget \
    jq \
    # Database clients
    mysql-client \
    postgresql-client \
    # Timezone data
    tzdata \
    # SSL/TLS certificates
    ca-certificates \
    # Process monitoring
    tini \
    # Health check utilities
    busybox-extras \
    && rm -rf /var/cache/apk/*

# ============================================================================
# Create Required Directories
# ============================================================================
RUN mkdir -p \
    /home/node/.n8n/custom \
    /home/node/.n8n/logs \
    /home/node/.n8n/backups \
    /files \
    && chown -R node:node /home/node/.n8n /files

# ============================================================================
# Install Custom n8n Nodes (Optional)
# ============================================================================
# Uncomment to install custom nodes from npm or local files
# COPY --chown=node:node ./custom-nodes /home/node/.n8n/custom/
# RUN cd /home/node/.n8n/custom && npm install

# ============================================================================
# Copy Custom Configuration Files
# ============================================================================
COPY --chown=node:node ./custom-hooks.js /home/node/.n8n/
COPY --chown=node:node ./health-check.sh /usr/local/bin/health-check
RUN chmod +x /usr/local/bin/health-check

# ============================================================================
# Security Hardening
# ============================================================================
# Remove unnecessary packages
RUN apk del --purge \
    && rm -rf /var/cache/apk/* \
    && rm -rf /tmp/* \
    && rm -rf /root/.npm

# Set secure permissions
RUN chmod 755 /home/node/.n8n \
    && find /home/node/.n8n -type f -exec chmod 644 {} \; \
    && find /home/node/.n8n -type d -exec chmod 755 {} \;

# ============================================================================
# Switch back to node user (security best practice)
# ============================================================================
USER node

# ============================================================================
# Health Check
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/health-check || exit 1

# ============================================================================
# Volumes
# ============================================================================
VOLUME ["/home/node/.n8n", "/files"]

# ============================================================================
# Expose Ports
# ============================================================================
EXPOSE 5678

# ============================================================================
# Entrypoint & Command
# ============================================================================
# Use tini for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start n8n
CMD ["n8n"]

# ============================================================================
# Build Instructions
# ============================================================================
# Build:
#   docker build -t handymate-n8n:latest -f infrastructure/docker/n8n/Dockerfile .
#
# Run:
#   docker run -d --name n8n -p 5678:5678 handymate-n8n:latest
#
# Multi-stage build for optimization (optional):
#   Use separate stages for dependencies and runtime
# ============================================================================
