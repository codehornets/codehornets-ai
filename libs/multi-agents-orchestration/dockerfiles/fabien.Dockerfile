# Fabien Agent Dockerfile
# Specialized for marketing, DevOps, and infrastructure

FROM codehornets-base:latest

# Install DevOps and infrastructure tools
RUN apt-get update && apt-get install -y \
    # Cloud CLIs
    awscli \
    # Container tools
    docker-compose \
    # Kubernetes
    kubectl \
    # IaC tools
    terraform \
    # Monitoring
    prometheus-node-exporter \
    # Networking
    nmap \
    tcpdump \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install marketing/analytics Python packages
RUN pip3 install --no-cache-dir \
    # SEO/Analytics
    google-api-python-client \
    google-analytics-data \
    # Social media
    tweepy \
    facebook-sdk \
    # Email marketing
    sendgrid \
    mailchimp3 \
    # Data visualization
    matplotlib \
    seaborn \
    plotly \
    # Web scraping
    beautifulsoup4 \
    selenium \
    # Cloud SDKs
    boto3 \
    azure-mgmt \
    google-cloud-storage

# Install DevOps Node packages
RUN npm install -g \
    # Deployment
    pm2 \
    # Monitoring
    @datadog/datadog-ci \
    # Testing
    artillery \
    loadtest \
    # Documentation
    @stoplight/spectral-cli \
    swagger-ui-dist

# Install marketing/social media tools
RUN npm install -g \
    lighthouse \
    pa11y \
    sitemap-generator-cli

# Set environment variables
ENV AGENT_NAME=fabien
ENV AGENT_ROLE=worker

# Set working directory
WORKDIR /home/agent/workspace

LABEL ai.codehornets.agent="fabien"
LABEL ai.codehornets.role="marketing_devops"
LABEL ai.codehornets.description="Marketing automation and DevOps"
LABEL ai.codehornets.specialties="marketing,seo,social_media,devops,infrastructure,monitoring"
