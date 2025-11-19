# Docker Setup Complete!

## ✅ What's Working

Your Digital Agency platform is now properly configured with:

- **PostgreSQL** database (port 5432)
- **Redis** cache/message broker (port 6379)
- **Dockerfile** for building the application
- **docker-compose.yml** with service profiles
- **Database migrations** working correctly

## 🚀 Quick Start

### Start Database Services

```bash
# Start PostgreSQL and Redis
make docker-up

# Or manually
docker-compose up -d
```

This starts only the database services (PostgreSQL and Redis), which is perfect for local development.

### Initialize Database

```bash
# Run database migrations
make migrate

# Or run full initialization (migrations + seed data)
make init-db
```

### Start Development Server

```bash
# Start the API server locally (recommended for development)
make dev

# This runs: uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Your API will be available at: http://localhost:8000

### API Documentation

Once the server is running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🐳 Docker Profiles

The docker-compose.yml uses profiles to control which services start:

### Default (Database Only)
```bash
make docker-up
# or
docker-compose up -d
```
Starts: PostgreSQL + Redis

### With API Server
```bash
make docker-up-app
# or
docker-compose --profile app up -d
```
Starts: PostgreSQL + Redis + API

### With Celery Workers
```bash
make docker-up-workers
# or
docker-compose --profile workers up -d
```
Starts: PostgreSQL + Redis + Celery Worker + Celery Beat + Flower

### Full Stack
```bash
make docker-up-full
# or
docker-compose --profile app --profile workers up -d
```
Starts: Everything (PostgreSQL + Redis + API + Celery + Flower)

## 📋 Common Commands

```bash
# View logs
make logs                    # All services
make docker-logs-api         # API only
docker-compose logs -f redis # Redis only

# Check service status
make docker-ps
docker ps

# Stop services
make docker-down

# Stop and remove volumes (⚠️ deletes data)
make docker-down-volumes

# Restart services
make docker-restart
```

## 🗄️ Database Management

```bash
# Run migrations
make migrate

# Create a new migration
make migrate-create
# Enter migration name when prompted

# Rollback last migration
make migrate-rollback

# Seed database
python scripts/seed_data.py

# Full database reset (⚠️ destroys data)
make db-reset
```

## 🛠️ Development Workflow

### Recommended Workflow

1. **Start database services**:
   ```bash
   make docker-up
   ```

2. **Run migrations**:
   ```bash
   make migrate
   ```

3. **Start development server locally**:
   ```bash
   make dev
   ```

4. **In another terminal, start Celery worker** (optional):
   ```bash
   make worker
   ```

### Why Run API Locally?

Running the API server locally (not in Docker) during development provides:
- ✅ Faster hot-reload
- ✅ Easier debugging
- ✅ Direct access to local files
- ✅ Better IDE integration

## 🔍 Troubleshooting

### Database Connection Issues

If you see "connection refused" errors:

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify .env configuration:
   ```bash
   cat .env | grep DB_
   ```

### Port Already in Use

If ports 5432 or 6379 are already in use:

1. **Option 1**: Stop the conflicting service
   ```bash
   # Find what's using the port
   netstat -ano | findstr :5432

   # Kill the process (replace PID)
   taskkill /F /PID <PID>
   ```

2. **Option 2**: Change ports in docker-compose.yml
   ```yaml
   ports:
     - "15432:5432"  # Use port 15432 instead
   ```
   Then update .env:
   ```
   DB_PORT=15432
   ```

### Unicode/Emoji Errors

If you see encoding errors with emojis:
- The migration script now handles this automatically for Windows
- If issues persist, set: `export PYTHONIOENCODING=utf-8`

## 📦 What Changed

### Files Created
1. `Dockerfile` - Container image for the application
2. `.dockerignore` - Excludes unnecessary files from builds
3. `DOCKER_SETUP.md` - This file
4. `scripts/seed_data.py` - Database seeding script

### Files Modified
1. `docker-compose.yml` - Added service profiles, fixed command paths
2. `Makefile` - New Docker commands, Windows compatibility fixes
3. `.env` - Updated with Docker database credentials
4. `scripts/migrate_db.py` - Fixed encoding, added .env loading, table creation

## 🎯 Next Steps

1. **Configure API Keys**: Edit `.env` and add your API keys:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api-xxxxx
   HUBSPOT_API_KEY=pat-na1-xxxxx
   GOOGLE_API_KEY=AIzaSyxxxxx
   ```

2. **Create Database Migrations**:
   ```bash
   make migrate-create
   # Enter: create_agents_table
   ```
   Then edit `data/migrations/TIMESTAMP_create_agents_table.sql`

3. **Test the API**:
   ```bash
   # Start services
   make docker-up
   make migrate
   make dev

   # In another terminal, test
   curl http://localhost:8000/health
   ```

4. **Deploy to Production**: See `deployment/` directory for Kubernetes/Terraform configs

## 📚 Additional Resources

- [Makefile Commands](./Makefile) - Run `make help` to see all available commands
- [Migration Guide](./MIGRATION.md) - Details about pyproject.toml migration
- [API Documentation](http://localhost:8000/docs) - Available when server is running

---

🎉 **You're all set!** Start building your AI-powered digital agency platform.
