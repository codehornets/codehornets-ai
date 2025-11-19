# n8n Workflow Automation - Infrastructure Summary

## Files Created

### Docker Configuration
- **docker-compose.workflow.yml** - Complete n8n service definition with MySQL and Redis
- **infrastructure/docker/n8n/Dockerfile** - Custom n8n image with security hardening
- **infrastructure/docker/n8n/custom-hooks.js** - Laravel integration hooks
- **infrastructure/docker/n8n/health-check.sh** - Container health check script

### Reverse Proxy
- **infrastructure/docker/nginx/workflow.conf** - nginx configuration with SSL, WebSocket support, and security headers

### systemd Service (Production)
- **infrastructure/systemd/n8n-painterflow.service** - systemd service unit for auto-start
- **infrastructure/systemd/n8n-logrotate** - Log rotation configuration

### Scripts
- **infrastructure/docker/scripts/start-workflow.sh** - Service startup with validation
- **infrastructure/docker/scripts/stop-workflow.sh** - Graceful shutdown with backup
- **infrastructure/docker/scripts/health-check-workflow.sh** - Comprehensive health monitoring
- **infrastructure/docker/scripts/backup-workflow.sh** - Automated backup creation
- **infrastructure/docker/scripts/deploy-workflow.sh** - Production deployment automation

### Configuration
- **.env.workflow** - Complete environment configuration template
- **Makefile** - Added workflow management commands (workflow-*)

### Documentation
- **WORKFLOW_DEPLOYMENT.md** - Complete deployment guide (8000+ words)
- **WORKFLOW_QUICKSTART.md** - Quick start guide
- **infrastructure/docker/n8n/README.md** - This file

## Quick Start

### Development
```bash
cp .env.workflow .env.workflow.local
make workflow-up
open http://localhost:5678
```

### Production
```bash
sudo make workflow-production-deploy
```

## Features

### Development
- Docker Compose orchestration
- Hot-reload support
- Shared MySQL database with Laravel
- Redis for queue management
- Automated health checks
- Volume persistence

### Production
- systemd service management
- Auto-start on boot
- Auto-restart on failure
- nginx reverse proxy with SSL
- Security headers and rate limiting
- Resource limits (CPU, memory)
- Automated backups
- Log rotation
- Monitoring and alerting

### Security
- SSL/TLS support
- JWT authentication
- Encrypted credentials storage
- Security headers (HSTS, CSP, etc.)
- Firewall-friendly (only 80/443 exposed)
- Non-root container execution
- Read-only root filesystem
- Capability restrictions

### High Availability
- Queue mode with multiple workers
- Horizontal scaling support
- Health check endpoints
- Graceful shutdown
- Automatic recovery
- Load balancing

### Monitoring
- Comprehensive health checks
- Container metrics
- Application logs
- systemd journal integration
- Prometheus metrics (optional)
- Grafana dashboards (optional)

### Backup & Recovery
- Automated backups
- Backup verification
- Easy restore process
- Retention policies
- Remote storage support
- Disaster recovery procedures

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Production Stack                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  nginx (SSL/TLS) → n8n (Docker)                         │
│                      ├── MySQL (shared with Laravel)     │
│                      └── Redis (queue management)        │
│                                                           │
│  systemd → docker-compose → containers                   │
│                                                           │
│  Volumes:                                                │
│  - n8n-data (workflows, credentials)                     │
│  - n8n-files (uploads, exports)                          │
│  - mysql-data (database)                                 │
│  - redis-data (cache)                                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Makefile Commands

```bash
# Service Management
make workflow-up              # Start services
make workflow-down            # Stop services
make workflow-restart         # Restart services
make workflow-logs            # View logs
make workflow-status          # Check status
make workflow-shell           # Access shell

# Health & Monitoring
make workflow-health          # Run health check

# Database
make workflow-db-create       # Create database
make workflow-db-drop         # Drop database

# Backup & Recovery
make workflow-backup          # Create backup
make workflow-restore         # Restore backup
make workflow-clean           # Clean all data

# Production
make workflow-production-deploy    # Deploy to production
make workflow-production-status    # Check status
make workflow-production-logs      # View logs
make workflow-production-restart   # Restart service
```

## Environment Variables

### Critical (Must Configure)
- `N8N_ENCRYPTION_KEY` - Generate with: `openssl rand -hex 32`
- `DB_PASSWORD` - Database password
- `N8N_HOST` - Your domain name
- `N8N_PROTOCOL` - http or https

### Important (Recommended)
- `N8N_EXECUTIONS_MODE` - 'queue' for production
- `N8N_JWT_AUTH_ACTIVE` - true for Laravel integration
- `REDIS_PASSWORD` - Redis password
- `N8N_LOG_LEVEL` - info, warn, error

See `.env.workflow` for complete configuration options.

## Access URLs

### Development
- n8n UI: http://localhost:5678
- Webhooks: http://localhost/workflow/webhook/*
- Health: http://localhost:5678/healthz

### Production
- n8n UI: https://your-domain.com/workflow/
- Webhooks: https://your-domain.com/workflow/webhook/*
- Health: https://your-domain.com/workflow/healthz

## Integration with Laravel

### Custom Hooks
The `custom-hooks.js` file integrates n8n with Laravel:
- Workflow execution events → Laravel API
- Credential changes → Audit log
- Workflow activation/deactivation → Notifications

### Required Laravel Endpoints
```php
POST /api/n8n/webhooks/execution-start
POST /api/n8n/webhooks/execution-complete
POST /api/n8n/webhooks/audit
```

### Authentication
- JWT authentication for API calls
- Webhook authentication with shared secret
- CORS headers configured

## Security Best Practices

1. **Generate Unique Keys**
   ```bash
   openssl rand -hex 32
   ```

2. **Enable HTTPS**
   - Use Let's Encrypt for SSL
   - Configure HSTS headers
   - Enable HTTP → HTTPS redirect

3. **Firewall Configuration**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw deny 5678/tcp
   ```

4. **Regular Updates**
   ```bash
   docker-compose pull
   make workflow-restart
   ```

5. **Monitoring**
   - Set up health check alerts
   - Monitor logs for errors
   - Track resource usage

## Troubleshooting

### Service Won't Start
```bash
make workflow-logs
sudo systemctl status n8n-painterflow
docker-compose logs
```

### Database Connection Failed
```bash
make workflow-db-create
docker-compose exec mysql mysqladmin ping
```

### High Memory Usage
- Check container stats: `docker stats`
- Adjust resource limits in docker-compose.yml
- Enable queue mode for production

### SSL Issues
```bash
sudo certbot renew
sudo nginx -t
```

## Performance Optimization

### Development
- Use `regular` execution mode
- Single worker process
- Local database

### Production
- Use `queue` execution mode
- Multiple worker processes
- Database connection pooling
- Redis for queue management
- Resource limits configured

## Backup Strategy

### Automated Backups
- Daily backups at 2 AM
- Retention: 30 days
- Stored locally and remotely
- Automatic cleanup

### Manual Backups
```bash
make workflow-backup
```

### Recovery
```bash
make workflow-restore backup=/path/to/backup.tar.gz
```

## Monitoring Checklist

- [ ] Health endpoint responding
- [ ] Containers running
- [ ] Database connectivity
- [ ] Redis connectivity
- [ ] Disk space available
- [ ] Memory usage normal
- [ ] No errors in logs
- [ ] Webhooks functioning
- [ ] SSL certificate valid

## Production Checklist

- [ ] Unique N8N_ENCRYPTION_KEY generated
- [ ] Strong passwords set
- [ ] HTTPS enabled with valid certificate
- [ ] Firewall configured
- [ ] systemd service enabled
- [ ] Automated backups scheduled
- [ ] Monitoring configured
- [ ] Log rotation enabled
- [ ] Security headers configured
- [ ] Disaster recovery tested

## Support

- **Full Documentation**: WORKFLOW_DEPLOYMENT.md
- **Quick Start**: WORKFLOW_QUICKSTART.md
- **n8n Docs**: https://docs.n8n.io
- **Issue Tracker**: Project repository

## License

Part of PainterFlow CRM. See main LICENSE file.

---

**Infrastructure created on 2025-11-01**
**Version: 1.0.0**
