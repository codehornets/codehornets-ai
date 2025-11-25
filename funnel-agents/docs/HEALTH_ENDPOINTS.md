# Health Check Endpoints - Quick Reference

## Overview

All services now expose standardized health check endpoints for monitoring and orchestration.

---

## Endpoint Patterns

### Liveness Check: `GET /health`
- Returns HTTP 200 if service is running
- No external dependency checks
- Use for Kubernetes liveness probes

### Readiness Check: `GET /health/ready`
- Verifies database and other dependencies
- Returns 'ready' or 'not_ready' status
- Use for Kubernetes readiness probes and load balancers

---

## Service Endpoints

| Service | Port | Liveness | Readiness |
|---------|------|----------|-----------|
| api-gateway | 3000 | `/health` | `/health/services` |
| auth-service | 3001 | `/health` | `/health/ready` |
| crm-service | 3002 | `/health` | `/health/ready` |
| campaigns-service | 3003 | `/health` | `/health/ready` |
| content-service | 3004 | `/health` | `/health/ready` |
| agents-service | 3005 | `/health` | `/health/ready` |
| tasks-service | 3006 | `/health` | `/health/ready` |
| automations-service | 3007 | `/health` | `/health/ready` |
| reports-service | 3008 | `/health` | `/health/ready` |
| worker-runner | 3009 | `/health` | `/health/detailed` |
| scheduler | 3010 | `/health` | `/health/ready` |

---

## Quick Test Commands

### Test Single Service
```bash
# Liveness
curl http://localhost:3001/health | jq

# Readiness
curl http://localhost:3001/health/ready | jq
```

### Test All Services
```bash
./test-health-checks.sh
```

### Test Specific Port Range
```bash
for port in {3001..3010}; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq -r '.service + ": " + .status'
done
```

---

## Response Formats

### Liveness Response
```json
{
  "status": "healthy",
  "timestamp": "2025-11-25T10:30:00.000Z",
  "service": "auth-service",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Readiness Response (Healthy)
```json
{
  "status": "ready",
  "timestamp": "2025-11-25T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 15
    }
  }
}
```

### Readiness Response (Unhealthy)
```json
{
  "status": "not_ready",
  "timestamp": "2025-11-25T10:30:00.000Z",
  "checks": {
    "database": {
      "status": "down",
      "responseTime": 5000,
      "error": "Connection timeout"
    }
  }
}
```

---

## Kubernetes Configuration

### Deployment Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    spec:
      containers:
      - name: auth-service
        image: funnelagents/auth-service:latest
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

---

## Docker Compose Health Checks

```yaml
services:
  auth-service:
    image: funnelagents/auth-service:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
```

---

## Monitoring Integration

### Prometheus Metrics (Future)
Health endpoints can be extended to expose metrics:
```
# HELP service_health Service health status (1=healthy, 0=unhealthy)
# TYPE service_health gauge
service_health{service="auth-service"} 1

# HELP database_response_time Database query response time in ms
# TYPE database_response_time gauge
database_response_time{service="auth-service"} 15
```

### Grafana Dashboard Queries
```promql
# Service availability
up{job="funnelagents"}

# Database response time
database_response_time{service="auth-service"}

# Service uptime
service_uptime_seconds{service="auth-service"}
```

---

## Troubleshooting

### Service Not Responding
```bash
# Check if service is running
docker ps | grep auth-service

# Check service logs
docker logs auth-service | tail -50

# Check port binding
netstat -tlnp | grep 3001
```

### Database Connection Failed
```bash
# Test database directly
psql -h localhost -U funnel_agents -d funnel_agents -c "SELECT 1"

# Check database logs
docker logs funnel-agents-db | tail -50

# Verify environment variables
docker exec auth-service env | grep DB_
```

### Load Balancer Issues
```bash
# Check readiness status
curl -v http://localhost:3001/health/ready

# Verify response time
time curl http://localhost:3001/health/ready
```

---

## Development Tips

### Adding New Health Checks

1. Edit `health.service.ts` in the service
2. Add new check method:
```typescript
private async checkRedis(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  try {
    await this.redis.ping();
    return {
      status: 'up',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message,
    };
  }
}
```

3. Update `checkReadiness()`:
```typescript
async checkReadiness() {
  const checks = {
    database: await this.checkDatabase(),
    redis: await this.checkRedis(), // Add new check
  };
  // ... rest of logic
}
```

### Testing Health Checks Locally

```bash
# Start services
npm run serve:all

# In another terminal, test health
./test-health-checks.sh

# Or test individually
curl http://localhost:3001/health | jq
```

---

## Production Recommendations

1. Set appropriate timeouts:
   - Liveness: 5-10s
   - Readiness: 3-5s

2. Configure failure thresholds:
   - Liveness: 3-5 failures
   - Readiness: 2-3 failures

3. Set initial delays:
   - Liveness: 30-60s (allow startup time)
   - Readiness: 10-20s

4. Monitor health check failures:
   - Alert on repeated failures
   - Track response times
   - Log dependency issues

5. Use health checks for:
   - Load balancer routing
   - Auto-scaling decisions
   - Deployment verification
   - Circuit breaker patterns

---

## Related Documentation

- [HEALTH_CHECKS_IMPLEMENTATION_REPORT.md](./HEALTH_CHECKS_IMPLEMENTATION_REPORT.md) - Full implementation details
- [test-health-checks.sh](./test-health-checks.sh) - Automated test script
- [Makefile](./Makefile) - Make commands for health checks

---

**Last Updated**: 2025-11-25
