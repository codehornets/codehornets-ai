# Monitoring Quick Start Guide

Get Prometheus and Grafana monitoring up and running in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

This will install:
- `@willsoto/nestjs-prometheus` - NestJS Prometheus integration
- `prom-client` - Prometheus client library

## 2. Start Monitoring Services

```bash
make monitoring-up
```

Or manually:
```bash
cd infrastructure/docker
docker-compose up -d prometheus grafana
```

**Access Points:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 3. Integrate into a Service

### Option A: Use Existing Integration

The metrics infrastructure is already available in `libs/infrastructure`. Just import and use:

```typescript
// apps/your-service/src/app.module.ts
import { MetricsModule, metricsProviders } from '@funnelagents/infrastructure';

@Module({
  imports: [
    MetricsModule.forRoot({
      serviceName: 'your-service',
      defaultLabels: {
        component: 'backend',
      },
    }),
    // ... other imports
  ],
  providers: [
    ...metricsProviders,
    // ... other providers
  ],
})
export class AppModule {}
```

```typescript
// apps/your-service/src/main.ts
import { MetricsInterceptor, MetricsService } from '@funnelagents/infrastructure';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add metrics interceptor for automatic HTTP tracking
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  await app.listen(3000);
}
```

### Option B: Record Custom Metrics

```typescript
import { MetricsService } from '@funnelagents/infrastructure';

@Injectable()
export class TasksService {
  constructor(private readonly metrics: MetricsService) {}

  async createTask(dto: CreateTaskDto) {
    // Record task creation
    this.metrics.recordTaskCreated(dto.type);

    const task = await this.taskRepository.save(dto);
    return task;
  }

  async completeTask(id: string) {
    const task = await this.taskRepository.findOne(id);

    // Record task completion
    this.metrics.recordTaskCompleted(task.type);

    task.status = 'completed';
    return this.taskRepository.save(task);
  }
}
```

## 4. Start Your Service

```bash
# Start a single service
make dev-auth

# Or start all services
make up
```

## 5. Verify Metrics

### Check Metrics Endpoint
```bash
curl http://localhost:3001/metrics
```

You should see output like:
```
# HELP funnelagents_http_requests_total Total number of HTTP requests
# TYPE funnelagents_http_requests_total counter
funnelagents_http_requests_total{method="GET",path="/health",status_code="200",service="auth-service"} 1

# HELP funnelagents_http_request_duration_seconds HTTP request duration in seconds
# TYPE funnelagents_http_request_duration_seconds histogram
funnelagents_http_request_duration_seconds_bucket{le="0.001",method="GET",path="/health",status_code="200",service="auth-service"} 1
```

### Check Prometheus Targets
1. Open http://localhost:9090/targets
2. Verify your service appears in the list
3. Status should be "UP"

## 6. Access Grafana Dashboards

1. Open http://localhost:3001
2. Login: admin / admin
3. Navigate to: Dashboards → FunnelAgents
4. Available dashboards:
   - **Service Health Overview** - Overall system health
   - **API Performance** - Request metrics and latencies
   - **Queue Metrics** - Job queue monitoring
   - **Business Metrics** - Domain-specific KPIs

## 7. Test Alerts

Generate some load to see metrics:

```bash
# Spam the health endpoint
for i in {1..100}; do curl http://localhost:3001/health; done

# Watch Prometheus alerts
open http://localhost:9090/alerts
```

## Available Metrics

### HTTP Metrics (Automatic)
- `funnelagents_http_requests_total` - Request count
- `funnelagents_http_request_duration_seconds` - Request latency
- `funnelagents_http_response_size_bytes` - Response size
- `funnelagents_http_request_size_bytes` - Request size

### Database Metrics
```typescript
// Record a database query
metricsService.recordDbQuery('SELECT', 'users', duration);

// Record a database error
metricsService.recordDbError('SELECT', 'users', 'TIMEOUT');

// Update connection count
metricsService.setDbConnections(activeConnections);
```

### Queue Metrics
```typescript
// Record a completed job
metricsService.recordQueueJob('email-queue', 'send-email', 'completed', duration);

// Update queue stats
metricsService.setQueueJobsActive('email-queue', activeCount);
metricsService.setQueueJobsWaiting('email-queue', waitingCount);
```

### Agent Metrics
```typescript
// Record agent execution
metricsService.recordAgentExecution('crm-agent', 'success', duration);

// Update active agents count
metricsService.setActiveAgents(count);
```

### Task Metrics
```typescript
metricsService.recordTaskCreated('lead-qualification');
metricsService.recordTaskCompleted('lead-qualification');
metricsService.recordTaskFailed('lead-qualification', 'TIMEOUT');
metricsService.setTasksPending(count);
```

### Workflow Metrics
```typescript
metricsService.recordWorkflowExecution('lead-nurture', 'success', duration);
```

### Cache Metrics
```typescript
metricsService.recordCacheHit('user:123');
metricsService.recordCacheMiss('user:456');
```

### Rate Limit Metrics
```typescript
metricsService.recordRateLimitExceeded('/api/users', userId);
```

## Make Commands

```bash
# Start monitoring
make monitoring-up

# Stop monitoring
make monitoring-down

# View logs
make monitoring-logs

# Check health
make monitoring-status

# Check all service metrics
make monitoring-metrics

# Reload Prometheus config
make monitoring-prometheus-reload
```

## Common PromQL Queries

```promql
# Total request rate
sum(rate(funnelagents_http_requests_total[5m]))

# Error rate per service
sum(rate(funnelagents_http_requests_total{status_code=~"5.."}[5m])) by (service)
/ sum(rate(funnelagents_http_requests_total[5m])) by (service)

# P95 latency
histogram_quantile(0.95,
  sum(rate(funnelagents_http_request_duration_seconds_bucket[5m])) by (service, le)
)

# Queue backlog
funnelagents_queue_jobs_waiting

# Active agents
funnelagents_agents_active_count

# Cache hit rate
sum(rate(funnelagents_cache_hits_total[5m]))
/ (sum(rate(funnelagents_cache_hits_total[5m])) + sum(rate(funnelagents_cache_misses_total[5m])))
```

## Troubleshooting

### Metrics endpoint returns 404
- Make sure MetricsModule is imported in AppModule
- Verify metricsProviders are included in providers array
- Check that service is running

### Prometheus can't scrape service
- Verify service is running: `docker ps`
- Check service is accessible: `curl http://service:port/metrics`
- Review Prometheus logs: `make monitoring-logs`
- Verify network configuration in docker-compose.yml

### Grafana shows no data
- Check Prometheus data source: Configuration → Data Sources
- Verify time range is correct
- Test query in Prometheus first
- Check dashboard variables

### Alerts not firing
- Verify alert rules: http://localhost:9090/rules
- Check alert query returns data in Prometheus
- Review alerting configuration

## Next Steps

1. **Read Full Documentation**: `infrastructure/docker/MONITORING.md`
2. **Customize Dashboards**: Create service-specific dashboards
3. **Set Up Alertmanager**: Configure notification channels
4. **Production Setup**: Secure endpoints, configure backups
5. **Monitor More Services**: Integrate monitoring into all services

## Resources

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- [Full Documentation](./MONITORING.md)
- [Implementation Report](./MONITORING_IMPLEMENTATION_REPORT.md)
