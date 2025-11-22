# Fabien Agent Dockerfile
# Specialized for marketing, DevOps, and infrastructure

FROM codehornets-base:latest

# Switch to root for package installation
USER root

# Install DevOps and infrastructure tools from apt
RUN apt-get update && apt-get install -y \
    awscli \
    docker-compose \
    prometheus-node-exporter \
    nmap \
    tcpdump \
    gnupg \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl from official source
RUN curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg \
    && echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' > /etc/apt/sources.list.d/kubernetes.list \
    && apt-get update && apt-get install -y kubectl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Terraform from HashiCorp
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" > /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y terraform \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Helm
RUN curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install marketing/analytics Python packages
RUN pip3 install --no-cache-dir --break-system-packages \
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

# Switch back to agent user
USER agent

LABEL ai.codehornets.agent="fabien"
LABEL ai.codehornets.role="marketing_devops"
LABEL ai.codehornets.description="Marketing automation and DevOps"
LABEL ai.codehornets.specialties="marketing,seo,social_media,devops,infrastructure,monitoring"
