# CRM Service - Quick Start Guide

This guide will help you get the CRM Service up and running quickly.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 12+
- (Optional) Docker and Docker Compose

## Option 1: Local Development (without Docker)

### 1. Install Dependencies

```bash
# From the project root
npm install
```

### 2. Setup Database

Create a PostgreSQL database:

```bash
createdb funnel_agents_crm
```

Or use psql:

```sql
CREATE DATABASE funnel_agents_crm;
```

### 3. Run Migrations

```bash
# From the project root
psql postgresql://user:password@localhost:5432/funnel_agents_crm -f apps/crm-service/migrations/001_initial_schema.sql
```

Or use the Makefile:

```bash
cd apps/crm-service
make db-setup
```

### 4. Configure Environment

Copy the example environment file:

```bash
cp apps/crm-service/.env.example apps/crm-service/.env
```

Edit `.env` and update the `DATABASE_URL` with your PostgreSQL credentials.

### 5. Run the Service

```bash
# From the project root
npm run serve crm-service
# or
npx nx serve crm-service

# Or using the Makefile
cd apps/crm-service
make dev
```

The service will start on `http://localhost:3002` (TCP microservice).

## Option 2: Using Docker Compose

### 1. Start All Services

```bash
cd apps/crm-service
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- CRM Service on port 3002

### 2. View Logs

```bash
docker-compose logs -f crm-service
```

### 3. Stop Services

```bash
docker-compose down
```

### 4. Stop Services and Remove Data

```bash
docker-compose down -v
```

## Option 3: With pgAdmin (Database Management UI)

Start with pgAdmin:

```bash
cd apps/crm-service
docker-compose --profile tools up -d
```

Access pgAdmin at `http://localhost:5050`:
- Email: admin@funnelagents.local
- Password: admin

Add a new server:
- Host: postgres
- Port: 5432
- Username: funnelagents
- Password: funnelagents_dev
- Database: funnel_agents_crm

## Testing the Service

### 1. Run Tests

```bash
# From the project root
npm run test crm-service

# Or with coverage
npx nx test crm-service --coverage

# Or using the Makefile
cd apps/crm-service
make test
```

### 2. Test with API Gateway

You'll need to configure the API Gateway to connect to this service. See the `examples/api-gateway-integration.example.ts` file for integration examples.

## Common Tasks

### View Database Tables

```bash
psql postgresql://funnelagents:funnelagents_dev@localhost:5432/funnel_agents_crm

# List tables
\dt

# Describe a table
\d workspaces

# Query data
SELECT * FROM workspaces;
```

### Reset Database

```bash
cd apps/crm-service
make db-reset
```

### Lint Code

```bash
cd apps/crm-service
make lint

# Auto-fix issues
make lint-fix
```

### Format Code

```bash
cd apps/crm-service
make format
```

## Verification

Once the service is running, you should see:

```
[Nest] INFO [CrmService] CRM Service is listening on port 3002
```

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   pg_isready
   ```

2. Check your DATABASE_URL in .env

3. Ensure the database exists:
   ```bash
   psql -l | grep funnel_agents
   ```

### Port Already in Use

If port 3002 is already in use, change `CRM_SERVICE_PORT` in your `.env` file.

### TypeORM Sync Issues

In development, TypeORM synchronization is enabled. If you have schema issues:

1. Drop and recreate the database:
   ```bash
   dropdb funnel_agents_crm
   createdb funnel_agents_crm
   ```

2. Run migrations again:
   ```bash
   make db-setup
   ```

### Docker Issues

1. Check container logs:
   ```bash
   docker-compose logs crm-service
   ```

2. Restart containers:
   ```bash
   docker-compose restart
   ```

3. Rebuild containers:
   ```bash
   docker-compose up -d --build
   ```

## Next Steps

1. Review the [README.md](./README.md) for detailed documentation
2. Check [examples/api-gateway-integration.example.ts](./examples/api-gateway-integration.example.ts) for API Gateway integration
3. Explore the entity files in `src/*/` directories
4. Write your first integration with the API Gateway

## Support

For issues and questions, please refer to the main project documentation or create an issue in the repository.
