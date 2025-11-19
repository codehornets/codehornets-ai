# Database & Worker Configuration

## Overview

This Docker setup configures separate MySQL databases for each CRM application within the HandyMate project:

- **handymate_developer** - Database for the Developer CRM
- **handymate_dancer** - Database for the Dancer CRM
- **handymate_painter** - Database for the Painter CRM
- **handymate_driver** - Database for the Driver CRM
- **handymate_influencer** - Database for the Influencer CRM
- **handymate_hunter** - Database for the Hunter CRM
- **handymate_seller** - Database for the seller CRM
- **handymate_trader** - Database for the Trader CRM
- **handymate_n8n** - Database for n8n workflow automation (shared by all workers)

## Database Structure

Each application connects to its own isolated database:

| Service | Database Name | Environment Variable |
|---------|---------------|---------------------|
| Developer | handymate_developer | DB_DATABASE_DEVELOPER |
| Dancer | handymate_dancer | DB_DATABASE_DANCER |
| Painter | handymate_painter | DB_DATABASE_PAINTER |
| Driver | handymate_driver | DB_DATABASE_DRIVER |
| Influencer | handymate_influencer | DB_DATABASE_INFLUENCER |
| Hunter | handymate_hunter | DB_DATABASE_HUNTER |
| seller | handymate_seller | DB_DATABASE_seller |
| Trader | handymate_trader | DB_DATABASE_TRADER |
| n8n | handymate_n8n | N8N_DB_DATABASE |

## Configuration

### Environment Variables

Copy the `.env.example` file to `.env` and adjust as needed:

```bash
cd infrastructure/docker
cp .env.example .env
```

Key database environment variables:

- `DB_USERNAME` - MySQL user (default: handymate)
- `DB_PASSWORD` - MySQL password (default: secret)
- `MYSQL_ROOT_PASSWORD` - MySQL root password (default: root)
- `DB_DATABASE_DEVELOPER` - Developer database name (default: handymate_developer)
- `DB_DATABASE_DANCER` - Dancer database name (default: handymate_dancer)
- `DB_DATABASE_PAINTER` - Painter database name (default: handymate_painter)
- `DB_DATABASE_DRIVER` - Driver database name (default: handymate_driver)
- `DB_DATABASE_INFLUENCER` - Influencer database name (default: handymate_influencer)
- `DB_DATABASE_HUNTER` - Hunter database name (default: handymate_hunter)
- `DB_DATABASE_seller` - seller database name (default: handymate_seller)
- `DB_DATABASE_TRADER` - Trader database name (default: handymate_trader)
- `N8N_DB_DATABASE` - n8n database name (default: handymate_n8n)

### Database Initialization

The MySQL container automatically creates all required databases on first run using the initialization script:

`infrastructure/docker/mysql/init/01-create-databases.sql`

This script:

1. Creates all CRM application databases (8 total) plus the n8n database
2. Grants full privileges to the `handymate` user on each database
3. Runs only once when the MySQL container is first initialized

## Starting the Infrastructure

```bash
# From the project root
make infra-up

# Or using docker-compose directly
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

## Resetting Databases

To recreate all databases from scratch:

```bash
# Stop containers
make infra-down

# Remove MySQL data volume
docker volume rm handymate_mysql-data

# Start containers (will reinitialize databases)
make infra-up
```

## Running Migrations

Each application must run its own migrations:

```bash
# Individual migrations
docker-compose -f infrastructure/docker/docker-compose.yml exec developer php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec dancer php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec painter php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec driver php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec influencer php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec hunter php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec seller php artisan migrate
docker-compose -f infrastructure/docker/docker-compose.yml exec trader php artisan migrate

# Or use Makefile shortcuts
make migrate-all  # Migrate all databases at once
```

## Accessing Databases

### From Host Machine

```bash
mysql -h 127.0.0.1 -P 3306 -u handymate -p
# Enter password: secret
USE handymate_dancer;
```

### From Container

```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec mysql mysql -u handymate -p
```

## n8n Worker Configuration

Each CRM application has its own dedicated n8n worker that processes workflow executions independently:

| Worker | Container Name | Queue Prefix | Log Location |
|--------|----------------|--------------|--------------|
| Developer Worker | handymate-n8n-worker-developer | n8n:developer | storage/logs/n8n/developer |
| Dancer Worker | handymate-n8n-worker-dancer | n8n:dancer | storage/logs/n8n/dancer |
| Painter Worker | handymate-n8n-worker-painter | n8n:painter | storage/logs/n8n/painter |
| Driver Worker | handymate-n8n-worker-driver | n8n:driver | storage/logs/n8n/driver |
| Influencer Worker | handymate-n8n-worker-influencer | n8n:influencer | storage/logs/n8n/influencer |
| Hunter Worker | handymate-n8n-worker-hunter | n8n:hunter | storage/logs/n8n/hunter |
| seller Worker | handymate-n8n-worker-seller | n8n:seller | storage/logs/n8n/seller |
| Trader Worker | handymate-n8n-worker-trader | n8n:trader | storage/logs/n8n/trader |

### Worker Architecture

- **Main n8n Service**: Provides the UI and API on port 5678
- **App-Specific Workers**: Process workflow executions for their respective CRM apps
- **Queue Isolation**: Each worker uses a unique Redis queue prefix to isolate workflows
- **Shared Database**: All workers share the same `handymate_n8n` database for workflow definitions

### Managing n8n Workers

```bash
# Start all workers
make n8n-workers-up

# Stop all workers
make n8n-workers-down

# View all worker logs
make n8n-workers-logs

# Restart all workers
make n8n-workers-restart

# Individual worker management
make n8n-worker-developer-up
make n8n-worker-developer-logs
make n8n-worker-dancer-up
make n8n-worker-dancer-logs
make n8n-worker-painter-up
make n8n-worker-painter-logs
make n8n-worker-driver-up
make n8n-worker-driver-logs
make n8n-worker-influencer-up
make n8n-worker-influencer-logs
make n8n-worker-hunter-up
make n8n-worker-hunter-logs
make n8n-worker-seller-up
make n8n-worker-seller-logs
make n8n-worker-trader-up
make n8n-worker-trader-logs
```

### Worker Environment Variables

Each worker has metadata to identify which app it serves:

- `WORKER_APP`: The CRM app name (developer, dancer, painter, driver, influencer, hunter, seller, or trader)
- `WORKER_ID`: Unique identifier for the worker instance
- `QUEUE_BULL_PREFIX`: Redis queue prefix for isolation

These can be used in n8n workflows to route executions to specific workers.

## Troubleshooting

### Database Already Exists Error

If you get an error about databases already existing, the init script has already run. To recreate:

1. Stop containers: `make infra-down`
2. Remove volume: `docker volume rm handymate_mysql-data`
3. Restart: `make infra-up`

### Connection Refused

Check that MySQL is healthy:

```bash
docker-compose -f infrastructure/docker/docker-compose.yml ps mysql
```

Wait for the healthcheck to pass before running migrations.

### Wrong Database Selected

Each service automatically uses its configured database through environment variables. Verify in `.env` or check running containers:

```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec developer env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec dancer env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec painter env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec driver env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec influencer env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec hunter env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec seller env | grep DB_DATABASE
docker-compose -f infrastructure/docker/docker-compose.yml exec trader env | grep DB_DATABASE
```

### n8n Worker Not Processing Jobs

Check worker status and logs:

```bash
# Check if workers are running
docker-compose -f infrastructure/docker/docker-compose.yml ps | grep n8n-worker

# View specific worker logs
make n8n-worker-developer-logs
make n8n-worker-dancer-logs
make n8n-worker-painter-logs
make n8n-worker-driver-logs
make n8n-worker-influencer-logs
make n8n-worker-hunter-logs
make n8n-worker-seller-logs
make n8n-worker-trader-logs
```

Verify the queue prefix in your n8n workflows matches the worker:

- Developer workflows should use queue prefix: `n8n:developer`
- Dancer workflows should use queue prefix: `n8n:dancer`
- Painter workflows should use queue prefix: `n8n:painter`
- Driver workflows should use queue prefix: `n8n:driver`
- Influencer workflows should use queue prefix: `n8n:influencer`
- Hunter workflows should use queue prefix: `n8n:hunter`
- seller workflows should use queue prefix: `n8n:seller`
- Trader workflows should use queue prefix: `n8n:trader`
