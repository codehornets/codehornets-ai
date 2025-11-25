#!/bin/bash

# Migration script to help update services to use enhanced logging
# Usage: ./scripts/migrate-to-enhanced-logging.sh <service-name>

set -e

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <service-name>"
  echo "Example: $0 auth-service"
  exit 1
fi

SERVICE_DIR="apps/$SERVICE_NAME"

if [ ! -d "$SERVICE_DIR" ]; then
  echo "Error: Service directory $SERVICE_DIR not found"
  exit 1
fi

echo "=========================================="
echo "Enhanced Logging Migration Tool"
echo "=========================================="
echo "Service: $SERVICE_NAME"
echo ""

# Step 1: Find console.log statements
echo "[Step 1] Searching for console.log statements..."
CONSOLE_LOGS=$(find "$SERVICE_DIR/src" -name "*.ts" -exec grep -n "console\\.log\|console\\.error\|console\\.warn\|console\\.debug" {} + || true)

if [ -n "$CONSOLE_LOGS" ]; then
  echo "Found console statements that need replacement:"
  echo "$CONSOLE_LOGS"
  echo ""
else
  echo "No console statements found (or already migrated)"
  echo ""
fi

# Step 2: Check if AppLoggerService is used
echo "[Step 2] Checking for legacy logger usage..."
LEGACY_LOGGER=$(find "$SERVICE_DIR/src" -name "*.ts" -exec grep -l "AppLoggerService" {} + || true)

if [ -n "$LEGACY_LOGGER" ]; then
  echo "Found legacy AppLoggerService usage in:"
  echo "$LEGACY_LOGGER"
  echo ""
else
  echo "No legacy logger usage found"
  echo ""
fi

# Step 3: Check if EnhancedLoggerService is already used
echo "[Step 3] Checking for enhanced logger usage..."
ENHANCED_LOGGER=$(find "$SERVICE_DIR/src" -name "*.ts" -exec grep -l "EnhancedLoggerService" {} + || true)

if [ -n "$ENHANCED_LOGGER" ]; then
  echo "Enhanced logger already in use in:"
  echo "$ENHANCED_LOGGER"
  echo ""
else
  echo "Enhanced logger not yet integrated"
  echo ""
fi

# Step 4: Check main.ts for logger configuration
echo "[Step 4] Checking main.ts configuration..."
MAIN_FILE="$SERVICE_DIR/src/main.ts"

if [ -f "$MAIN_FILE" ]; then
  if grep -q "EnhancedLoggerService" "$MAIN_FILE"; then
    echo "✓ main.ts already configured with EnhancedLoggerService"
  else
    echo "✗ main.ts needs to be updated to use EnhancedLoggerService"
    echo ""
    echo "Add the following to main.ts:"
    echo "----------------------------------------"
    echo "import { EnhancedLoggerService, EnhancedLoggingInterceptor } from '@funnelagents/infrastructure';"
    echo ""
    echo "const app = await NestFactory.create(AppModule, { bufferLogs: true });"
    echo "const logger = app.get(EnhancedLoggerService);"
    echo "logger.setContext('Bootstrap');"
    echo "app.useLogger(logger);"
    echo "app.useGlobalInterceptors(new EnhancedLoggingInterceptor(logger));"
    echo "----------------------------------------"
  fi
  echo ""
else
  echo "Warning: main.ts not found at $MAIN_FILE"
  echo ""
fi

# Step 5: Check app.module.ts for logging module
echo "[Step 5] Checking app.module.ts configuration..."
APP_MODULE="$SERVICE_DIR/src/app.module.ts"

if [ -f "$APP_MODULE" ]; then
  if grep -q "EnhancedLoggingModule" "$APP_MODULE"; then
    echo "✓ app.module.ts already configured with EnhancedLoggingModule"
  else
    echo "✗ app.module.ts needs to be updated to use EnhancedLoggingModule"
    echo ""
    echo "Add the following to app.module.ts imports:"
    echo "----------------------------------------"
    echo "import { EnhancedLoggingModule } from '@funnelagents/infrastructure';"
    echo ""
    echo "@Module({"
    echo "  imports: ["
    echo "    EnhancedLoggingModule.forRoot({"
    echo "      serviceName: '$SERVICE_NAME',"
    echo "      level: process.env['LOG_LEVEL'] as any || 'info',"
    echo "      format: process.env['LOG_FORMAT'] as any || 'json',"
    echo "    }),"
    echo "    // ... other imports"
    echo "  ],"
    echo "})"
    echo "----------------------------------------"
  fi
  echo ""
else
  echo "Warning: app.module.ts not found at $APP_MODULE"
  echo ""
fi

# Step 6: Summary and recommendations
echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo ""
echo "Manual steps required:"
echo "1. Update app.module.ts to import EnhancedLoggingModule"
echo "2. Update main.ts to use EnhancedLoggerService"
echo "3. Replace AppLoggerService with EnhancedLoggerService in all services"
echo "4. Replace console.log statements with logger methods"
echo "5. Add logger.setContext() in service constructors"
echo "6. Test the service to ensure logging works correctly"
echo ""
echo "For detailed instructions, see:"
echo "  - libs/infrastructure/src/lib/logging/README.md"
echo "  - libs/infrastructure/src/lib/logging/examples/auth-service.example.ts"
echo ""
echo "After migration, update docker-compose.yml with:"
echo "  environment:"
echo "    - LOG_LEVEL=\${LOG_LEVEL:-info}"
echo "    - LOG_FORMAT=\${LOG_FORMAT:-json}"
echo ""

# Step 7: Offer to create backup
read -p "Would you like to create a backup of the current service? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  BACKUP_DIR="backups/$SERVICE_NAME-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp -r "$SERVICE_DIR/src" "$BACKUP_DIR/"
  echo "Backup created at: $BACKUP_DIR"
fi

echo ""
echo "Migration analysis complete!"
