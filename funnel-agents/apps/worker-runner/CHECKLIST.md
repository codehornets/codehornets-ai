# Worker Runner - Deployment Checklist

Use this checklist to ensure successful deployment of the Worker Runner service.

## Pre-Deployment

### Code Review
- [ ] All TypeScript files compile without errors
- [ ] No ESLint warnings or errors
- [ ] All tests passing
- [ ] Code follows project conventions
- [ ] No hardcoded credentials or secrets
- [ ] All TODO comments addressed or tracked

### Configuration
- [ ] `.env` file created from `.env.example`
- [ ] All required environment variables set
- [ ] Redis connection details configured
- [ ] Microservice endpoints configured
- [ ] Agent API URL configured
- [ ] Ports do not conflict with other services
- [ ] Queue retry settings reviewed and adjusted if needed

### Dependencies
- [ ] Redis 6+ installed and accessible
- [ ] tasks-service deployed and accessible
- [ ] agents-service deployed and accessible
- [ ] automations-service deployed and accessible
- [ ] Python Agent API (FastAPI) deployed at AGENT_API_URL
- [ ] Database migrations completed (if any)
- [ ] Node.js 18+ installed

## Development Environment

### Local Setup
- [ ] `npm install` completed successfully
- [ ] Redis running on localhost:6379
- [ ] All dependent services running
- [ ] Health check endpoint responds: `curl http://localhost:3109/health`
- [ ] Can queue and process test jobs
- [ ] Logs show no errors
- [ ] BullBoard UI accessible (if installed)

### Testing
- [ ] Unit tests passing: `npm run test worker-runner`
- [ ] Integration tests passing: `npm run test:e2e worker-runner`
- [ ] Manual testing completed:
  - [ ] Task execution job processed successfully
  - [ ] Agent invocation job processed successfully
  - [ ] Workflow job processed successfully
  - [ ] Failed jobs retry correctly
  - [ ] Health checks respond correctly
  - [ ] Metrics accurate

## Staging Deployment

### Infrastructure
- [ ] Kubernetes/Docker environment ready
- [ ] Redis cluster/instance provisioned
- [ ] Network policies configured
- [ ] Load balancer configured (if using multiple instances)
- [ ] Persistent storage for logs (optional)

### Docker Build
- [ ] Dockerfile builds successfully
- [ ] Image tagged correctly
- [ ] Image pushed to registry
- [ ] Image scanned for vulnerabilities
- [ ] Image size optimized (<500MB recommended)

### Configuration Management
- [ ] ConfigMap created with non-sensitive config
- [ ] Secret created with sensitive config (Redis password, API keys)
- [ ] Environment variables injected correctly
- [ ] Config validated in staging environment

### Service Deployment
- [ ] Deployment manifest applied
- [ ] Pods running successfully
- [ ] No CrashLoopBackOff or ImagePullBackOff errors
- [ ] Liveness probe working
- [ ] Readiness probe working
- [ ] Service endpoints accessible
- [ ] Logs accessible via kubectl/docker logs

### Smoke Testing
- [ ] Health endpoint accessible: `curl http://staging-worker:3109/health`
- [ ] Queue metrics endpoint working: `/health/queues`
- [ ] Can queue test job from staging tasks-service
- [ ] Test job processes successfully
- [ ] Failed job retries correctly
- [ ] Logs show expected behavior
- [ ] No error spikes in monitoring

## Production Deployment

### Pre-Production
- [ ] Staging deployment stable for 24+ hours
- [ ] Load testing completed successfully
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Backup and recovery plan documented
- [ ] Rollback plan documented
- [ ] Incident response plan updated

### Monitoring Setup
- [ ] Health check monitoring configured
- [ ] Queue depth alerts configured
- [ ] Failure rate alerts configured
- [ ] Latency alerts configured
- [ ] Log aggregation configured (ELK, Datadog, etc.)
- [ ] Metrics collection configured (Prometheus, etc.)
- [ ] Dashboards created (Grafana, etc.)
- [ ] On-call rotation updated

### Alert Configuration
- [ ] Critical: Health check fails → page on-call
- [ ] Critical: Queue depth > 1000 → page on-call
- [ ] Warning: Failure rate > 10% → notify team
- [ ] Warning: Queue depth > 100 for 5 min → notify team
- [ ] Warning: No jobs processed in 15 min → notify team
- [ ] Info: Memory usage > 80% → notify team
- [ ] Info: CPU usage > 80% → notify team

### Deployment Execution
- [ ] Maintenance window scheduled (if needed)
- [ ] Stakeholders notified
- [ ] Deployment manifest reviewed
- [ ] Database migrations completed (if any)
- [ ] Deployment applied with zero-downtime strategy
- [ ] Rolling update completed successfully
- [ ] All pods healthy
- [ ] Traffic routing correctly

### Post-Deployment Validation
- [ ] Health checks passing
- [ ] Test job processed successfully
- [ ] Real jobs processing normally
- [ ] Response times within SLA
- [ ] No error rate increase
- [ ] Metrics dashboards normal
- [ ] Logs show expected behavior
- [ ] No customer complaints

### Documentation
- [ ] Runbook updated with deployment steps
- [ ] Architecture diagram updated (if changed)
- [ ] API documentation updated (if changed)
- [ ] Troubleshooting guide updated
- [ ] Change log updated
- [ ] Version tagged in git
- [ ] Release notes published

## Monitoring & Maintenance

### Daily Checks
- [ ] Health check status
- [ ] Queue depth reasonable
- [ ] Error rate < 1%
- [ ] No stuck jobs
- [ ] Logs show no recurring errors

### Weekly Checks
- [ ] Performance metrics within baseline
- [ ] Queue retention settings working
- [ ] Failed job patterns analyzed
- [ ] Resource usage trending
- [ ] Security patches available?

### Monthly Checks
- [ ] Review and optimize queue settings
- [ ] Review failed job patterns
- [ ] Capacity planning review
- [ ] Performance optimization opportunities
- [ ] Dependency updates available?
- [ ] Security audit

## Rollback Plan

### Rollback Triggers
- [ ] Health checks failing for 5+ minutes
- [ ] Error rate > 25%
- [ ] Queue processing stopped
- [ ] Critical bug discovered
- [ ] Performance degradation > 50%

### Rollback Steps
1. [ ] Stop deployment/rollout
2. [ ] Revert to previous image version
3. [ ] Apply previous deployment manifest
4. [ ] Verify pods are healthy
5. [ ] Verify health checks passing
6. [ ] Verify jobs processing
7. [ ] Monitor for 15 minutes
8. [ ] Notify stakeholders
9. [ ] Post-mortem scheduled

## Security Checklist

### Code Security
- [ ] No secrets in code or logs
- [ ] Input validation comprehensive
- [ ] SQL injection prevention (N/A for this service)
- [ ] XSS prevention (N/A for this service)
- [ ] Dependencies scanned for vulnerabilities
- [ ] OWASP Top 10 reviewed

### Infrastructure Security
- [ ] Service runs as non-root user
- [ ] Network policies restrict access
- [ ] Redis password configured
- [ ] TLS/SSL configured (if applicable)
- [ ] Secrets managed via Kubernetes Secrets or Vault
- [ ] RBAC configured correctly
- [ ] Security groups/firewall rules restrictive

### Compliance
- [ ] Data retention policies implemented
- [ ] PII handling compliant (if applicable)
- [ ] Audit logging enabled
- [ ] Access controls documented
- [ ] Incident response plan includes this service

## Performance Checklist

### Resource Limits
- [ ] CPU limits configured
- [ ] Memory limits configured
- [ ] PVC size appropriate (if using)
- [ ] Connection pool sizes tuned
- [ ] Queue worker concurrency tuned

### Optimization
- [ ] Redis connection pooling enabled
- [ ] HTTP keep-alive enabled
- [ ] Appropriate job retention settings
- [ ] Batch operations where possible
- [ ] Caching strategy implemented (if needed)

### Load Testing Results
- [ ] Can handle expected peak load
- [ ] Response time < 5s for 95th percentile
- [ ] No memory leaks observed
- [ ] Graceful degradation under overload
- [ ] Recovery after load spike

## Disaster Recovery

### Backup
- [ ] Redis backup strategy documented
- [ ] Failed job data recoverable
- [ ] Configuration backed up
- [ ] Deployment manifests version controlled

### Recovery
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Recovery procedures documented
- [ ] Recovery tested in non-production

## Sign-Off

### Development Team
- [ ] Code complete and tested
- [ ] Documentation complete
- [ ] Known issues documented
- Name: _________________ Date: _______

### Operations Team
- [ ] Infrastructure ready
- [ ] Monitoring configured
- [ ] Runbook reviewed
- Name: _________________ Date: _______

### Security Team
- [ ] Security review completed
- [ ] Vulnerabilities addressed or accepted
- Name: _________________ Date: _______

### Product Owner
- [ ] Acceptance criteria met
- [ ] Release approved
- Name: _________________ Date: _______

---

## Notes

Use this space to document any deployment-specific notes, issues encountered, or deviations from the checklist:

```
Date: _____________
Notes:




```

---

**Version**: 1.0
**Last Updated**: 2025-11-25
**Service**: worker-runner
**Owner**: Backend Team
