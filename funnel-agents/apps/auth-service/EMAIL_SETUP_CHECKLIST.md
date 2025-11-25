# Email Service Setup Checklist

Quick reference for setting up the email service in auth-service.

## Prerequisites
- [x] Node.js 18+ installed
- [x] npm dependencies installed (`npm install`)
- [x] Access to SMTP server or SendGrid account

## Quick Start (5 minutes)

### Step 1: Choose Email Provider

Pick one of these options:

**Option A: Gmail (Easiest for development)**
- [x] Gmail account with 2FA enabled
- [x] Generate App Password: https://myaccount.google.com/apppasswords

**Option B: SendGrid (Recommended for production)**
- [x] SendGrid account created
- [x] API key with "Mail Send" permission
- [x] Sender email verified in SendGrid dashboard

**Option C: Custom SMTP**
- [x] SMTP credentials obtained from email provider
- [x] SMTP host, port, username, password

**Option D: Development Mode (No email needed)**
- [x] Skip configuration - emails will be logged only

### Step 2: Configure Environment

Copy and edit `.env`:

```bash
cd apps/auth-service
cp env.example.txt .env
```

**For Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@yourdomain.com
```

**For SendGrid:**
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**For Development:**
```bash
# Leave SMTP/SendGrid config empty
FRONTEND_URL=http://localhost:3000
```

### Step 3: Set Application URLs

```bash
# Required
FRONTEND_URL=http://localhost:3000
EMAIL_FROM=noreply@yourdomain.com

# Optional but recommended
EMAIL_REPLY_TO=support@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
DOCS_URL=https://docs.yourdomain.com
```

### Step 4: Test Configuration

Start the service and check logs:

```bash
npm run serve auth-service
```

Look for one of these log messages:
- ✅ "SMTP email transporter initialized successfully"
- ✅ "SendGrid email transporter initialized successfully"
- ⚠️ "No email configuration found... Email functionality will be simulated"

### Step 5: Verify Email Sending

Test password reset flow:
```bash
# Call the forgot-password endpoint
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Check:
- [x] No errors in console
- [x] Email received (or simulated log message)
- [x] Email contains reset link
- [x] Reset link works

## Configuration Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username/email | `user@gmail.com` |
| `SMTP_PASS` | SMTP password | `app-password` |

**OR**

| Variable | Description | Example |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | `SG.xxxxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_FROM` | From email address | `noreply@funnelagents.ai` |
| `SMTP_SECURE` | Use SSL (port 465) | `false` |
| `SMTP_REQUIRE_TLS` | Require TLS upgrade | `true` |
| `SMTP_REJECT_UNAUTHORIZED` | Verify SSL certs | `true` |
| `EMAIL_FROM` | Default from address | `noreply@funnelagents.ai` |
| `EMAIL_REPLY_TO` | Reply-to address | `undefined` |
| `SUPPORT_EMAIL` | Support contact | `support@funnelagents.ai` |
| `FRONTEND_URL` | Frontend base URL | `http://localhost:3000` |
| `DOCS_URL` | Documentation URL | `https://docs.funnelagents.ai` |

## Common SMTP Providers

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Outlook/Office365
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### AWS SES (US East)
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
```

## Troubleshooting

### Issue: "Email service not configured" warning

**Solution:** Add SMTP or SendGrid configuration to `.env`

### Issue: "Connection timeout" or "ECONNREFUSED"

**Possible causes:**
- Wrong SMTP host/port
- Firewall blocking outbound connections
- Network requires proxy

**Solutions:**
- Verify SMTP credentials
- Check firewall rules
- Try different port (587, 465, 2525)
- Test connection: `telnet smtp.example.com 587`

### Issue: "Authentication failed"

**Possible causes:**
- Wrong username/password
- 2FA required (Gmail)
- Account locked
- App password not generated

**Solutions:**
- Double-check credentials
- Use App Password for Gmail
- Check email provider's security settings
- Enable "less secure apps" or OAuth

### Issue: Emails go to spam

**Solutions:**
- Configure SPF record: `v=spf1 include:_spf.google.com ~all`
- Set up DKIM signing
- Verify sender domain
- Add DMARC policy
- Use verified domain email address
- Include unsubscribe link

### Issue: "SSL certificate problem"

**Solution:** For development only:
```bash
SMTP_REJECT_UNAUTHORIZED=false
```

**Warning:** Never use in production!

### Issue: Tests failing

**Solution:**
```bash
# Re-run tests
npm test auth-service -- email.service.spec

# Check for TypeScript errors
npx tsc --noEmit

# Reinstall dependencies
npm install
```

## Health Check

### Check Email Service Status

```bash
# If you have a health endpoint
curl http://localhost:3001/health/email
```

Expected responses:

**Configured and healthy:**
```json
{
  "configured": true,
  "provider": "smtp",
  "healthy": true
}
```

**Not configured (simulation mode):**
```json
{
  "configured": false,
  "provider": "none",
  "healthy": false,
  "error": "Email service not configured"
}
```

**Configured but unhealthy:**
```json
{
  "configured": true,
  "provider": "smtp",
  "healthy": false,
  "error": "Connection timeout"
}
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Email provider configured (SMTP or SendGrid)
- [ ] Environment variables set in production
- [ ] Sender domain verified (if using SendGrid)
- [ ] SPF/DKIM/DMARC records configured
- [ ] FRONTEND_URL set to production domain
- [ ] SSL/TLS enabled (SMTP_SECURE or SMTP_REQUIRE_TLS)
- [ ] Certificate validation enabled (SMTP_REJECT_UNAUTHORIZED=true)
- [ ] Health check endpoint configured
- [ ] Monitoring/alerting set up for email failures
- [ ] Rate limiting configured
- [ ] Tested end-to-end in staging environment

### Security Best Practices

- [ ] Store credentials in secrets manager (not .env files)
- [ ] Use app-specific passwords, not account passwords
- [ ] Enable 2FA on email provider account
- [ ] Restrict SMTP credentials to necessary IP ranges
- [ ] Rotate credentials regularly
- [ ] Use TLS for all connections
- [ ] Monitor for suspicious email activity
- [ ] Implement rate limiting
- [ ] Log all email operations (without sensitive data)

## Getting Help

### Documentation
- Implementation Report: `EMAIL_SERVICE_IMPLEMENTATION_REPORT.md`
- Usage Examples: `EMAIL_USAGE_EXAMPLES.md`
- Setup Guide: This file

### Logs Location
```bash
# Check service logs
npm run serve auth-service
# Look for [EmailService] log entries
```

### Test Email Sending
```typescript
// In your controller or test file
const health = await emailService.healthCheck();
console.log('Email health:', health);

await emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test'
});
```

## Quick Commands

```bash
# Install dependencies
npm install

# Run tests
npm test auth-service

# Run only email service tests
npm test -- email.service.spec

# Start service
npm run serve auth-service

# Build service
npm run build auth-service

# Check TypeScript errors
npx tsc --noEmit
```

## Success Indicators

You'll know the email service is working when:
- ✅ Service starts without errors
- ✅ Logs show "Email transporter initialized successfully"
- ✅ Health check returns `healthy: true`
- ✅ Test emails are delivered
- ✅ Password reset emails contain correct links
- ✅ All 26 unit tests pass

## Next Steps

After email is working:
1. Test all three email types (password reset, account locked, welcome)
2. Configure production email provider
3. Set up SPF/DKIM/DMARC records
4. Add email monitoring/alerting
5. Consider implementing email queue for reliability
6. Add email rate limiting
7. Customize email templates for your brand
