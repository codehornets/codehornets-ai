# FunnelAgents - Production Docker Infrastructure

Complete production-ready Docker configuration for deploying FunnelAgents with zero-downtime, automated backups, health monitoring, and security best practices.

## What's Included

This production infrastructure provides:

- **18 Services**: Nginx, PostgreSQL, Redis, 11 microservices, n8n, and automated backups
- **Zero-Downtime Deployments**: Rolling updates with health checks
- **Automated Backups**: Daily PostgreSQL backups with retention policies
- **Health Monitoring**: Comprehensive checks for all services
- **Security**: Secrets management, SSL/TLS, rate limiting, non-root containers
- **Scalability**: Horizontal scaling support for all services
- **70+ Commands**: Makefile with commands for all operations
- **4 Automation Scripts**: Deploy, rollback, health-check, backup
- **Complete Documentation**: 2500+ lines of guides and references

## Quick Links

- **[Quick Start Guide](PRODUCTION_QUICK_START.md)** - Get started in 5 minutes
- **[Deployment Guide](PRODUCTION_DEPLOYMENT.md)** - Complete deployment instructions
- **[Implementation Report](PRODUCTION_IMPLEMENTATION_REPORT.md)** - Technical details
- **[Files Summary](PRODUCTION_FILES_SUMMARY.md)** - Complete file inventory

## File Structure

```
infrastructure/docker/
├── docker-compose.prod.yml          # Production orchestration (18 services)
├── Dockerfile.prod                  # Optimized NestJS build
├── Dockerfile.web-prod              # Production web UI
├── .env.production.example          # Environment template
├── Makefile                         # 70+ management commands
├── nginx/
│   ├── nginx.conf                   # Main nginx config
│   ├── conf.d/default.conf          # Server blocks with SSL
│   ├── web-ui.conf                  # Static serving config
│   └── ssl/                         # SSL certificates (user adds)
├── secrets/
│   ├── README.md                    # Secrets guide
│   ├── .gitignore                   # Security gitignore
│   └── *.txt                        # Secret files (user creates)
├── backups/                         # Auto-created for backups
├── PRODUCTION_DEPLOYMENT.md         # Complete guide
├── PRODUCTION_IMPLEMENTATION_REPORT.md  # Technical details
├── PRODUCTION_QUICK_START.md        # Fast setup
├── PRODUCTION_FILES_SUMMARY.md      # File inventory
├── validate-production-setup.sh     # Setup validator
└── README_PRODUCTION.md             # This file

infrastructure/scripts/
├── deploy.sh                        # Zero-downtime deployment
├── rollback.sh                      # Safe rollback
├── health-check.sh                  # Health monitoring
└── backup.sh                        # Database backups
```

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+, Debian 11+, or RHEL 8+
- **RAM**: 16GB minimum, 32GB recommended
- **CPU**: 4 cores minimum, 8+ cores recommended
- **Disk**: 50GB free space minimum

### Software Requirements
- Docker 24.0+
- Docker Compose 2.20+
- Git
- OpenSSL (for secrets generation)
- Make (optional but recommended)

### Network Requirements
- Public IP address
- Domain name with DNS configured
- SSL/TLS certificates (Let's Encrypt recommended)

## Quick Start

```bash
# 1. Navigate to docker directory
cd funnel-agents/infrastructure/docker

# 2. Initialize project structure
make init

# 3. Generate secrets
make prod-secrets

# 4. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your settings

# 5. Add SSL certificates (or generate for testing)
make ssl-generate

# 6. Validate setup
./validate-production-setup.sh

# 7. Deploy
make deploy

# 8. Verify deployment
make health
```

## Core Commands

### Development
```bash
make dev-up              # Start development environment
make dev-down            # Stop development
make dev-logs            # View logs
make dev-shell SERVICE=api-gateway  # Shell access
```

### Production Deployment
```bash
make prod-check          # Check prerequisites
make prod-build          # Build images
make deploy              # Deploy with zero-downtime
make health              # Check all services
make rollback            # Rollback if needed
```

### Monitoring
```bash
make health              # One-time health check
make health-continuous   # Continuous monitoring
make stats               # Resource usage
make prod-logs           # View all logs
make prod-logs-service SERVICE=auth-service  # Specific service
```

### Database Operations
```bash
make backup              # Create backup
make backup-s3 S3_BUCKET=my-bucket  # Backup to S3
make restore             # Restore from backup
make db-shell-prod       # PostgreSQL shell
```

### Maintenance
```bash
make clean-logs          # Remove old logs
make clean-backups       # Remove old backups
make prod-scale SERVICE=api-gateway REPLICAS=3  # Scale service
```

## Architecture

### Services Overview

| Service | Purpose | Port | Replicas | Resources |
|---------|---------|------|----------|-----------|
| nginx | Reverse proxy, SSL, load balancing | 80, 443 | 1 | 0.5 CPU, 256MB |
| postgres | Primary database | 5432 | 1 | 2 CPU, 2GB |
| redis | Cache and queue | 6379 | 1 | 1 CPU, 1GB |
| api-gateway | Main API entry | 3000 | 2 | 1 CPU, 1GB |
| auth-service | Authentication | 3001 | 1 | 0.5 CPU, 512MB |
| crm-service | CRM operations | 3002 | 1 | 1 CPU, 1GB |
| campaigns-service | Campaign mgmt | 3003 | 1 | 1 CPU, 1GB |
| content-service | Content mgmt | 3004 | 1 | 1 CPU, 1GB |
| agents-service | AI agents | 3005 | 1 | 1 CPU, 1GB |
| tasks-service | Task mgmt | 3006 | 1 | 1 CPU, 1GB |
| automations-service | Workflow automation | 3007 | 1 | 1 CPU, 1GB |
| reports-service | Analytics | 3008 | 1 | 1 CPU, 1GB |
| worker-runner | Background jobs | 3009 | 1 | 2 CPU, 2GB |
| scheduler | Scheduled tasks | 3010 | 1 | 0.5 CPU, 512MB |
| web-ui | React frontend | 80 | 1 | 0.5 CPU, 256MB |
| n8n | Workflow engine | 5678 | 1 | 2 CPU, 2GB |
| n8n-worker | Workflow execution | - | 3 | 1 CPU, 1GB |
| postgres-backup | Automated backups | - | 1 | Minimal |

### Network Architecture

```
Internet
   ↓
nginx (SSL termination, rate limiting)
   ↓
   ├─→ web-ui (static files)
   ├─→ api-gateway → microservices
   ├─→ auth-service (strict rate limit)
   └─→ n8n (workflow automation)
         ↓
   Internal Network
   ├─→ postgres (database)
   ├─→ redis (cache/queue)
   └─→ microservices (internal communication)
```

## Security Features

### Container Security
- Non-root users (UID 1001)
- Minimal Alpine base images
- No privileged containers
- Read-only filesystem support
- Security scanning ready (Trivy)

### Network Security
- Internal-only service network
- Only nginx exposed publicly
- Rate limiting (10-100 req/s)
- Connection limiting (10/IP)
- SSL/TLS 1.2+ only

### Secrets Management
- Docker secrets (not env vars)
- File-based secrets
- .gitignore protection
- Rotation procedures
- Backup encryption

### Application Security
- HSTS headers
- Content Security Policy
- CORS configuration
- JWT validation
- SQL injection prevention

## Performance

### Optimizations
- Multi-stage Docker builds (70% smaller images)
- Layer caching for fast rebuilds
- Gzip compression (level 6)
- Proxy caching (1GB zone)
- Connection pooling (32 keepalive connections)
- Database connection pools (max: 50)

### Resource Limits
Every service has:
- CPU limits and reservations
- Memory limits and reservations
- Automatic restarts on failure

### Expected Performance
- **Startup**: 60-90 seconds (cold start)
- **Response Times**: <100ms (P95)
- **Throughput**: 100+ req/s per service
- **Image Size**: 150-200MB per service (vs 800MB+ unoptimized)

## Backup & Recovery

### Automated Backups
- Daily PostgreSQL dumps (2 AM)
- Redis RDB snapshots
- n8n workflow data
- Retention: 7 days, 4 weeks, 6 months
- Optional cloud upload (S3/GCS)

### Manual Backups
```bash
make backup                          # Local backup
make backup-s3 S3_BUCKET=my-bucket  # Upload to S3
make backup-gcs GCS_BUCKET=my-bucket  # Upload to GCS
```

### Rollback Procedures
```bash
make rollback-list       # List available backups
make rollback            # Interactive rollback
./scripts/rollback.sh --backup path/to/backup.sql.gz  # Specific backup
```

## Monitoring

### Health Checks
```bash
make health                # Check all services
make health-continuous     # Monitor continuously (60s interval)
make health-service SERVICE=api-gateway  # Check specific service
```

### Resource Monitoring
```bash
make stats                 # One-time snapshot
make stats-watch          # Real-time monitoring
```

### Log Management
```bash
make prod-logs                    # All logs
make prod-logs-service SERVICE=auth-service  # Specific service
docker-compose -f docker-compose.prod.yml logs -f --tail=100 api-gateway
```

## Scaling

### Horizontal Scaling
```bash
# Scale API Gateway to 3 replicas
make prod-scale SERVICE=api-gateway REPLICAS=3

# Scale n8n workers to 5
make prod-scale SERVICE=n8n-worker REPLICAS=5

# Scale via docker-compose
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=3
```

### Vertical Scaling
Edit resource limits in `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: "2"
      memory: 2G
```

## Troubleshooting

### Common Issues

**Services won't start**:
```bash
make prod-ps                # Check status
make prod-logs-service SERVICE=<name>  # Check logs
docker-compose ps           # Detailed status
```

**Database connection issues**:
```bash
docker exec funnel-agents-postgres pg_isready
cat secrets/database_url.txt
make db-shell-prod
```

**High memory usage**:
```bash
make stats                  # Identify culprit
docker-compose restart <service>  # Restart service
# Edit resource limits in docker-compose.prod.yml
```

**SSL certificate issues**:
```bash
openssl x509 -in nginx/ssl/cert.pem -text -noout  # Verify cert
openssl x509 -in nginx/ssl/cert.pem -noout -dates  # Check expiration
make ssl-info               # Show cert info
```

### Debug Mode

Enable debug logging:
```bash
# Edit .env.production
LOG_LEVEL=debug

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## Maintenance Schedule

### Daily
- [ ] Check health status: `make health`
- [ ] Review error logs: `make prod-logs | grep ERROR`
- [ ] Monitor disk space: `df -h`
- [ ] Verify backups: `ls -lh backups/`

### Weekly
- [ ] Review resource usage: `make stats`
- [ ] Check for updates: `git pull`
- [ ] Test backup restore
- [ ] Review access logs

### Monthly
- [ ] Rotate secrets
- [ ] Update base images
- [ ] Security scan
- [ ] Clean old logs: `make clean-logs`
- [ ] Clean old backups: `make clean-backups`

### Quarterly
- [ ] SSL certificate renewal
- [ ] Major dependency updates
- [ ] Disaster recovery test
- [ ] Security audit

## Documentation

### Quick References
- `make help` - All available commands
- `./scripts/deploy.sh --help` - Deployment options
- `./scripts/health-check.sh --help` - Health check options
- `./scripts/rollback.sh --list` - List backups

### Full Guides
1. **PRODUCTION_QUICK_START.md** - 5-minute setup guide
2. **PRODUCTION_DEPLOYMENT.md** - Complete deployment guide (700+ lines)
3. **PRODUCTION_IMPLEMENTATION_REPORT.md** - Technical details (1000+ lines)
4. **PRODUCTION_FILES_SUMMARY.md** - File inventory and reference

## Support

### Getting Help
1. Check documentation in this directory
2. Run validation: `./validate-production-setup.sh`
3. Check logs: `make prod-logs-service SERVICE=<name>`
4. Run health checks: `make health`

### Reporting Issues
Include:
- Output of `make version`
- Output of `make health`
- Relevant logs from `make prod-logs`
- Steps to reproduce

## Next Steps

1. **Read Quick Start**: See [PRODUCTION_QUICK_START.md](PRODUCTION_QUICK_START.md)
2. **Setup Environment**: Run `make init && make prod-secrets`
3. **Configure**: Edit `.env.production` with your settings
4. **Deploy**: Run `make deploy`
5. **Monitor**: Run `make health-continuous`

## License

See project root for license information.

## Contributing

Improvements to the production infrastructure are welcome. Please test thoroughly before submitting changes.

---

**Production infrastructure by FunnelAgents Team**
- 5,600+ lines of code
- 18 services orchestrated
- 70+ management commands
- Zero-downtime deployments
- Enterprise-grade security
