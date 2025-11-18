# HandyMate - Render Deployment Guide

## Overview

This directory contains the Render Blueprint configuration for deploying all 8 HandyMate CRM modules plus n8n workflow automation to [Render](https://render.com).

## Prerequisites

- Render account (sign up at <https://render.com>)
- GitHub repository connected to Render
- Docker files configured for each CRM module

## Quick Start

### 1. Prepare Your Repository

Ensure your repository contains:

- `render.yaml` in the project root or `infrastructure/render/`
- Dockerfiles for each CRM module at:
  - `crm/developer/Dockerfile`
  - `crm/dancer/Dockerfile`
  - `crm/painter/Dockerfile`
  - `crm/driver/Dockerfile`
  - `crm/influencer/Dockerfile`
  - `crm/hunter/Dockerfile`
  - `crm/seller/Dockerfile`
  - `crm/trader/Dockerfile`
- n8n Dockerfile at `infrastructure/docker/n8n/Dockerfile`

### 2. Deploy to Render

**Option A: Using Render Dashboard**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Review the services and databases to be created
6. Click **Apply** to deploy

**Option B: Using Render CLI**

```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy from blueprint
render deploy --blueprint infrastructure/render/render.yaml
```

### 3. Post-Deployment Setup

After deployment completes:

#### Create Individual Databases

Render creates a single MySQL instance. You need to create separate databases for each module:

```bash
# Connect to MySQL (get credentials from Render Dashboard)
mysql -h <mysql-host> -u <username> -p

# Create databases
CREATE DATABASE handymate_developer;
CREATE DATABASE handymate_dancer;
CREATE DATABASE handymate_painter;
CREATE DATABASE handymate_driver;
CREATE DATABASE handymate_influencer;
CREATE DATABASE handymate_hunter;
CREATE DATABASE handymate_seller;
CREATE DATABASE handymate_trader;
CREATE DATABASE handymate_n8n;

GRANT ALL PRIVILEGES ON handymate_developer.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_dancer.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_painter.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_driver.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_influencer.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_hunter.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_seller.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_trader.* TO '<username>'@'%';
GRANT ALL PRIVILEGES ON handymate_n8n.* TO '<username>'@'%';

FLUSH PRIVILEGES;
```

#### Run Database Migrations

For each CRM module, run migrations via Render Shell:

```bash
# Via Render Dashboard: Shell → Select service → Run command
php artisan migrate --force
```

Or create a one-off job in Render:

```bash
# Developer CRM
render run -s handymate-developer -- php artisan migrate --force

# Dancer CRM
render run -s handymate-dancer -- php artisan migrate --force

# Repeat for all modules...
```

#### Configure Custom Domains

1. Go to each service in Render Dashboard
2. Click **Settings** → **Custom Domains**
3. Add your domains:
   - `developer.handymate.com` → handymate-developer
   - `dancer.handymate.com` → handymate-dancer
   - `painter.handymate.com` → handymate-painter
   - `driver.handymate.com` → handymate-driver
   - `influencer.handymate.com` → handymate-influencer
   - `hunter.handymate.com` → handymate-hunter
   - `seller.handymate.com` → handymate-seller
   - `trader.handymate.com` → handymate-trader
   - `n8n.handymate.com` → handymate-n8n

Render automatically provisions free SSL certificates via Let's Encrypt.

## Service Architecture

### Services

| Service | Type | Plan | URL |
|---------|------|------|-----|
| handymate-developer | Web | Standard | `<service>.onrender.com` |
| handymate-dancer | Web | Standard | `<service>.onrender.com` |
| handymate-painter | Web | Standard | `<service>.onrender.com` |
| handymate-driver | Web | Standard | `<service>.onrender.com` |
| handymate-influencer | Web | Standard | `<service>.onrender.com` |
| handymate-hunter | Web | Standard | `<service>.onrender.com` |
| handymate-seller | Web | Standard | `<service>.onrender.com` |
| handymate-trader | Web | Standard | `<service>.onrender.com` |
| handymate-n8n | Web | Pro | `<service>.onrender.com` |
| handymate-n8n-worker-* | Worker | Standard | N/A |

### Databases

| Database | Type | Plan |
|----------|------|------|
| handymate-mysql | MySQL | Standard |
| handymate-redis | Redis | Standard |

## Scaling

### Manual Scaling

Via Render Dashboard:

1. Go to service → **Settings** → **Instance**
2. Adjust instance type (Free, Starter, Standard, Pro, Pro Plus, Pro Max)
3. For horizontal scaling, Render automatically manages based on load

### Auto-Scaling

Render provides automatic horizontal scaling on Pro plans and above:

- Automatically adds instances based on CPU/memory usage
- Configured in service settings
- Scales down during low traffic periods

## Monitoring

### Logs

View logs for each service:

```bash
# Via Render CLI
render logs -s handymate-developer

# Via Dashboard
# Go to service → Logs tab
```

### Metrics

Render provides built-in metrics:

- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

Access via: Service → **Metrics** tab

### Alerts

Configure alerts in Render Dashboard:

1. Service → **Settings** → **Alerts**
2. Set up notifications for:
   - Deploy failures
   - Service crashes
   - High error rates
   - Resource exhaustion

## Cost Optimization

### Development/Staging

For non-production environments, use lower-tier plans:

```yaml
# Update render.yaml
services:
  - name: handymate-developer
    plan: starter  # Instead of standard
```

### Database Sizing

Monitor database usage and adjust plan:

- **Starter**: Small projects, testing
- **Standard**: Production workloads
- **Pro**: High-traffic applications

### Redis Sizing

Redis plans based on memory needs:

- **Free**: 25 MB (development only)
- **Starter**: 256 MB
- **Standard**: 1 GB
- **Pro**: 4+ GB

## Troubleshooting

### Service Won't Start

1. Check build logs in Render Dashboard
2. Verify Dockerfile builds locally:

   ```bash
   docker build -t test -f crm/developer/Dockerfile crm/developer
   ```

3. Check environment variables are set correctly
4. Verify database connectivity

### Database Connection Issues

1. Verify database is running and healthy
2. Check firewall rules (Render manages automatically)
3. Verify credentials match service environment variables
4. Test connection from Render Shell:

   ```bash
   mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD
   ```

### n8n Workers Not Processing Jobs

1. Check worker logs for errors
2. Verify Redis connection
3. Ensure queue prefix matches CRM module
4. Check n8n main service is running

### High Response Times

1. Review metrics to identify bottleneck
2. Consider upgrading instance type
3. Enable auto-scaling for Pro plans
4. Optimize database queries
5. Implement caching strategies

## Backup and Recovery

### Database Backups

Render provides automatic daily backups for paid database plans:

- Retained for 7 days (Standard)
- Retained for 30 days (Pro)

Manual backups:

```bash
# Via Render Dashboard
# Database → Backups → Create Backup

# Or export via CLI
render db:backup handymate-mysql
```

### Restore from Backup

1. Go to Database → **Backups** in Dashboard
2. Select backup to restore
3. Click **Restore**

## CI/CD Integration

Render automatically deploys on git push to your main branch.

### Manual Deploys

```bash
# Via CLI
render deploy -s handymate-developer

# Via Dashboard
# Service → Manual Deploy
```

### Deploy Hooks

Configure webhooks for external CI/CD:

1. Service → **Settings** → **Deploy Hook**
2. Copy the webhook URL
3. Trigger deploys via HTTP POST:

   ```bash
   curl -X POST https://api.render.com/deploy/srv-xxx
   ```

## Environment Variables

Update environment variables:

1. Via Dashboard: Service → **Environment** → **Add Environment Variable**
2. Via `render.yaml`: Update and redeploy
3. Via CLI:

   ```bash
   render env:set -s handymate-developer APP_DEBUG=false
   ```

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Render Status Page](https://status.render.com)
- [Support Tickets](https://render.com/support)

## Additional Resources

- [Render Blueprint Specification](https://render.com/docs/blueprint-spec)
- [Render Pricing](https://render.com/pricing)
- [Render Regions](https://render.com/docs/regions)
- [Render Limits](https://render.com/docs/limits)
