# FunnelAgents Monitoring Infrastructure

## Overview

Complete Prometheus and Grafana monitoring stack for the FunnelAgents platform with comprehensive metrics collection, alerting, and visualization.

## Components

### 1. Prometheus (Port 9090)
- **Purpose**: Time-series metrics collection and alerting
- **Scrape Interval**: 15 seconds
- **Data Retention**: 30 days
- **Configuration**: `infrastructure/docker/prometheus/prometheus.yml`

### 2. Grafana (Port 3001)
- **Purpose**: Metrics visualization and dashboards
- **Default Credentials**: admin / admin (change in production)
- **Dashboards**: Pre-configured dashboards for all services
- **Configuration**: `infrastructure/docker/grafana/`

## Quick Start

### Start Monitoring Stack

```bash
# Start all services including monitoring
cd infrastructure/docker
docker-compose up -d prometheus grafana

# Or start everything
docker-compose up -d
```

### Access Monitoring Tools

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### Install Dependencies

```bash
# Install Prometheus client libraries
npm install @willsoto/nestjs-prometheus prom-client
```

## Metrics Collection

### Standard Metrics

All services automatically collect:

1. **HTTP Request Metrics**
   - Request rate by method, path, status code
   - Request duration (P50, P95, P99)
   - Request/response size
   - Error rate by endpoint

2. **Database Metrics**
   - Query duration by operation and table
   - Active connections
   - Query count by operation
   - Error rate by operation

3. **Queue Metrics**
   - Jobs waiting/active/completed/failed
   - Job processing duration
   - Failure rate by queue and job type

4. **Resource Metrics**
   - Memory heap usage
   - CPU usage percentage
   - Process metrics (default Node.js metrics)

### Business Metrics

Domain-specific metrics:

1. **Agent Metrics**
   - `agents_active_count`: Number of active agents
   - `agents_executions_total`: Total agent executions
   - `agents_execution_duration_seconds`: Execution duration
   - `agents_errors_total`: Agent execution errors

2. **Task Metrics**
   - `tasks_created_total`: Tasks created
   - `tasks_completed_total`: Tasks completed
   - `tasks_failed_total`: Tasks failed
   - `tasks_pending_count`: Pending tasks

3. **Workflow Metrics**
   - `workflow_executions_total`: Workflow executions
   - `workflow_execution_duration_seconds`: Execution duration
   - `workflow_errors_total`: Workflow errors

4. **API Rate Limiting**
   - `api_rate_limit_exceeded_total`: Rate limit violations

5. **Cache Metrics**
   - `cache_hits_total`: Cache hits
   - `cache_misses_total`: Cache misses

## Service Integration

### Add Metrics to a Service

1. **Import MetricsModule in your service**:

```typescript
// apps/your-service/src/app.module.ts
import { MetricsModule } from '@funnelagents/infrastructure';
import { metricsProviders } from '@funnelagents/infrastructure';

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

2. **Add HTTP interceptor for automatic request tracking**:

```typescript
// apps/your-service/src/main.ts
import { MetricsInterceptor } from '@funnelagents/infrastructure';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add metrics interceptor
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));

  await app.listen(3000);
}
```

3. **Record custom metrics in your code**:

```typescript
import { MetricsService } from '@funnelagents/infrastructure';

@Injectable()
export class YourService {
  constructor(private readonly metrics: MetricsService) {}

  async processTask(task: Task) {
    const startTime = Date.now();

    try {
      // Your business logic
      const result = await this.executeTask(task);

      // Record success
      this.metrics.recordTaskCompleted(task.type);

      return result;
    } catch (error) {
      // Record failure
      this.metrics.recordTaskFailed(task.type, error.name);
      throw error;
    } finally {
      // Record duration
      const duration = Date.now() - startTime;
      // Additional metrics as needed
    }
  }
}
```

## Grafana Dashboards

### Pre-configured Dashboards

1. **Service Health Overview**
   - Service uptime status
   - Request rate per service
   - Error rate percentage
   - P95 response times
   - Database connections
   - Memory and CPU usage

2. **API Performance**
   - Request rate by method and status
   - Response time heatmap
   - P50/P95/P99 latency trends
   - Request/response sizes
   - Slowest endpoints
   - Error rate by endpoint

3. **Queue Metrics**
   - Jobs waiting in queues
   - Active jobs
   - Job processing rate
   - Failure rate
   - Processing duration
   - Queue backlog alerts

4. **Business Metrics**
   - Active agents count
   - Pending tasks
   - Agent execution rate
   - Task creation vs completion
   - Workflow executions
   - Rate limit violations
   - Cache hit rate

### Custom Dashboards

Create custom dashboards in Grafana:

1. Access Grafana: http://localhost:3001
2. Click "+" → "Dashboard"
3. Add panels with PromQL queries
4. Save dashboard to `infrastructure/docker/grafana/dashboards/`

Example PromQL queries:

```promql
# Total request rate across all services
sum(rate(funnelagents_http_requests_total[5m]))

# Error rate per service
sum(rate(funnelagents_http_requests_total{status_code=~"5.."}[5m])) by (service)
/ sum(rate(funnelagents_http_requests_total[5m])) by (service)

# P95 latency by service
histogram_quantile(0.95,
  sum(rate(funnelagents_http_request_duration_seconds_bucket[5m])) by (service, le)
)

# Queue backlog
funnelagents_queue_jobs_waiting

# Cache hit rate
sum(rate(funnelagents_cache_hits_total[5m]))
/ (sum(rate(funnelagents_cache_hits_total[5m])) + sum(rate(funnelagents_cache_misses_total[5m])))
```

## Alerting

### Alert Rules

Configured in `infrastructure/docker/prometheus/rules/alerts.yml`

#### Service Health Alerts

- **ServiceDown**: Service unavailable for > 1 minute
- **HighErrorRate**: Error rate > 5% for 5 minutes
- **CriticalErrorRate**: Error rate > 15% for 2 minutes

#### Performance Alerts

- **SlowHTTPRequests**: P95 latency > 2s for 10 minutes
- **VerySlowHTTPRequests**: P95 latency > 5s for 5 minutes
- **SlowDatabaseQueries**: P95 query time > 1s for 10 minutes

#### Database Alerts

- **DatabaseConnectionPoolHigh**: > 80 active connections for 5 minutes
- **HighDatabaseErrorRate**: > 1 error/second for 5 minutes

#### Queue Alerts

- **QueueBacklog**: > 1000 jobs waiting for 10 minutes
- **CriticalQueueBacklog**: > 5000 jobs waiting for 5 minutes
- **HighQueueJobFailureRate**: Failure rate > 10% for 10 minutes

#### Business Alerts

- **HighAgentFailureRate**: Agent failure rate > 20% for 10 minutes
- **TaskFailureSpike**: > 5 task failures/second for 5 minutes
- **WorkflowExecutionFailures**: Workflow failure rate > 15% for 10 minutes

#### Resource Alerts

- **HighMemoryUsage**: > 1.5GB for 10 minutes
- **CriticalMemoryUsage**: > 2.5GB for 5 minutes
- **HighCPUUsage**: > 80% for 10 minutes

### Configure Alertmanager (Optional)

To receive alert notifications:

1. Add Alertmanager service to `docker-compose.yml`
2. Configure notification channels (email, Slack, PagerDuty)
3. Update `prometheus.yml` with Alertmanager targets

## Production Considerations

### Security

1. **Change default credentials**:
   ```bash
   export GRAFANA_ADMIN_USER=your_admin
   export GRAFANA_ADMIN_PASSWORD=secure_password
   ```

2. **Enable HTTPS** for Prometheus and Grafana

3. **Restrict access** using authentication and firewall rules

### Performance

1. **Adjust scrape interval** based on needs (default: 15s)

2. **Configure data retention**:
   ```yaml
   # In docker-compose.yml prometheus command
   - '--storage.tsdb.retention.time=30d'  # Adjust as needed
   ```

3. **Use remote storage** for long-term retention (Thanos, Cortex, M3DB)

### High Availability

1. **Deploy multiple Prometheus instances** with federation

2. **Use Grafana HA setup** with shared database

3. **Configure alerting** with multiple Alertmanager instances

### Resource Limits

Current configuration:

```yaml
# Adjust in docker-compose.yml as needed
prometheus:
  deploy:
    resources:
      limits:
        cpus: "1"
        memory: 2G
      reservations:
        cpus: "0.5"
        memory: 512M
```

## Troubleshooting

### Metrics not appearing

1. Check service /metrics endpoint:
   ```bash
   curl http://localhost:3001/metrics
   ```

2. Verify Prometheus targets:
   - Open http://localhost:9090/targets
   - Check service status (should be "UP")

3. Check service logs:
   ```bash
   docker logs funnel-agents-auth-service
   ```

### Grafana dashboard issues

1. **Dashboard not loading**:
   - Check Prometheus data source in Grafana
   - Verify dashboard JSON syntax

2. **No data in panels**:
   - Check time range
   - Verify PromQL query syntax
   - Ensure metrics are being collected

### Alert not firing

1. Check alert rules:
   - Open http://localhost:9090/rules
   - Verify rule syntax and labels

2. Test alert query manually in Prometheus

3. Check alerting configuration in `prometheus.yml`

## Metrics Endpoint Reference

All services expose metrics at:

| Service | Metrics URL |
|---------|-------------|
| api-gateway | http://api-gateway:3000/metrics |
| auth-service | http://auth-service:3001/metrics |
| crm-service | http://crm-service:3002/metrics |
| campaigns-service | http://campaigns-service:3003/metrics |
| content-service | http://content-service:3004/metrics |
| agents-service | http://agents-service:3005/metrics |
| tasks-service | http://tasks-service:3006/metrics |
| automations-service | http://automations-service:3007/metrics |
| reports-service | http://reports-service:3008/metrics |
| worker-runner | http://worker-runner:3009/metrics |
| scheduler | http://scheduler:3010/metrics |

## Development vs Production

### Development

- Default ports exposed for easy access
- Single Prometheus instance
- In-memory alert evaluation
- No authentication required

### Production

- Use reverse proxy (nginx) with SSL
- Configure external storage
- Set up Alertmanager with notifications
- Enable authentication and authorization
- Use service discovery for dynamic targets
- Configure backup and disaster recovery

## Further Reading

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [@willsoto/nestjs-prometheus](https://github.com/willsoto/nestjs-prometheus)
