# Docker Rebuild Instructions

## Issue Fixed
The L5Swagger dependency was missing because:
1. `composer install` wasn't being run in the Dockerfile
2. The docker-compose.yml uses named volumes that mount over `/var/www/html/vendor`, which override the vendor directory from the image build

## Changes Made
- Added `composer install --no-dev --no-interaction --optimize-autoloader --prefer-dist` to Dockerfile (line 83)
- Added `npm ci && npm run build` to Dockerfile (line 86)
- Must run `composer install` inside a running container to populate the shared vendor volume

## How to Rebuild and Restart

### Option 1: Full Rebuild (Recommended)
This rebuilds the image from scratch and recreates all containers:

```bash
# Stop all containers
docker-compose -f infrastructure/docker/docker-compose.yml down

# Remove the vendor volume (to ensure fresh install)
docker volume rm handymate_vendor-data

# Rebuild without cache
docker-compose -f infrastructure/docker/docker-compose.yml build --no-cache

# Start containers
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Install dependencies in the running container (required because of volume mounting)
docker exec handymate-app composer install --no-dev --no-interaction --optimize-autoloader --prefer-dist

# Restart queue containers to pick up the dependencies
docker-compose -f infrastructure/docker/docker-compose.yml restart queue queue-ml queue-ocr queue-default

# Check logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f handymate-queue-ml
```

### Option 2: Quick Rebuild
This rebuilds with cache (faster):

```bash
# Stop containers
docker-compose -f infrastructure/docker/docker-compose.yml down

# Rebuild
docker-compose -f infrastructure/docker/docker-compose.yml build

# Start containers
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Install dependencies in the running container (if vendor volume was removed)
docker exec handymate-app composer install --no-dev --no-interaction --optimize-autoloader --prefer-dist

# Restart queue containers
docker-compose -f infrastructure/docker/docker-compose.yml restart queue queue-ml queue-ocr queue-default
```

### Option 3: Manual Fix (Temporary)
If you need a quick fix without rebuilding:

```bash
# Access the container
docker exec -it handymate-queue-ml sh

# Run composer install
composer install --no-dev --optimize-autoloader

# Exit container
exit

# Restart the container
docker-compose -f infrastructure/docker/docker-compose.yml restart handymate-queue-ml
```

## Verify the Fix

After rebuilding, check that the container is running:

```bash
# Check container status
docker ps | grep handymate-queue-ml

# Check logs (should not show L5Swagger error)
docker logs handymate-queue-ml

# Or follow logs
docker logs -f handymate-queue-ml
```

You should see the queue worker running successfully without the L5Swagger error.

## If Issues Persist

1. **Check that krayin/rest-api is installed:**
   ```bash
   docker exec handymate-queue-ml composer show krayin/rest-api
   ```

2. **Check that L5Swagger is installed:**
   ```bash
   docker exec handymate-queue-ml composer show darkaonline/l5-swagger
   ```

3. **Clear Laravel cache:**
   ```bash
   docker exec handymate-queue-ml php artisan config:clear
   docker exec handymate-queue-ml php artisan cache:clear
   ```

4. **Check autoload:**
   ```bash
   docker exec handymate-queue-ml composer dump-autoload
   ```
