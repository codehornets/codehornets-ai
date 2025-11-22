# Custom Docker Images for CodeHornets AI

Each agent has its own Dockerfile with specialized packages and tools.

## Quick Start

```bash
# Build all images
bash build-images.sh

# Build specific agent
bash build-images.sh --agent anga

# Build without cache
bash build-images.sh --no-cache

# Start with custom images
docker-compose -f docker-compose.custom.yml up -d
```

## Image Structure

```
codehornets-base:latest           (Base image with common tools)
  ├── codehornets-orchestrator:latest
  ├── codehornets-anga:latest
  ├── codehornets-marie:latest
  └── codehornets-fabien:latest
```

## Agent Images

### Base Image (`dockerfiles/base.Dockerfile`)
**Common tools for all agents:**
- Docker CLI
- Git, vim, nano
- Python 3 + pip
- Node.js + npm
- expect, tmux
- Common packages: requests, redis, pm2

### Orchestrator (`dockerfiles/orchestrator.Dockerfile`)
**Coordination & monitoring tools:**
- Process management (supervisor)
- Database clients (postgres, mysql, redis)
- Python: schedule, celery, docker
- Node: commander, chalk, ora

### Anga (`dockerfiles/anga.Dockerfile`)
**Coding & backend development:**
- Multiple Python versions (3.10, 3.11)
- Frameworks: FastAPI, Flask, Django
- Testing: pytest, jest, eslint
- Languages: Go, Rust
- Databases: PostgreSQL, MongoDB, Redis

### Marie (`dockerfiles/marie.Dockerfile`)
**Documentation & student management:**
- Document tools: pandoc, LibreOffice
- Image/video: ImageMagick, ffmpeg
- Python: pandas, matplotlib, python-docx
- Playwright for web automation

### Fabien (`dockerfiles/fabien.Dockerfile`)
**Marketing & DevOps:**
- Cloud: AWS CLI, kubectl, terraform, helm
- Monitoring: prometheus
- Python: boto3, google-analytics, tweepy
- Node: lighthouse, loadtest, artillery

## Adding Packages

### To a specific agent:

```dockerfile
# Edit dockerfiles/<agent>.Dockerfile

# Add apt packages
RUN apt-get update && apt-get install -y \
    your-package \
    && apt-get clean

# Add Python packages
RUN pip3 install --no-cache-dir \
    your-python-package

# Add Node packages
RUN npm install -g your-node-package
```

### To all agents:

Edit `dockerfiles/base.Dockerfile`

## Rebuild After Changes

```bash
# Rebuild specific agent
bash build-images.sh --agent anga --no-cache

# Rebuild all
bash build-images.sh --no-cache

# Restart containers
docker-compose -f docker-compose.custom.yml down
docker-compose -f docker-compose.custom.yml up -d
```

## Image Sizes

Approximate sizes:
- Base: ~2GB
- Orchestrator: ~2.5GB
- Anga: ~4GB (includes Go, Rust)
- Marie: ~3GB (includes LibreOffice, ffmpeg)
- Fabien: ~3.5GB (includes cloud tools)
