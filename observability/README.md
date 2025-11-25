# Observability Stack for Agent Orchestration System

A production-grade observability solution for monitoring, tracing, and debugging the hooks-based agent communication system. This stack provides comprehensive visibility into distributed task processing with focus on operational excellence and rapid troubleshooting.

## 🎯 Overview

This observability stack monitors a distributed agent orchestration system with:
- **Multi-agent architecture:** Orchestrator + 3 workers (marie, anga, fabien)
- **File-based triggers:** Task distribution via shared filesystem
- **Named pipe communication:** Real-time status updates
- **Claude integration:** AI-powered task processing

## 📊 Key Features

### 1. **Distributed Tracing (OpenTelemetry + Jaeger)**
- End-to-end task tracing from creation to completion
- Correlation IDs across all components
- Context propagation through files and pipes
- Trace visualization and analysis

### 2. **Metrics Collection (Prometheus + Grafana)**
- Real-time task processing metrics
- System resource monitoring
- Custom business metrics
- SLI/SLO tracking with error budgets

### 3. **Centralized Logging (Loki + Promtail)**
- Structured JSON logging
- Log correlation with traces
- Real-time log aggregation
- Query and analysis capabilities

### 4. **Intelligent Alerting (Alertmanager)**
- Multi-tier alert routing
- Intelligent grouping and suppression
- Integration with PagerDuty/Slack
- Runbook automation

## 🚀 Quick Start

### Prerequisites
```bash
# Required software
- Docker & Docker Compose
- Python 3.9+
- Node.js 16+ (for Claude)

# Required API keys (in .env file)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
PROMETHEUS_ENDPOINT=http://localhost:9090
LOKI_ENDPOINT=http://localhost:3100
```

### Deploy the Stack

```bash
# 1. Start the observability stack
docker-compose -f observability/docker-compose.observability.yml up -d

# 2. Wait for services to be ready
sleep 30

# 3. Verify health
curl http://localhost:9090/-/ready  # Prometheus
curl http://localhost:3000/api/health  # Grafana
curl http://localhost:16686/  # Jaeger UI

# 4. Access dashboards
open http://localhost:3000  # Grafana (admin/admin)
open http://localhost:16686  # Jaeger
open http://localhost:9090   # Prometheus
```

## 📁 Project Structure

```
observability/
├── instrumentation/           # Code instrumentation libraries
│   ├── tracing.py            # OpenTelemetry tracing
│   ├── metrics.py            # Prometheus metrics
│   └── logging.py            # Structured logging
├── config/                   # Configuration files
│   ├── prometheus.yml        # Prometheus config
│   ├── alertmanager.yml      # Alert routing
│   ├── alert-rules.yml       # Alert definitions
│   └── otel-collector.yml    # OpenTelemetry config
├── dashboards/               # Grafana dashboards
│   └── task-processing-overview.json
├── runbooks/                 # Operational runbooks
│   ├── investigate-slow-tasks.md
│   └── debug-worker-crash.md
├── slo/                      # SLO definitions
│   └── service-level-objectives.yaml
└── docker-compose.observability.yml
```

## 🔧 Integration Guide

### 1. Instrument Your Worker

```python
from observability.instrumentation.tracing import ObservabilityManager, TaskTracer
from observability.instrumentation.metrics import MetricsAggregator
from observability.instrumentation.logging import get_logger, set_log_context

# Initialize observability
obs_manager = ObservabilityManager(
    service_name="agent-orchestrator",
    worker_name="marie",
    otlp_endpoint="localhost:4317"
)

metrics = MetricsAggregator(
    worker_name="marie",
    port=9091
)

logger = get_logger("agent-worker", worker_name="marie")

# Start metrics server
metrics.start_http_server()

# Trace task processing
task_tracer = TaskTracer(obs_manager)

with obs_manager.trace_task("task-123", "process_document") as span:
    # Set logging context
    set_log_context(
        task_id="task-123",
        correlation_id=span.get_span_context().trace_id
    )

    # Log task start
    logger.info("Starting task processing", task_type="document_analysis")

    # Record metrics
    metrics.record_task_created("document_analysis", "high")

    # Process task...
    process_result = process_task()

    # Complete tracking
    task_tracer.trace_task_completion("task-123", duration=1.5, success=True)
```

### 2. Add Health Checks

```python
from observability.instrumentation.metrics import watcher_heartbeat

def health_check():
    """Worker health check endpoint"""
    # Update heartbeat
    watcher_heartbeat.labels(worker=WORKER_NAME).set(time.time())

    # Check dependencies
    checks = {
        "database": check_database_connection(),
        "filesystem": check_filesystem_access(),
        "named_pipes": check_pipe_connectivity()
    }

    # Return health status
    if all(checks.values()):
        return {"status": "healthy", "checks": checks}, 200
    else:
        return {"status": "unhealthy", "checks": checks}, 503
```

### 3. Enable Trace Propagation

```python
from observability.instrumentation.tracing import TraceContext

# When creating a task
def create_task(task_data):
    # Create trace context
    context = obs_manager.create_trace_context(task_data['id'])

    # Inject into task file
    task_file = Path(f"/shared/tasks/{worker_name}/{task_data['id']}.json")
    task_data['_trace_context'] = context.to_dict()

    with open(task_file, 'w') as f:
        json.dump(task_data, f)

# When processing a task
def process_task(task_file):
    # Extract trace context
    context = obs_manager.extract_trace_context(task_file)

    if context:
        # Continue trace
        token = obs_manager.continue_trace(context)
        try:
            # Process with trace context
            do_work()
        finally:
            detach(token)
```

## 📈 Dashboards

### Available Dashboards

1. **Task Processing Overview** - High-level system metrics
2. **Worker Performance** - Per-worker detailed metrics
3. **Error Analysis** - Error rates and failure patterns
4. **Resource Utilization** - CPU, memory, disk usage
5. **SLO Compliance** - Service level tracking

### Key Metrics Tracked

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `task_processing_duration_seconds` | Task completion time | P95 > 30s |
| `task_queue_depth` | Pending tasks per worker | > 1000 |
| `task_failed_total` | Failed task count | Rate > 0.01/s |
| `active_tasks` | Currently processing | > 50 |
| `watcher_heartbeat_timestamp` | Worker liveness | Age > 60s |

## 🚨 Alerting Rules

### Critical Alerts
- **Worker Down:** Process unavailable for >1 minute
- **Task Queue Overflow:** >1000 pending tasks
- **Disk Space Critical:** <5% free space
- **Claude API Failures:** >0.5 errors/sec

### Warning Alerts
- **High Latency:** P95 >30s for 10 minutes
- **Growing Backlog:** Queue increasing for 15 minutes
- **High Error Rate:** >10% failures for 5 minutes
- **Resource Usage:** CPU >80% or Memory >85%

## 📝 Runbooks

### [Investigating Slow Tasks](runbooks/investigate-slow-tasks.md)
- Check system status
- Identify bottlenecks
- Trace analysis
- Mitigation steps

### [Debugging Worker Crashes](runbooks/debug-worker-crash.md)
- Verify worker status
- Analyze crash logs
- Recovery procedures
- Prevention measures

## 📊 SLO Definitions

| Service | SLI | Target | Window |
|---------|-----|--------|--------|
| Task Processing | Availability | 99.9% | 30d |
| Task Processing | P95 Latency <30s | 95% | 7d |
| Task Processing | Success Rate | 99% | 30d |
| Worker Health | Uptime | 99.5% | 7d |
| Communication | Reliability | 99.99% | 30d |

## 🔍 Troubleshooting Guide

### Common Issues

#### 1. Missing Metrics
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify worker metrics endpoint
curl http://marie:9091/metrics
```

#### 2. No Traces Appearing
```bash
# Check OTEL collector
docker logs otel-collector

# Verify trace export
curl http://localhost:4317/v1/traces
```

#### 3. Logs Not Aggregating
```bash
# Check Loki status
curl http://localhost:3100/ready

# Verify Promtail
docker logs promtail
```

## 🛠️ Advanced Configuration

### Custom Metrics

```python
from prometheus_client import Counter, Histogram, Gauge

# Define custom metrics
business_metric = Counter(
    'business_transactions_total',
    'Business transactions processed',
    ['transaction_type', 'status']
)

# Record metrics
business_metric.labels(
    transaction_type='payment',
    status='success'
).inc()
```

### Custom Alerts

```yaml
# Add to alert-rules.yml
- alert: CustomBusinessAlert
  expr: rate(business_transactions_total{status="failed"}[5m]) > 0.1
  for: 5m
  labels:
    severity: warning
    team: business
  annotations:
    summary: "High business transaction failure rate"
```

### Trace Sampling

```yaml
# In otel-collector-config.yml
processors:
  tail_sampling:
    policies:
      - name: important-tasks
        type: string_attribute
        string_attribute:
          key: task.priority
          values: ["critical", "high"]
```

## 📚 Best Practices

1. **Always propagate context** - Include correlation IDs in all operations
2. **Use structured logging** - JSON format with consistent fields
3. **Set meaningful SLOs** - Based on user experience, not arbitrary targets
4. **Test observability** - Include in CI/CD pipeline
5. **Regular reviews** - Weekly metrics review, monthly SLO review
6. **Document everything** - Runbooks, dashboards, alert meanings

## 🔗 Useful Links

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [SRE Workbook](https://sre.google/workbook/)

## 🤝 Contributing

To add new observability features:

1. Add instrumentation code to `/instrumentation`
2. Update Prometheus/Grafana configs
3. Create dashboard JSON in `/dashboards`
4. Document in runbooks
5. Update this README

## 📧 Support

For issues or questions:
- Check runbooks first
- Review Grafana dashboards
- Contact: sre-team@company.com
- On-call: Check PagerDuty

---

*Built for production reliability and operational excellence*