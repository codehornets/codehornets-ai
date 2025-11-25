# Production Deployment Checklist

Use this checklist to ensure all steps are completed before and after production deployment.

## Pre-Deployment Checklist

### Infrastructure Setup
- [ ] Server meets minimum requirements (16GB RAM, 4 CPU cores, 50GB disk)
- [ ] Docker 24.0+ installed and running
- [ ] Docker Compose 2.20+ installed
- [ ] Git installed
- [ ] OpenSSL installed
- [ ] Make installed (optional but recommended)

### Project Setup
- [ ] Repository cloned to server
- [ ] Navigate to `infrastructure/docker` directory
- [ ] Run `make init` to create directory structure
- [ ] Verify structure with `./validate-production-setup.sh`

### Secrets Generation
- [ ] Run `make prod-secrets` to generate random secrets
- [ ] Verify secrets created in `secrets/` directory:
  - [ ] postgres_password.txt
  - [ ] jwt_secret.txt
  - [ ] n8n_encryption_key.txt
- [ ] Create `secrets/database_url.txt` manually with correct password
- [ ] Set proper permissions: `chmod 600 secrets/*.txt`
- [ ] Create encrypted backup of secrets and store securely

### Environment Configuration
- [ ] Copy `.env.production.example` to `.env.production`
- [ ] Update domain configuration:
  - [ ] DOMAIN=your-domain.com
  - [ ] N8N_HOST=n8n.your-domain.com
- [ ] Update database configuration:
  - [ ] POSTGRES_DB (production database name)
  - [ ] POSTGRES_USER (production username)
- [ ] Generate and set REDIS_PASSWORD (use `openssl rand -base64 32`)
- [ ] Configure email settings:
  - [ ] MAIL_HOST
  - [ ] MAIL_PORT
  - [ ] MAIL_USERNAME
  - [ ] MAIL_PASSWORD
  - [ ] MAIL_FROM_ADDRESS
- [ ] Configure JWT settings:
  - [ ] JWT_EXPIRATION (default: 1d)
- [ ] Optional: Configure cloud storage for backups:
  - [ ] AWS_S3_BUCKET / GCS_BUCKET
  - [ ] AWS credentials / GCS credentials
- [ ] Review and update all other settings as needed

### SSL/TLS Certificates
- [ ] Option A: Let's Encrypt (production)
  - [ ] Install certbot
  - [ ] Generate certificates for domain
  - [ ] Copy certificates to `nginx/ssl/`
  - [ ] Set up auto-renewal cron job
- [ ] Option B: Custom certificates
  - [ ] Obtain certificates from provider
  - [ ] Copy cert.pem and key.pem to `nginx/ssl/`
- [ ] Option C: Self-signed (testing only)
  - [ ] Run `make ssl-generate`
- [ ] Verify certificates: `make ssl-info`

### Network Configuration
- [ ] DNS records configured:
  - [ ] A record for main domain → server IP
  - [ ] A record for n8n subdomain → server IP
- [ ] DNS propagation complete (check with `nslookup`)
- [ ] Firewall configured:
  - [ ] Port 22 (SSH) open
  - [ ] Port 80 (HTTP) open
  - [ ] Port 443 (HTTPS) open
  - [ ] All other ports blocked
- [ ] Enable firewall: `sudo ufw enable`

### Code Review
- [ ] Latest code pulled from repository
- [ ] Review `.env.production` for sensitive data
- [ ] Review `docker-compose.prod.yml` resource limits
- [ ] Review nginx configuration for rate limits
- [ ] Verify no secrets in git repository

### Testing
- [ ] Run validation: `./validate-production-setup.sh`
- [ ] All checks pass or warnings addressed
- [ ] Build test: `make prod-build` (if errors, fix before deploying)
- [ ] Review build logs for warnings

## Deployment Checklist

### Initial Deployment
- [ ] Run `make deploy`
- [ ] Monitor deployment output for errors
- [ ] Deployment completes successfully
- [ ] Pre-deployment backup created automatically

### Health Verification
- [ ] Run `make health` to check all services
- [ ] All services show "healthy" status
- [ ] No errors in health check output
- [ ] Run `make stats` to check resource usage
- [ ] Resource usage within expected limits

### Service Testing
- [ ] Test main domain: `curl -k https://your-domain.com/health`
- [ ] Returns 200 OK
- [ ] Test API: `curl -k https://your-domain.com/api/health`
- [ ] Returns valid response
- [ ] Test web UI: Open https://your-domain.com in browser
- [ ] Web UI loads correctly
- [ ] Test n8n: Open https://n8n.your-domain.com
- [ ] n8n dashboard accessible
- [ ] SSL certificate valid (no browser warnings)

### Database Verification
- [ ] Access database: `make db-shell-prod`
- [ ] Check tables exist: `\dt`
- [ ] Check connections: `SELECT count(*) FROM pg_stat_activity;`
- [ ] Verify migrations ran successfully
- [ ] Exit database shell

### Application Testing
- [ ] Create test user account
- [ ] Test login functionality
- [ ] Test logout functionality
- [ ] Test basic CRUD operations
- [ ] Test API authentication
- [ ] Test webhook endpoints (if applicable)
- [ ] Test file upload (if applicable)

### Monitoring Setup
- [ ] Configure continuous health monitoring: `make health-continuous` (in tmux/screen)
- [ ] Set up log monitoring
- [ ] Configure external monitoring (optional):
  - [ ] Uptime monitoring (e.g., UptimeRobot)
  - [ ] APM (e.g., New Relic, DataDog)
  - [ ] Error tracking (e.g., Sentry)
- [ ] Set up alerting for critical issues

## Post-Deployment Checklist

### Documentation
- [ ] Update deployment documentation with any changes
- [ ] Document any custom configurations
- [ ] Update team wiki/docs with access information
- [ ] Create runbook for common operations

### Backup Verification
- [ ] Wait for first automated backup (runs at 2 AM)
- [ ] Or run manual backup: `make backup`
- [ ] Verify backup file created in `backups/` directory
- [ ] Check backup file size (should not be zero)
- [ ] Test backup verification: `gzip -t backups/<latest>.sql.gz`
- [ ] Optional: Test backup restore in separate environment
- [ ] If using cloud storage, verify upload successful

### Security Hardening
- [ ] Change default SSH port (optional but recommended)
- [ ] Set up fail2ban for SSH protection
- [ ] Review nginx security headers
- [ ] Enable HSTS (already in config)
- [ ] Set up rate limiting alerts
- [ ] Review and lock down file permissions
- [ ] Disable root SSH login
- [ ] Set up SSH key authentication only

### Performance Tuning
- [ ] Monitor resource usage over 24 hours
- [ ] Adjust service replicas if needed: `make prod-scale`
- [ ] Adjust resource limits in docker-compose.prod.yml if needed
- [ ] Restart services after changes: `make prod-restart`
- [ ] Monitor response times
- [ ] Set up performance baselines

### Team Training
- [ ] Share documentation with team
- [ ] Train team on deployment commands
- [ ] Train team on rollback procedures
- [ ] Train team on backup/restore procedures
- [ ] Share monitoring dashboard access
- [ ] Document on-call procedures

### Final Verification
- [ ] All checklist items above completed
- [ ] System stable for 24 hours
- [ ] No critical errors in logs
- [ ] Backups running successfully
- [ ] Monitoring active
- [ ] Team trained and ready

## Ongoing Maintenance Checklist

### Daily
- [ ] Check health status: `make health`
- [ ] Review error logs: `make prod-logs | grep ERROR`
- [ ] Monitor disk space: `df -h`
- [ ] Verify latest backup: `ls -lh backups/ | tail -1`

### Weekly
- [ ] Review full logs: `make prod-logs`
- [ ] Check resource usage: `make stats`
- [ ] Review security logs
- [ ] Check for Docker updates
- [ ] Test backup restore (in separate environment)

### Monthly
- [ ] Update Docker and Docker Compose
- [ ] Update base images: `docker pull` for all base images
- [ ] Rotate secrets (every 90 days recommended)
- [ ] Review and update documentation
- [ ] Security scan: `make ci-scan` (if Trivy installed)
- [ ] Clean old logs: `make clean-logs`
- [ ] Clean old backups: `make clean-backups`
- [ ] Review access logs for anomalies

### Quarterly
- [ ] Renew SSL certificates (Let's Encrypt auto-renews)
- [ ] Major dependency updates
- [ ] Full disaster recovery test
- [ ] Security audit
- [ ] Performance review and optimization
- [ ] Capacity planning review

## Rollback Checklist

If deployment fails or issues discovered:

### Immediate Actions
- [ ] Stop accepting new changes
- [ ] Assess severity of issue
- [ ] Decide: fix forward or rollback?

### If Rolling Back
- [ ] List available backups: `make rollback-list`
- [ ] Choose appropriate backup
- [ ] Notify team of rollback
- [ ] Execute rollback: `make rollback`
- [ ] Verify services after rollback: `make health`
- [ ] Test application functionality
- [ ] Monitor for stability
- [ ] Document what went wrong
- [ ] Plan fix for next deployment

### Post-Rollback
- [ ] Review deployment logs
- [ ] Identify root cause
- [ ] Fix issues in development
- [ ] Test fix thoroughly
- [ ] Update deployment documentation
- [ ] Schedule re-deployment when ready

## Emergency Procedures

### Complete System Failure
1. Check Docker daemon: `sudo systemctl status docker`
2. Restart Docker: `sudo systemctl restart docker`
3. Restart all services: `make prod-up`
4. Run health checks: `make health`
5. If still failing, restore from backup: `make rollback`

### Database Corruption
1. Stop all services: `make prod-down`
2. Restore from latest backup: `./scripts/rollback.sh`
3. Start services: `make prod-up`
4. Verify: `make health`

### Security Breach Suspected
1. Immediately isolate system (block network if needed)
2. Change all secrets: `make prod-secrets` and update
3. Review all logs: `make prod-logs | grep suspicious-pattern`
4. Restore from known-good backup if compromised
5. Contact security team
6. Document incident

## Success Criteria

Deployment is considered successful when:
- [ ] All 18 services are running and healthy
- [ ] Health checks pass for 24 hours continuously
- [ ] No critical errors in logs
- [ ] Application is accessible via domain
- [ ] SSL/TLS working correctly
- [ ] Authentication working
- [ ] Database connections stable
- [ ] Backups running successfully
- [ ] Resource usage within normal ranges
- [ ] Team can access and monitor system

## Sign-Off

- [ ] Deployment completed by: _________________ Date: _________
- [ ] Verified by: _________________ Date: _________
- [ ] Production ready for users: Yes / No

---

**Note**: Keep this checklist updated as your deployment process evolves. Review and improve after each deployment.
