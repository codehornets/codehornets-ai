# FunnelAgents - Production Deployment Guide

Complete guide for deploying FunnelAgents to production with Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedure](#rollback-procedure)

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ / Debian 11+ / RHEL 8+
- **RAM**: Minimum 8GB, Recommended 16GB+
- **CPU**: Minimum 4 cores, Recommended 8+ cores
- **Disk**: Minimum 50GB free space for Docker volumes
- **Network**: Public IP address and domain name

### Software Requirements

```bash
# Docker Engine 24.0+
docker --version

# Docker Compose 2.20+
docker-compose --version

# Git
git --version

# OpenSSL (for generating secrets)
openssl version

# Make (optional but recommended)
make --version
```

### Domain Requirements

- Primary domain: `funnelagents.example.com`
- n8n subdomain: `n8n.funnelagents.example.com`
- Valid SSL/TLS certificates (Let's Encrypt recommended)

## Quick Start

For experienced users, here's the quick deployment path:

```bash
# 1. Clone repository
git clone <repository-url>
cd funnel-agents/infrastructure/docker

# 2. Initialize and configure
make init
make prod-secrets

# 3. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 4. Generate SSL certificates (or add your own)
make ssl-generate

# 5. Deploy
make deploy

# 6. Verify deployment
make health
```

## Initial Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd funnel-agents/infrastructure/docker
```

### Step 2: Initialize Project Structure

```bash
make init
```

This creates:
- `secrets/` directory for sensitive files
- `backups/` directory for database backups
- `nginx/ssl/` directory for SSL certificates
- `.env.production` from example template

### Step 3: Generate Secrets

```bash
make prod-secrets
```

This generates:
- `secrets/postgres_password.txt` - PostgreSQL password
- `secrets/jwt_secret.txt` - JWT signing secret
- `secrets/n8n_encryption_key.txt` - n8n encryption key

Manually create `secrets/database_url.txt`:

```bash
# Get the postgres password
POSTGRES_PASS=$(cat secrets/postgres_password.txt)

# Create database URL
echo "postgresql://funnel_agents_prod:${POSTGRES_PASS}@postgres:5432/funnel_agents_prod" > secrets/database_url.txt
```

### Step 4: Configure Environment

Edit `.env.production`:

```bash
vim .env.production
```

Critical settings to configure:

```env
# Domain configuration
DOMAIN=funnelagents.example.com
N8N_HOST=n8n.funnelagents.example.com

# Database
POSTGRES_DB=funnel_agents_prod
POSTGRES_USER=funnel_agents_prod

# Redis password (generate with: openssl rand -base64 32)
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# Email configuration
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=noreply@funnelagents.example.com
MAIL_PASSWORD=YOUR_SMTP_PASSWORD
MAIL_FROM_ADDRESS=noreply@funnelagents.example.com

# Optional: Cloud storage for backups
AWS_S3_BUCKET=funnelagents-backups
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

### Step 5: SSL/TLS Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d funnelagents.example.com -d n8n.funnelagents.example.com

# Copy to nginx directory
sudo cp /etc/letsencrypt/live/funnelagents.example.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/funnelagents.example.com/privkey.pem nginx/ssl/key.pem
```

#### Option B: Self-Signed (Development/Testing)

```bash
make ssl-generate
```

### Step 6: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Deployment Process

### Option 1: Using Makefile (Recommended)

```bash
# Build images
make prod-build

# Deploy with health checks and backup
make deploy
```

### Option 2: Using Deploy Script

```bash
# Deploy with automatic backup
./scripts/deploy.sh

# Deploy specific version
./scripts/deploy.sh --tag v1.0.0

# Deploy without backup (not recommended)
./scripts/deploy.sh --skip-backup

# Force deploy without prompts
./scripts/deploy.sh --force
```

### Option 3: Manual Docker Compose

```bash
# Build images
docker-compose -f docker-compose.prod.yml --env-file .env.production build

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check status
docker-compose -f docker-compose.prod.yml --env-file .env.production ps
```

## Post-Deployment

### Verify Services

```bash
# Run comprehensive health checks
make health

# Check specific service
make health-service SERVICE=api-gateway

# Continuous monitoring
make health-continuous
```

### View Logs

```bash
# All services
make prod-logs

# Specific service
make prod-logs-service SERVICE=auth-service

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f api-gateway
```

### Check Resource Usage

```bash
# One-time stats
make stats

# Continuous monitoring
make stats-watch
```

### Access Services

- **Web UI**: https://funnelagents.example.com
- **API Gateway**: https://funnelagents.example.com/api
- **n8n**: https://n8n.funnelagents.example.com
- **Health Check**: https://funnelagents.example.com/health

### Initial Admin Setup

1. Access the web UI at your domain
2. Complete the initial setup wizard
3. Create admin account
4. Configure organization settings

## Maintenance

### Regular Backups

```bash
# Manual backup
make backup

# Backup to S3
make backup-s3 S3_BUCKET=funnelagents-backups

# Backup to GCS
make backup-gcs GCS_BUCKET=funnelagents-backups
```

### Automated Backups

The `postgres-backup` service runs daily backups automatically. Configure retention:

```env
# In .env.production
BACKUP_KEEP_DAYS=7
BACKUP_KEEP_WEEKS=4
BACKUP_KEEP_MONTHS=6
```

### Updates and Upgrades

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
make deploy
```

### Scaling Services

```bash
# Scale API Gateway to 3 replicas
make prod-scale SERVICE=api-gateway REPLICAS=3

# Scale n8n workers
make prod-scale SERVICE=n8n-worker REPLICAS=5
```

### Log Management

```bash
# Clean old logs (30+ days)
make clean-logs

# View log size
du -sh ../../storage/logs/
```

### Database Maintenance

```bash
# Access PostgreSQL shell
make db-shell-prod

# Vacuum database
docker exec funnel-agents-postgres psql -U funnel_agents_prod -d funnel_agents_prod -c "VACUUM ANALYZE;"

# Check database size
docker exec funnel-agents-postgres psql -U funnel_agents_prod -d funnel_agents_prod -c "SELECT pg_size_pretty(pg_database_size('funnel_agents_prod'));"
```

### SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days:

```bash
# Renew certificates
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/funnelagents.example.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/funnelagents.example.com/privkey.pem nginx/ssl/key.pem

# Reload nginx
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Troubleshooting

### Service Won't Start

```bash
# Check container status
make prod-ps

# View service logs
make prod-logs-service SERVICE=<service-name>

# Check Docker daemon logs
sudo journalctl -u docker.service -f
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker exec funnel-agents-postgres pg_isready

# Check connection from service
docker exec funnel-agents-api-gateway wget -qO- http://funnel-agents-postgres:5432 || echo "Cannot connect"

# Verify database URL secret
cat secrets/database_url.txt
```

### Memory Issues

```bash
# Check memory usage
free -h
docker stats --no-stream

# Increase service limits in docker-compose.prod.yml
# Under deploy.resources.limits.memory
```

### SSL/Certificate Issues

```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check certificate expiration
openssl x509 -in nginx/ssl/cert.pem -noout -dates

# Test SSL configuration
openssl s_client -connect funnelagents.example.com:443 -servername funnelagents.example.com
```

### High CPU Usage

```bash
# Identify problematic container
docker stats --no-stream | sort -k3 -h

# Check service logs
make prod-logs-service SERVICE=<high-cpu-service>

# Restart service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

## Rollback Procedure

### List Available Backups

```bash
make rollback-list
```

### Rollback to Previous Deployment

```bash
# Interactive rollback
make rollback

# Rollback to specific backup
./scripts/rollback.sh --backup backups/pre_deploy_20250101_120000.sql.gz

# Force rollback without confirmation
./scripts/rollback.sh --force
```

### Manual Rollback

```bash
# 1. Stop services
make prod-down

# 2. Restore database
gunzip -c backups/pre_deploy_20250101_120000.sql.gz | \
  docker exec -i funnel-agents-postgres psql -U funnel_agents_prod -d funnel_agents_prod

# 3. Checkout previous version
git checkout <previous-commit>

# 4. Rebuild and start
make prod-build
make prod-up

# 5. Verify
make health
```

## Best Practices

### Security

1. **Change default passwords** - Never use default credentials
2. **Rotate secrets regularly** - Update secrets every 90 days
3. **Enable firewall** - Only expose necessary ports
4. **Use HTTPS only** - Redirect all HTTP to HTTPS
5. **Regular updates** - Keep Docker and images updated
6. **Monitor logs** - Review logs for suspicious activity

### Performance

1. **Resource limits** - Set appropriate CPU/memory limits
2. **Connection pooling** - Configure database connection pools
3. **Caching** - Enable Redis caching for frequent queries
4. **CDN** - Use CDN for static assets
5. **Load balancing** - Scale services horizontally

### Reliability

1. **Regular backups** - Automated daily backups
2. **Health monitoring** - Continuous health checks
3. **Alerting** - Set up monitoring alerts
4. **Documentation** - Keep deployment docs updated
5. **Testing** - Test in staging before production

## Support

For issues and questions:

- GitHub Issues: <repository-url>/issues
- Documentation: <docs-url>
- Email: support@funnelagents.com

## Appendix

### Environment Variables Reference

See `.env.production.example` for complete list of environment variables.

### Port Reference

| Service | Internal Port | External Port |
|---------|--------------|---------------|
| Nginx | - | 80, 443 |
| API Gateway | 3000 | - |
| Auth Service | 3001 | - |
| CRM Service | 3002 | - |
| Campaigns Service | 3003 | - |
| Content Service | 3004 | - |
| Agents Service | 3005 | - |
| Tasks Service | 3006 | - |
| Automations Service | 3007 | - |
| Reports Service | 3008 | - |
| Worker Runner | 3009 | - |
| Scheduler | 3010 | - |
| PostgreSQL | 5432 | - |
| Redis | 6379 | - |
| n8n | 5678 | - |

### Resource Requirements

| Service | CPU (min) | Memory (min) | CPU (recommended) | Memory (recommended) |
|---------|-----------|--------------|-------------------|----------------------|
| API Gateway | 0.25 | 256MB | 1 | 1GB |
| PostgreSQL | 0.5 | 512MB | 2 | 2GB |
| Redis | 0.25 | 256MB | 1 | 1GB |
| n8n | 0.5 | 512MB | 2 | 2GB |
| Worker Runner | 0.5 | 512MB | 2 | 2GB |
| Other Services | 0.1 | 128MB | 0.5 | 512MB |

### Backup Schedule

- **PostgreSQL**: Daily at 2:00 AM
- **Retention**: 7 days, 4 weeks, 6 months
- **Location**: `/backups` volume
- **Cloud Upload**: Optional (S3/GCS)
