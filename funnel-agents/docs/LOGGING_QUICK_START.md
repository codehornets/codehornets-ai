# Enhanced Logging - Quick Start Guide

This guide helps you quickly integrate the enhanced logging infrastructure into any FunnelAgents microservice.

## Prerequisites

All logging dependencies are already installed:
- `pino`, `pino-pretty`, `nestjs-pino`, `pino-http`, `uuid`

## 5-Minute Integration

### Step 1: Update app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { EnhancedLoggingModule } from '@funnelagents/infrastructure';

@Module({
  imports: [
    // Add as FIRST import (before other modules)
    EnhancedLoggingModule.forRoot({
      serviceName: 'your-service',  // Change to your service name
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

### Step 2: Update main.ts

Replace your bootstrap function with this:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnhancedLoggerService, EnhancedLoggingInterceptor } from '@funnelagents/infrastructure';

async function bootstrap() {
  // Create app with buffered logs
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Get enhanced logger
  const logger = app.get(EnhancedLoggerService);
  logger.setContext('Bootstrap');

  // Use enhanced logger
  app.useLogger(logger);

  // Add global logging interceptor
  app.useGlobalInterceptors(new EnhancedLoggingInterceptor(logger));

  // ... rest of your bootstrap code

  const port = process.env.YOUR_SERVICE_PORT || 3000;
  await app.listen(port);

  logger.log(`Service started on port ${port}`);
}

bootstrap();
```

### Step 3: Update Your Services

In any service that needs logging:

```typescript
import { Injectable } from '@nestjs/common';
import { EnhancedLoggerService } from '@funnelagents/infrastructure';

@Injectable()
export class YourService {
  constructor(private readonly logger: EnhancedLoggerService) {
    // Set context to service name
    this.logger.setContext('YourService');
  }

  async yourMethod() {
    // Use logger instead of console.log
    this.logger.log('Processing request');

    try {
      // Your logic
      return result;
    } catch (error) {
      this.logger.error('Request failed', error);
      throw error;
    }
  }
}
```

### Step 4: Update Environment Variables

Add to your `.env` file:

```bash
LOG_LEVEL=info
LOG_FORMAT=json
```

For development, use:

```bash
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

### Step 5: Test It

Start your service and verify logging works:

```bash
npm run serve:your-service
```

You should see structured logs with correlation IDs.

## Common Use Cases

### Basic Logging

```typescript
// Info logs
this.logger.log('User created', { userId: user.id });

// Error logs
this.logger.error('Database error', error, { query: 'SELECT ...' });

// Warning logs
this.logger.warn('Rate limit approaching', { remaining: 10 });

// Debug logs (only in debug/trace levels)
this.logger.debug('Cache hit', { key: 'user:123' });
```

### Performance Tracking

```typescript
async function processData() {
  const endOperation = this.logger.startOperation('processData');

  try {
    // Your logic
    const result = await heavyOperation();
    return result;
  } finally {
    endOperation(); // Logs duration automatically
  }
}
```

### Audit Logging

```typescript
this.logger.logAuditEvent(
  'user_updated',
  'update',
  'user',
  userId,
  { changes: { email: newEmail } }
);
```

### Security Events

```typescript
this.logger.logSecurityEvent(
  'Failed login attempt',
  'medium',
  { email, ip: req.ip, attempts: 5 }
);
```

## Migration from console.log

### Find and Replace

Use the migration script:

```bash
./scripts/migrate-to-enhanced-logging.sh your-service
```

Or manually replace:

```typescript
// Before
console.log('User created:', user);

// After
this.logger.log('User created', { user });
```

```typescript
// Before
console.error('Error:', error);

// After
this.logger.error('Operation failed', error);
```

## Docker Configuration

Update `docker-compose.yml` for your service:

```yaml
services:
  your-service:
    environment:
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - LOG_FORMAT=${LOG_FORMAT:-json}

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

    labels:
      - "service=your-service"
      - "environment=${NODE_ENV:-development}"
```

## Passing Correlation IDs Between Services

When calling other services:

```typescript
import { HttpService } from '@nestjs/axios';
import { getCorrelationId } from '@funnelagents/infrastructure';

const correlationId = getCorrelationId();

await this.httpService.post('http://other-service/api', data, {
  headers: {
    'X-Correlation-Id': correlationId,
  },
}).toPromise();
```

## Environment Variables Reference

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LOG_LEVEL` | error, warn, info, debug, trace | info | Log verbosity level |
| `LOG_FORMAT` | json, pretty | json | Log output format |
| `NODE_ENV` | development, production, test | development | Environment mode |
| `APP_VERSION` | Any string | 1.0.0 | Application version |

## Troubleshooting

### Logs not appearing

1. Check `LOG_LEVEL` is not set to `error` only
2. Verify logger is injected in constructor
3. Ensure `setContext()` is called
4. Check service is using `EnhancedLoggingModule`

### Correlation IDs missing

1. Verify `EnhancedLoggingModule` is imported first
2. Check middleware is registered (automatic with module)
3. Ensure you're passing headers between services

### Too many logs

1. Increase `LOG_LEVEL` to `warn` or `error`
2. Use `LOG_FORMAT=json` in production
3. Configure Docker log rotation

## Next Steps

1. **Read Full Documentation**: `libs/infrastructure/src/lib/logging/README.md`
2. **See Examples**: `libs/infrastructure/src/lib/logging/examples/`
3. **Set Up Log Aggregation**: ELK, CloudWatch, or Datadog
4. **Create Dashboards**: Monitor logs and metrics
5. **Set Up Alerts**: Alert on errors and security events

## Support

For detailed documentation and advanced features, see:
- Full README: `/libs/infrastructure/src/lib/logging/README.md`
- Implementation Report: `/LOGGING_IMPLEMENTATION_REPORT.md`
- Docker Config: `/infrastructure/docker/logging-config-template.yml`

## Checklist

- [ ] Updated app.module.ts with EnhancedLoggingModule
- [ ] Updated main.ts to use EnhancedLoggerService
- [ ] Replaced AppLoggerService with EnhancedLoggerService
- [ ] Replaced console.log with logger methods
- [ ] Added setContext() in service constructors
- [ ] Added LOG_LEVEL and LOG_FORMAT to .env
- [ ] Updated docker-compose.yml with logging config
- [ ] Tested correlation ID tracking
- [ ] Verified logs appear in correct format
- [ ] Tested error logging with stack traces

---

**That's it!** Your service now has comprehensive structured logging with correlation ID tracking, automatic request/response logging, and sensitive data sanitization.
