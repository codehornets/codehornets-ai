# Monitoring System Implementation

## Overview

This document describes the complete implementation of real monitoring connections for health checks and alert handlers in the Digital Agency AI Platform.

## Architecture

### Health Checks
- **Database Health**: Real PostgreSQL connection testing with query performance measurement
- **Cache Health**: Redis connection, memory usage, and response time monitoring
- **Agent Health**: Agent registry status, task queue depth, and agent state tracking
- **External Services**: HTTP health checks for Claude API, HubSpot, SendGrid, and other integrations

### Alert Handlers
- **Email Alerts**: Support for both SMTP and SendGrid providers
- **Slack Alerts**: Webhook-based notifications with color-coded severity
- **SMS Alerts**: Twilio integration for critical alerts only

## Implementation Details

### 1. Health Check Implementation

#### Database Health Check (`check_database`)

**Features:**
- Real SQLAlchemy connection testing
- Query execution with timing (SELECT 1)
- Connection pool status monitoring
- 5-second connection timeout
- Graceful degradation if not configured

**Returns:**
```python
{
    "status": "healthy|unhealthy|unconfigured",
    "response_time_ms": 15.23,
    "pool_size": 10,
    "pool_overflow": 2,
    "message": "Database operational"
}
```

**Configuration Required:**
- `DATABASE_URL` environment variable

#### Cache Health Check (`check_cache`)

**Features:**
- Redis PING command for connectivity
- Memory usage calculation (used/max)
- Connected clients count
- Async and sync Redis support
- Response time measurement

**Returns:**
```python
{
    "status": "healthy|unhealthy|unconfigured",
    "response_time_ms": 5.12,
    "memory_usage_bytes": 1048576,
    "memory_usage_percent": 45.2,
    "connected_clients": 3,
    "message": "Cache operational"
}
```

**Configuration Required:**
- `REDIS_URL` environment variable

#### Agent Health Check (`check_agents`)

**Features:**
- Agent status breakdown (idle/busy/error/offline)
- Task queue depth monitoring
- Active vs total agent counting
- Degradation detection (high queue, errors, no agents)

**Returns:**
```python
{
    "status": "healthy|degraded|unhealthy",
    "total_agents": 5,
    "active_agents": 5,
    "agent_breakdown": {
        "idle": 3,
        "busy": 2,
        "error": 0,
        "offline": 0
    },
    "pending_tasks": 10,
    "active_tasks": 2,
    "completed_tasks": 150,
    "message": "All agents operational"
}
```

**Configuration Required:**
- Orchestrator instance passed to HealthChecker constructor

#### External Services Health Check (`check_external_services`)

**Features:**
- HTTP HEAD/OPTIONS requests for fast checks
- Multiple service support (Claude, HubSpot, SendGrid)
- API key validation
- Response time measurement
- Parallel service checking with httpx

**Returns:**
```python
{
    "status": "healthy|degraded|unhealthy",
    "services": {
        "anthropic_api": {
            "status": "healthy",
            "response_time_ms": 120.5,
            "status_code": 405
        },
        "hubspot_api": {
            "status": "unconfigured",
            "message": "Service not configured"
        }
    },
    "total_services": 3,
    "configured_services": 1,
    "message": "External services operational"
}
```

**Configuration Required:**
- `ANTHROPIC_API_KEY` (required)
- `HUBSPOT_API_KEY` (optional)
- `SENDGRID_API_KEY` (optional)

### 2. Alert Handler Implementation

#### Email Alert Handler (`_send_email_alert`)

**Features:**
- Dual provider support (SMTP/SendGrid)
- HTML formatted emails with severity color coding
- Retry logic (3 attempts)
- Multiple recipient support
- Alert context inclusion

**Email Format:**
- Subject: `[SEVERITY] Digital Agency Alert: {type}`
- HTML body with styled severity, message, timestamp, context
- Color coded: Critical=Red, Error/Warning=Orange, Info=Blue

**Configuration Required:**

For SMTP:
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
ALERT_EMAIL_RECIPIENTS=admin@example.com,oncall@example.com
ALERT_SENDER_EMAIL=alerts@digital-agency.ai
```

For SendGrid:
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
ALERT_EMAIL_RECIPIENTS=admin@example.com,oncall@example.com
ALERT_SENDER_EMAIL=alerts@digital-agency.ai
```

#### Slack Alert Handler (`_send_slack_alert`)

**Features:**
- Webhook-based posting
- Color-coded attachments by severity
- Structured field display (severity, alert ID, timestamp)
- JSON context formatting
- Retry logic (3 attempts)

**Slack Message Format:**
- Attachment with color bar
- Title: Alert type
- Fields: Severity, Alert ID, Timestamp, Context
- Footer: Digital Agency Monitoring

**Configuration Required:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Color Mapping:**
- Critical: #FF0000 (Red)
- Error: #FF6B00 (Orange)
- Warning: #FFD700 (Gold)
- Info: #36A64F (Green)

#### SMS Alert Handler (`_send_sms_alert`)

**Features:**
- Twilio API integration
- Critical alerts only (filters by severity)
- Multiple recipient support
- Truncated messages (100 chars) for SMS limits
- Individual delivery tracking

**SMS Format:**
```
CRITICAL ALERT: {type}
{message truncated to 100 chars}
```

**Configuration Required:**
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
ALERT_SMS_RECIPIENTS=+1234567890,+0987654321
```

## Error Handling

### Graceful Degradation

All health checks and alert handlers follow a graceful degradation pattern:

1. **Check if service is configured** - Return "unconfigured" status with helpful message
2. **Check if library is available** - Return "unavailable" status if dependencies missing
3. **Attempt connection** - Return detailed error if connection fails
4. **Log all attempts** - Comprehensive logging at appropriate levels

### Retry Logic

- **Email (SMTP)**: 3 retry attempts with exception on final failure
- **Slack**: 3 retry attempts with exponential backoff
- **SMS**: Single attempt per recipient with individual error logging

### Logging

All operations are logged with appropriate severity:
- `logger.info()` - Successful operations
- `logger.warning()` - Configuration issues, skipped checks
- `logger.error()` - Failed operations, connection errors

## Usage Examples

### Basic Health Check

```python
from monitoring.health_check import HealthChecker

# Initialize
health_checker = HealthChecker(
    database_url="postgresql://user:pass@localhost/db",
    redis_url="redis://localhost:6379/0",
    orchestrator=orchestrator_instance
)

# Run all checks
results = await health_checker.check_all()

print(f"Overall Status: {results['overall_status']}")
print(f"Database: {results['checks']['database']['status']}")
```

### Individual Health Checks

```python
# Database only
db_result = await health_checker.check_database()

# Cache only
cache_result = await health_checker.check_cache()

# Agents only
agent_result = await health_checker.check_agents()

# External services only
services_result = await health_checker.check_external_services()
```

### Alert Management

```python
from monitoring.alerts import (
    AlertManager,
    AlertSeverity,
    email_alert_handler,
    slack_alert_handler,
    sms_alert_handler
)

# Initialize
alert_manager = AlertManager()

# Register handlers
alert_manager.register_handler(email_alert_handler)
alert_manager.register_handler(slack_alert_handler)
alert_manager.register_handler(sms_alert_handler)

# Trigger alert
alert_manager.trigger_alert(
    alert_type="high_error_rate",
    severity=AlertSeverity.WARNING,
    message="API error rate exceeded threshold",
    context={"error_rate": 0.08, "threshold": 0.05}
)

# Get active alerts
active = alert_manager.get_active_alerts(severity=AlertSeverity.CRITICAL)

# Acknowledge alert
alert_manager.acknowledge_alert(alert_id, acknowledged_by="ops_team")

# Resolve alert
alert_manager.resolve_alert(
    alert_id,
    resolved_by="ops_team",
    resolution_note="Fixed database connection pool"
)
```

### Integration Example

```python
# Health monitoring with automatic alerting
async def monitor_and_alert():
    health_checker = HealthChecker()
    alert_manager = AlertManager()
    alert_manager.register_handler(slack_alert_handler)

    results = await health_checker.check_all()

    for check_name, check_result in results['checks'].items():
        if check_result['status'] == 'unhealthy':
            alert_manager.trigger_alert(
                alert_type=f"{check_name}_failure",
                severity=AlertSeverity.ERROR,
                message=f"{check_name} health check failed",
                context=check_result
            )
```

## Testing

Run the comprehensive test suite:

```bash
# Navigate to monitoring directory
cd digital-agency/monitoring

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run tests
python test_monitoring.py
```

The test suite includes:
- Individual health check tests
- Individual alert handler tests
- Integration testing
- Configuration validation

## Configuration Summary

### Required Environment Variables

**Core:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

**Alerts (at least one notification method):**
- Email: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `ALERT_EMAIL_RECIPIENTS`
- Or: `SENDGRID_API_KEY`, `ALERT_EMAIL_RECIPIENTS`
- Slack: `SLACK_WEBHOOK_URL`
- SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `ALERT_SMS_RECIPIENTS`

**External Services (optional):**
- `ANTHROPIC_API_KEY`
- `HUBSPOT_API_KEY`
- `SENDGRID_API_KEY`

### Optional Environment Variables

- `ALERT_SENDER_EMAIL` - Email from address (default: alerts@digital-agency.ai)
- `EMAIL_PROVIDER` - smtp or sendgrid (default: smtp)
- `REDIS_PASSWORD` - Redis authentication
- `SLACK_CHANNEL` - Slack channel name (informational)

## Dependencies

All dependencies are already in requirements.txt:

- `sqlalchemy==2.0.25` - Database health checks
- `psycopg2-binary==2.9.9` - PostgreSQL driver
- `redis==5.0.1` - Redis health checks
- `httpx==0.26.0` - External service checks
- `requests==2.31.0` - Slack/SMS alerts
- `sendgrid==6.11.0` - Email via SendGrid (optional)
- Built-in `smtplib` - Email via SMTP

## Performance Considerations

### Health Checks
- Database: ~15-50ms (depends on connection)
- Redis: ~5-10ms (local) or ~20-50ms (remote)
- Agents: <5ms (in-memory)
- External Services: ~100-500ms per service (parallel execution)

### Alert Delivery
- Email (SMTP): ~500-2000ms
- Email (SendGrid): ~200-800ms
- Slack: ~100-500ms
- SMS: ~500-1500ms per recipient

### Optimization
- Health checks run in parallel using `asyncio.gather()`
- External service checks are parallelized
- Connection pooling for repeated health checks
- Retry logic includes reasonable timeouts (5-10s)

## Security Considerations

1. **Credentials**: All sensitive data from environment variables
2. **API Keys**: Never logged or exposed in responses
3. **Error Messages**: Generic errors returned to clients, detailed logs server-side
4. **SMTP**: Always uses STARTTLS for encryption
5. **Timeouts**: All network operations have timeouts to prevent hanging

## Future Enhancements

Potential improvements:
1. Add Prometheus metrics export
2. Implement health check caching with TTL
3. Add PagerDuty integration
4. Support for custom health check plugins
5. Dashboard for visualization
6. Historical health data persistence
7. Anomaly detection for metric trends
8. Alert deduplication and rate limiting

## Troubleshooting

### Database Health Check Fails
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Verify network connectivity
- Check credentials and permissions

### Cache Health Check Fails
- Verify `REDIS_URL` is correct
- Check Redis is running
- Verify password if required
- Check network/firewall rules

### Email Alerts Not Sending
- Verify SMTP credentials or SendGrid API key
- Check `ALERT_EMAIL_RECIPIENTS` is set
- Review logs for specific error messages
- Test with a simple email client first

### Slack Alerts Not Sending
- Verify webhook URL is correct and not expired
- Test webhook with curl manually
- Check Slack app permissions
- Review Slack workspace settings

### SMS Alerts Not Sending
- Verify Twilio credentials
- Check account balance
- Verify phone numbers in E.164 format (+1234567890)
- Review Twilio console for delivery logs

## Support

For issues or questions:
1. Check logs in `/var/log/digital-agency/`
2. Review this documentation
3. Run `test_monitoring.py` for diagnostics
4. Check environment variable configuration
