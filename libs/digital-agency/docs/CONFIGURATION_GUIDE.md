# Monitoring Configuration Quick Start Guide

## Minimum Configuration

To get monitoring running, you need at minimum:

### 1. Database Health Checks
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 2. Cache Health Checks
```bash
REDIS_URL=redis://localhost:6379/0
```

### 3. At Least One Alert Channel

**Option A: Email via SMTP (Gmail example)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password
ALERT_EMAIL_RECIPIENTS=oncall@example.com
```

**Option B: Slack**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Full Configuration Template

Copy this to your `.env` file and fill in your values:

```bash
# ============================================================================
# MONITORING CONFIGURATION
# ============================================================================

# -----------------------------------------------------------------------------
# Health Check Services
# -----------------------------------------------------------------------------
DATABASE_URL=postgresql://user:password@localhost:5432/digital_agency
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=                    # Optional

# -----------------------------------------------------------------------------
# Alert Recipients
# -----------------------------------------------------------------------------
ALERT_EMAIL_RECIPIENTS=admin@company.com,oncall@company.com
ALERT_SMS_RECIPIENTS=+15551234567,+15559876543  # E.164 format, critical only

# -----------------------------------------------------------------------------
# Email Configuration (choose SMTP or SendGrid)
# -----------------------------------------------------------------------------
EMAIL_PROVIDER=smtp                # Options: smtp, sendgrid
ALERT_SENDER_EMAIL=alerts@digital-agency.ai

# SMTP Provider (Gmail, Office365, etc.)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=your_app_password

# SendGrid Provider (alternative to SMTP)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------------
# Slack Configuration
# -----------------------------------------------------------------------------
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
SLACK_CHANNEL=#alerts             # Informational only

# -----------------------------------------------------------------------------
# SMS Configuration (Twilio - critical alerts only)
# -----------------------------------------------------------------------------
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15551234567

# -----------------------------------------------------------------------------
# External Services (for health checks)
# -----------------------------------------------------------------------------
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HUBSPOT_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Platform-Specific Guides

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Scroll to "App passwords"
   - Generate new password for "Mail"
3. Use in configuration:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=generated_app_password
   ```

### Office 365 SMTP Setup

```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your.email@company.com
SMTP_PASSWORD=your_password
```

### SendGrid Setup

1. Sign up at https://sendgrid.com
2. Create API key with "Mail Send" permission
3. Use in configuration:
   ```bash
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx
   ```

### Slack Webhook Setup

1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Enable "Incoming Webhooks"
4. Add new webhook to workspace
5. Select channel (e.g., #alerts)
6. Copy webhook URL
7. Use in configuration:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Twilio SMS Setup

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number (for sending)
4. Use in configuration:
   ```bash
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_FROM_NUMBER=+15551234567
   ALERT_SMS_RECIPIENTS=+15559876543
   ```

## Testing Your Configuration

### 1. Test Health Checks

```bash
cd digital-agency/monitoring
python test_monitoring.py
```

### 2. Test Individual Components

```python
import asyncio
from monitoring.health_check import HealthChecker

async def test():
    checker = HealthChecker()

    # Test database
    db = await checker.check_database()
    print(f"Database: {db['status']}")

    # Test cache
    cache = await checker.check_cache()
    print(f"Cache: {cache['status']}")

asyncio.run(test())
```

### 3. Test Alerts

```python
from monitoring.alerts import AlertManager, AlertSeverity, slack_alert_handler

manager = AlertManager()
manager.register_handler(slack_alert_handler)

manager.trigger_alert(
    alert_type="test",
    severity=AlertSeverity.INFO,
    message="Test alert - please ignore"
)
```

## Common Issues

### Issue: "Database URL not configured"
**Solution:** Set `DATABASE_URL` environment variable

### Issue: "SMTP authentication failed"
**Solutions:**
- Gmail: Use app password, not regular password
- Enable "Less secure app access" or use OAuth2
- Check username/password are correct

### Issue: "Slack webhook returns 404"
**Solutions:**
- Verify webhook URL is complete and correct
- Check webhook hasn't been deleted in Slack
- Recreate webhook in Slack app settings

### Issue: "SMS not sending"
**Solutions:**
- Verify phone numbers in E.164 format: +15551234567
- Check Twilio account has credit
- Only CRITICAL alerts trigger SMS
- Check Twilio console for delivery logs

### Issue: "Redis connection refused"
**Solutions:**
- Verify Redis is running: `redis-cli ping`
- Check Redis URL format: `redis://localhost:6379/0`
- If using password: `redis://:password@localhost:6379/0`

## Environment Variables Priority

Variables can be set in multiple ways (in order of precedence):

1. System environment variables
2. `.env` file in project root
3. `.env` file in monitoring directory
4. Default values in code

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` for templates
2. **Use environment-specific configs** - Different keys for dev/staging/prod
3. **Rotate credentials regularly** - Especially API keys and passwords
4. **Limit permissions** - API keys should have minimal required permissions
5. **Use secrets management** - Consider AWS Secrets Manager or HashiCorp Vault for production

## Production Recommendations

### High Availability Setup

```bash
# Use connection pooling
DATABASE_URL=postgresql://user:pass@host/db?pool_size=20&max_overflow=40

# Use Redis cluster or sentinel
REDIS_URL=redis://redis-cluster-node1:6379/0

# Multiple alert channels
ALERT_EMAIL_RECIPIENTS=oncall@company.com,backup@company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Alert Routing

Configure different recipients for different severity levels:

```bash
# Critical alerts
ALERT_SMS_RECIPIENTS=+15551111111,+15552222222
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/.../critical-alerts

# Regular alerts
ALERT_EMAIL_RECIPIENTS=team@company.com
```

### Monitoring Schedule

Recommended health check intervals:

- **Database**: Every 60 seconds
- **Cache**: Every 30 seconds
- **Agents**: Every 30 seconds
- **External Services**: Every 300 seconds (5 minutes)

Configure in your orchestration:

```python
health_checker = HealthChecker()
health_checker.check_interval = 60  # seconds
```

## Support Contacts

For configuration help:
- Check documentation: `MONITORING_IMPLEMENTATION.md`
- Run diagnostics: `python test_monitoring.py`
- Review logs: `/var/log/digital-agency/app.log`
