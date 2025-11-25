# Production Quick Start Guide

Fast track to deploying FunnelAgents to production.

## Prerequisites

- Docker 24.0+ installed
- Docker Compose 2.20+ installed
- Domain with DNS configured
- SSL certificates ready
- 8GB+ RAM, 4+ CPU cores

## 5-Minute Setup

### 1. Initialize Project

```bash
cd funnel-agents/infrastructure/docker
make init
```

### 2. Generate Secrets

```bash
make prod-secrets
```

### 3. Configure Environment

```bash
# Edit .env.production with your values
vim .env.production
```

**Critical settings**:
```env
DOMAIN=your-domain.com
POSTGRES_DB=funnel_agents_prod
POSTGRES_USER=funnel_agents_prod
REDIS_PASSWORD=<generated-password>
```

### 4. Add SSL Certificates

```bash
# Option A: Let's Encrypt
certbot certonly --standalone -d your-domain.com
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Option B: Self-signed (testing only)
make ssl-generate
```

### 5. Deploy

```bash
make deploy
```

### 6. Verify

```bash
make health
```

## Common Commands

```bash
# Development
make dev-up              # Start dev environment
make dev-down            # Stop dev environment
make dev-logs            # View logs

# Production
make deploy              # Deploy to production
make prod-logs           # View production logs
make health              # Run health checks
make backup              # Create backup
make rollback            # Rollback deployment

# Maintenance
make stats               # Show resource usage
make clean-logs          # Clean old logs
make clean-backups       # Clean old backups
```

## Access Services

- **Web UI**: https://your-domain.com
- **API**: https://your-domain.com/api
- **Health**: https://your-domain.com/health

## Troubleshooting

### Service won't start
```bash
make prod-logs-service SERVICE=<name>
docker-compose ps
```

### Database issues
```bash
docker exec funnel-agents-postgres pg_isready
cat secrets/database_url.txt
```

### High memory
```bash
make stats
docker-compose restart <service>
```

## Next Steps

1. Configure email settings in `.env.production`
2. Set up automated backups to S3/GCS
3. Configure monitoring and alerts
4. Review security settings
5. Test rollback procedure

## Full Documentation

- `PRODUCTION_DEPLOYMENT.md` - Complete guide
- `PRODUCTION_IMPLEMENTATION_REPORT.md` - Technical details
- `secrets/README.md` - Secrets management
- `Makefile` - All commands (`make help`)

## Support

Run `make help` for all available commands.
