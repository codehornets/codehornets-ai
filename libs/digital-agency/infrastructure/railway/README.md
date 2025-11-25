# HandyMate - Railway Deployment Guide

## Overview

This directory contains configuration for deploying HandyMate CRM modules to [Railway](https://railway.app), a modern platform-as-a-service that simplifies infrastructure management.

## Prerequisites

- Railway account (sign up at <https://railway.app>)
- Railway CLI installed: `npm install -g @railway/cli`
- GitHub repository (optional, for automatic deployments)

## Quick Start

### 1. Install Railway CLI

```bash
npm install -g @railway/cli

# Or using Homebrew (macOS)
brew install railway

# Verify installation
railway --version
```

### 2. Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### 3. Create a New Project

```bash
# Initialize a new Railway project
railway init

# Or link to existing project
railway link
```

### 4. Deploy Services

Railway doesn't support blueprint files like Render, so you'll need to deploy each service individually.

#### Option A: Using Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Create a new project
3. Add services from the dashboard:

**Add MySQL Database:**

- Click **+ New** → **Database** → **Add MySQL**
- Railway will provision a MySQL 8.0 instance
- Note the connection details from the **Variables** tab

**Add Redis:**

- Click **+ New** → **Database** → **Add Redis**
- Railway will provision a Redis 7 instance

**Add Each CRM Module:**

- Click **+ New** → **GitHub Repo** or **Empty Service**
- If using GitHub: Select your repository
- Configure build settings:
  - Build Command: (Docker builds automatically)
  - Dockerfile Path: `crm/developer/Dockerfile` (adjust per module)
- Add environment variables (see below)
- Deploy

#### Option B: Using Railway CLI

```bash
# Create a new project
railway init

# Add MySQL database
railway add --database mysql

# Add Redis
railway add --database redis

# Deploy each CRM module
cd crm/developer
railway up

cd ../dancer
railway up

# Repeat for all modules...
```

### 5. Configure Environment Variables

For each service, set the required environment variables via Dashboard or CLI:

```bash
# Via CLI
railway variables set APP_ENV=production
railway variables set APP_MODULE=developer
railway variables set DB_CONNECTION=mysql

# Get database connection URL
railway variables

# Set database variables (use values from MySQL service)
railway variables set DB_HOST=<mysql-host>
railway variables set DB_PORT=3306
railway variables set DB_DATABASE=handymate_developer
railway variables set DB_USERNAME=<mysql-user>
railway variables set DB_PASSWORD=<mysql-password>

# Set Redis variables
railway variables set REDIS_HOST=<redis-host>
railway variables set REDIS_PORT=6379
railway variables set REDIS_PASSWORD=<redis-password>

# Set other variables
railway variables set CACHE_DRIVER=redis
railway variables set QUEUE_CONNECTION=redis
railway variables set SESSION_DRIVER=redis
```

### 6. Create Databases

Railway creates a single MySQL instance. Create separate databases for each module:

```bash
# Connect to MySQL using Railway's connection string
# Get connection details from Railway Dashboard → MySQL service → Connect

mysql -h <host> -P <port> -u <user> -p

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

# Grant privileges (Railway user already has privileges)
```

### 7. Run Migrations

```bash
# Via Railway CLI (connect to service)
railway run php artisan migrate --force

# Or use Railway's command runner in Dashboard
# Service → Settings → Deploy → Run Command
```

## Service Configuration

### Environment Variables

Each CRM service needs these environment variables:

```env
# Application
APP_ENV=production
APP_DEBUG=false
APP_MODULE=developer  # Change per module

# Database (from Railway MySQL service)
DB_CONNECTION=mysql
DB_HOST=${{MYSQL.MYSQLHOST}}
DB_PORT=${{MYSQL.MYSQLPORT}}
DB_DATABASE=handymate_developer  # Change per module
DB_USERNAME=${{MYSQL.MYSQLUSER}}
DB_PASSWORD=${{MYSQL.MYSQLPASSWORD}}

# Redis (from Railway Redis service)
REDIS_HOST=${{REDIS.REDISHOST}}
REDIS_PORT=${{REDIS.REDISPORT}}
REDIS_PASSWORD=${{REDIS.REDISPASSWORD}}

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

Railway provides service references using the `${{SERVICE.VARIABLE}}` syntax to automatically link services.

### Dockerfile Configuration

Ensure each module has a proper Dockerfile:

```dockerfile
# Example: crm/developer/Dockerfile
FROM php:8.2-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
```

## Deploying All Modules

### Using Shell Script

Create a deployment script:

```bash
#!/bin/bash
# deploy-all-railway.sh

MODULES=("developer" "dancer" "painter" "driver" "influencer" "hunter" "seller" "trader")

for module in "${MODULES[@]}"; do
  echo "Deploying $module..."

  # Create new service
  railway service create handymate-$module

  # Link to the module directory
  cd crm/$module

  # Deploy
  railway up -s handymate-$module

  # Set environment variables
  railway variables set -s handymate-$module APP_MODULE=$module
  railway variables set -s handymate-$module DB_DATABASE=handymate_$module

  # Return to root
  cd ../..

  echo "$module deployed successfully!"
done

echo "All modules deployed!"
```

Run the script:

```bash
chmod +x deploy-all-railway.sh
./deploy-all-railway.sh
```

## Custom Domains

Configure custom domains for each service:

1. Go to service in Railway Dashboard
2. Click **Settings** → **Domains**
3. Add custom domain:
   - `developer.handymate.com`
   - `dancer.handymate.com`
   - etc.
4. Update your DNS records as shown
5. Railway automatically provisions SSL certificates

## Monitoring

### Logs

View logs for any service:

```bash
# Via CLI
railway logs

# Follow logs in real-time
railway logs --follow

# Filter by service
railway logs -s handymate-developer
```

Or view in Dashboard: Service → **Deployments** → **View Logs**

### Metrics

Railway provides built-in metrics:

- CPU usage
- Memory usage
- Network traffic
- Request count

Access via: Service → **Metrics** tab

### Observability

Railway integrates with:

- **Datadog**: For advanced monitoring
- **Sentry**: For error tracking
- **LogDNA**: For log management

Configure integrations in: Project → **Integrations**

## Scaling

### Vertical Scaling

Upgrade resources in service settings:

```bash
# Via Dashboard: Service → Settings → Resources
# Adjust CPU and Memory limits
```

### Horizontal Scaling

Railway supports horizontal scaling:

```bash
# Via Dashboard: Service → Settings → Replicas
# Or via railway.toml:
```

```toml
[deploy]
numReplicas = 3  # Run 3 instances
```

## Pricing

Railway uses a credit-based system:

- **Starter Plan**: $5/month for hobbyists
- **Developer Plan**: $20/month
- **Team Plan**: $20/user/month

Resources are billed based on:

- vCPU hours
- Memory (GB-hours)
- Network egress

Calculator: <https://railway.app/pricing>

## Backup and Recovery

### Database Backups

**Manual Backup:**

```bash
# Export database
railway connect mysql
mysqldump handymate_developer > backup.sql
```

**Automated Backups:**
Railway Pro plan includes automated daily backups.

### Restore from Backup

```bash
# Import backup
railway connect mysql
mysql handymate_developer < backup.sql
```

## CI/CD Integration

### GitHub Integration

Railway automatically deploys on git push when connected to GitHub:

1. Link service to GitHub repository
2. Select branch (main/master)
3. Configure build settings
4. Push to trigger deployment

### Manual Deployments

```bash
# Deploy current directory
railway up

# Deploy specific service
railway up -s handymate-developer
```

### Deploy Hooks

Trigger deployments via webhook:

1. Service → **Settings** → **Webhooks**
2. Copy webhook URL
3. Trigger via HTTP POST:

   ```bash
   curl -X POST https://backboard.railway.app/v1/webhooks/...
   ```

## Troubleshooting

### Build Failures

1. Check build logs in Dashboard
2. Verify Dockerfile syntax
3. Test build locally:

   ```bash
   docker build -t test -f crm/developer/Dockerfile crm/developer
   ```

### Service Not Starting

1. Check deployment logs
2. Verify environment variables
3. Check health check endpoint
4. Review resource limits

### Database Connection Issues

1. Verify database service is running
2. Check connection variables
3. Test connection:

   ```bash
   railway run -- mysql -h $DB_HOST -u $DB_USERNAME -p
   ```

### High Costs

1. Review metrics for resource usage
2. Optimize application performance
3. Reduce number of replicas if possible
4. Consider using sleep mode for dev environments

## Advanced Configuration

### Private Networking

Services in the same project can communicate via private networking:

```env
# Reference other services
DATABASE_URL=${{MySQL.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

### Cron Jobs

Add cron jobs using Railway's cron service:

```toml
[deploy]
cronSchedule = "0 0 * * *"  # Daily at midnight
startCommand = "php artisan schedule:run"
```

### Environment Groups

Create environment groups for shared variables:

1. Project → **Variables** → **New Group**
2. Add shared variables (API keys, etc.)
3. Link group to services

## Migration from Other Platforms

### From Heroku

Railway provides a Heroku import tool:

```bash
railway login
railway heroku-import
```

### From Docker Compose

Convert docker-compose.yml to Railway services:

1. Create service for each container
2. Set environment variables
3. Configure networking between services

## Support Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Blog](https://blog.railway.app)
- [Railway Status](https://status.railway.app)
- [Railway Community Forum](https://help.railway.app)

## Best Practices

1. **Use environment variable references** to link services
2. **Enable auto-deploy** from your main branch
3. **Configure health checks** for automatic restarts
4. **Set resource limits** to control costs
5. **Use Railway's private networking** for inter-service communication
6. **Enable automatic backups** for databases (Pro plan)
7. **Monitor metrics** regularly to optimize performance
8. **Use PR deploys** for testing changes before merging
9. **Configure custom domains** with SSL
10. **Implement proper logging** for debugging

## Example: Complete Developer CRM Deployment

```bash
# 1. Create and link project
railway init

# 2. Add databases
railway add --database mysql
railway add --database redis

# 3. Create developer service
railway service create handymate-developer

# 4. Deploy from developer directory
cd crm/developer
railway up -s handymate-developer

# 5. Set environment variables
railway variables set -s handymate-developer \
  APP_ENV=production \
  APP_MODULE=developer \
  DB_CONNECTION=mysql \
  DB_DATABASE=handymate_developer \
  CACHE_DRIVER=redis \
  QUEUE_CONNECTION=redis

# 6. Link database services
railway variables set -s handymate-developer \
  DB_HOST='${{MySQL.MYSQLHOST}}' \
  DB_PORT='${{MySQL.MYSQLPORT}}' \
  DB_USERNAME='${{MySQL.MYSQLUSER}}' \
  DB_PASSWORD='${{MySQL.MYSQLPASSWORD}}'

railway variables set -s handymate-developer \
  REDIS_HOST='${{Redis.REDISHOST}}' \
  REDIS_PORT='${{Redis.REDISPORT}}' \
  REDIS_PASSWORD='${{Redis.REDISPASSWORD}}'

# 7. Run migrations
railway run -s handymate-developer php artisan migrate --force

# 8. Add custom domain
railway domain -s handymate-developer developer.handymate.com

echo "Developer CRM deployed successfully!"
```

## Next Steps

After deploying all services:

1. Configure custom domains for all modules
2. Set up monitoring and alerting
3. Configure database backups
4. Implement CI/CD pipeline
5. Add health check endpoints
6. Configure auto-scaling rules
7. Set up error tracking (Sentry)
8. Implement logging aggregation
9. Configure CDN for static assets
10. Review and optimize costs
