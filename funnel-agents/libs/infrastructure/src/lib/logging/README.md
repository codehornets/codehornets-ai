# Enhanced Logging Infrastructure

Comprehensive centralized logging system for all FunnelAgents microservices using Pino for high-performance structured logging.

## Features

- **Structured Logging**: JSON format for production, pretty format for development
- **Correlation ID Tracking**: Automatically tracks requests across all services
- **Request/Response Logging**: Automatic HTTP request and response logging with sanitization
- **Performance Monitoring**: Built-in performance tracking and slow request detection
- **Security**: Automatic sanitization of sensitive data (passwords, tokens, etc.)
- **Log Aggregation Support**: Compatible with ELK Stack, CloudWatch, Datadog, and more
- **Method Decorators**: Easy performance tracking with `@LogMethod()` decorator
- **Audit Logging**: Built-in audit trail for compliance
- **Multi-Context Support**: Works with HTTP, RPC, and background jobs

## Quick Start

### 1. Install Enhanced Logging Module

```typescript
// apps/your-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { EnhancedLoggingModule } from '@funnelagents/infrastructure';

@Module({
  imports: [
    EnhancedLoggingModule.forRoot({
      serviceName: 'your-service',
      level: process.env.LOG_LEVEL as any || 'info',
      format: process.env.LOG_FORMAT as any || 'json',
    }),
    // ... other imports
  ],
})
export class AppModule {}
```

### 2. Update Bootstrap to Use Enhanced Logger

```typescript
// apps/your-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnhancedLoggerService, EnhancedLoggingInterceptor } from '@funnelagents/infrastructure';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is attached
  });

  // Get the enhanced logger service
  const logger = app.get(EnhancedLoggerService);
  logger.setContext('Bootstrap');

  // Use enhanced logger for application
  app.useLogger(logger);

  // Add global interceptor for automatic request/response logging
  app.useGlobalInterceptors(new EnhancedLoggingInterceptor(logger));

  const port = process.env.YOUR_SERVICE_PORT || 3000;
  await app.listen(port);

  logger.log(`Service started on port ${port}`);
}

bootstrap();
```

### 3. Use Logger in Your Services

```typescript
import { Injectable } from '@nestjs/common';
import { EnhancedLoggerService } from '@funnelagents/infrastructure';

@Injectable()
export class YourService {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger.setContext('YourService');
  }

  async doSomething(data: any) {
    this.logger.log('Processing request', { data });

    try {
      // Your logic here
      const result = await this.process(data);

      this.logger.log('Request processed successfully', { result });
      return result;
    } catch (error) {
      this.logger.error('Request failed', error, { data });
      throw error;
    }
  }
}
```

## Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Logging Configuration
LOG_LEVEL=info          # error | warn | info | debug | trace
LOG_FORMAT=json         # json | pretty
NODE_ENV=production     # development | production | test
APP_VERSION=1.0.0       # Application version for log metadata
```

### Log Levels

- **error**: Only errors (use in production with external monitoring)
- **warn**: Warnings and errors
- **info**: Info, warnings, and errors (recommended for production)
- **debug**: Debug, info, warnings, and errors (recommended for development)
- **trace**: All logs including verbose trace information (use for troubleshooting)

### Log Formats

- **json**: Structured JSON format (recommended for production)
  - Compatible with log aggregation tools
  - Machine-readable
  - Includes all metadata

- **pretty**: Human-readable colored format (recommended for development)
  - Colored output
  - Timestamp formatting
  - Easy to read in terminal

## API Reference

### EnhancedLoggerService

#### Basic Logging Methods

```typescript
// Informational messages
logger.log('User logged in', { userId: '123', email: 'user@example.com' });

// Error messages with stack traces
logger.error('Database connection failed', error, { operation: 'connect' });

// Warning messages
logger.warn('Rate limit approaching', { remaining: 10, limit: 100 });

// Debug messages (only in debug/trace levels)
logger.debug('Cache hit', { key: 'user:123', ttl: 3600 });

// Verbose trace messages (only in trace level)
logger.verbose('Processing step 1 of 5', { step: 1, total: 5 });

// Fatal errors (typically exits process)
logger.fatal('Critical system failure', { reason: 'Out of memory' });
```

#### Performance Tracking

```typescript
// Option 1: Using startOperation (recommended)
async function processData() {
  const endOperation = logger.startOperation('processData');

  try {
    // Your logic here
    const result = await heavyOperation();
    return result;
  } finally {
    endOperation(); // Automatically logs duration
  }
}

// Option 2: Manual performance logging
const startTime = Date.now();
const result = await operation();
const duration = Date.now() - startTime;
logger.logPerformance('operation', duration, { recordCount: result.length });
```

#### Database Query Logging

```typescript
const startTime = Date.now();
const results = await db.query('SELECT * FROM users WHERE active = $1', [true]);
const duration = Date.now() - startTime;

logger.logQuery('SELECT * FROM users WHERE active = $1', duration, {
  rowCount: results.length,
  slow: duration > 100,
});
```

#### HTTP Client Request Logging

```typescript
const startTime = Date.now();
const response = await httpClient.post('/api/endpoint', data);
const duration = Date.now() - startTime;

logger.logHttpRequest('POST', '/api/endpoint', response.status, duration, {
  responseSize: response.data.length,
});
```

#### Audit Logging

```typescript
// Log business events for compliance
logger.logAuditEvent(
  'user_updated',              // event name
  'update',                    // action (create, read, update, delete)
  'user',                      // resource type
  userId,                      // resource ID
  {
    changes: { email: 'new@example.com' },
    ip: req.ip,
  }
);
```

#### Security Event Logging

```typescript
logger.logSecurityEvent(
  'Failed login attempt',
  'medium',                    // severity: low | medium | high | critical
  {
    email: 'attacker@example.com',
    ip: '192.168.1.100',
    attempts: 5,
  }
);
```

#### Integration Logging

```typescript
const startTime = Date.now();
try {
  const result = await callThirdPartyAPI();
  const duration = Date.now() - startTime;

  logger.logIntegration('stripe', 'create_payment', true, duration, {
    paymentId: result.id,
  });
} catch (error) {
  const duration = Date.now() - startTime;

  logger.logIntegration('stripe', 'create_payment', false, duration, {
    error: error.message,
  });
}
```

### Method Decorators

Use `@LogMethod()` decorator to automatically log method execution:

```typescript
import { Injectable } from '@nestjs/common';
import { EnhancedLoggerService, LogMethod } from '@funnelagents/infrastructure';

@Injectable()
export class UserService {
  constructor(private readonly logger: EnhancedLoggerService) {
    this.logger.setContext('UserService');
  }

  @LogMethod({ slowThreshold: 500 })  // Warn if method takes > 500ms
  async createUser(data: CreateUserDto) {
    // Method implementation
    // Automatically logs:
    // - Method start (debug level)
    // - Method completion with duration (debug level)
    // - Slow execution warnings (warn level)
    // - Method errors with stack traces (error level)
  }
}
```

### Correlation ID Tracking

Correlation IDs are automatically tracked across all requests:

```typescript
import { getCorrelationId, getRequestId, getRequestContext } from '@funnelagents/infrastructure';

// Get correlation ID from anywhere in the request lifecycle
const correlationId = getCorrelationId();

// Get request ID
const requestId = getRequestId();

// Get full request context
const context = getRequestContext();
// Returns: { correlationId, requestId, userId, userEmail, method, url, ip, userAgent }

// Set custom context values
import { setContextValue, getContextValue } from '@funnelagents/infrastructure';
setContextValue('orderId', '12345');
const orderId = getContextValue('orderId');
```

### Passing Correlation IDs Between Services

When making HTTP requests to other services, pass the correlation ID:

```typescript
import { HttpService } from '@nestjs/axios';
import { getCorrelationId } from '@funnelagents/infrastructure';

const correlationId = getCorrelationId();

await this.httpService.post('http://other-service/api/endpoint', data, {
  headers: {
    'X-Correlation-Id': correlationId,
  },
}).toPromise();
```

## Log Output Examples

### JSON Format (Production)

```json
{
  "timestamp": "2025-11-25T10:30:45.123Z",
  "level": "info",
  "context": "AuthService",
  "message": "User logged in",
  "correlationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "requestId": "req-12345",
  "userId": "user-123",
  "userEmail": "user@example.com",
  "method": "POST",
  "url": "/auth/login",
  "ip": "192.168.1.100",
  "serviceName": "auth-service",
  "environment": "production",
  "version": "1.0.0"
}
```

### Pretty Format (Development)

```
2025-11-25 10:30:45.123 INFO    [AuthService] User logged in
  correlationId: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  requestId: req-12345
  userId: user-123
  userEmail: user@example.com
```

## Sensitive Data Sanitization

The logging system automatically redacts sensitive fields:

```typescript
// These fields are automatically redacted:
const SENSITIVE_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
];

// Example:
logger.log('User data', {
  email: 'user@example.com',
  password: 'secret123',  // Will be logged as '[REDACTED]'
});
```

## Log Aggregation Integration

### ELK Stack (Elasticsearch, Logstash, Kibana)

The JSON log format is compatible with ELK stack. Use Filebeat or Logstash to ship logs:

```yaml
# filebeat.yml
filebeat.inputs:
  - type: docker
    containers.ids: '*'
    processors:
      - add_docker_metadata: ~

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "funnel-agents-%{+yyyy.MM.dd}"
```

### AWS CloudWatch

Configure Docker logging driver in `docker-compose.yml`:

```yaml
logging:
  driver: "awslogs"
  options:
    awslogs-region: "us-east-1"
    awslogs-group: "funnel-agents"
    awslogs-stream: "auth-service"
```

### Datadog

Install Datadog agent and configure:

```yaml
logging:
  driver: "json-file"
  options:
    labels: "service,environment"

labels:
  - "service=auth-service"
  - "environment=production"
```

## Docker Logging Configuration

See `/infrastructure/docker/logging-config-template.yml` for complete Docker logging configuration examples.

Add to each service in `docker-compose.yml`:

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
        labels: "service,environment"

    labels:
      - "service=your-service"
      - "environment=${NODE_ENV:-development}"
```

## Migration from Legacy Logger

### Step 1: Update Module Import

Replace:
```typescript
import { LoggingModule } from '@funnelagents/infrastructure';
```

With:
```typescript
import { EnhancedLoggingModule } from '@funnelagents/infrastructure';
```

### Step 2: Update Service Injection

Replace:
```typescript
constructor(private readonly logger: AppLoggerService)
```

With:
```typescript
constructor(private readonly logger: EnhancedLoggerService)
```

### Step 3: Replace console.log Statements

Find and replace all `console.log` statements:

```typescript
// Before
console.log('User created:', user);

// After
this.logger.log('User created', { user });
```

### Step 4: Add Context

Set context in service constructors:

```typescript
constructor(private readonly logger: EnhancedLoggerService) {
  this.logger.setContext('YourService');
}
```

## Best Practices

1. **Always set context**: Call `logger.setContext('ServiceName')` in constructor
2. **Use structured metadata**: Pass objects instead of string concatenation
3. **Choose appropriate log levels**: Don't log everything as `info`
4. **Include correlation IDs**: Always pass correlation IDs between services
5. **Sanitize user data**: Never log sensitive information
6. **Log performance metrics**: Track slow operations
7. **Use audit logging**: Log all security-relevant events
8. **Monitor log volume**: Use appropriate log levels in production

## Troubleshooting

### Logs not appearing

1. Check LOG_LEVEL environment variable
2. Verify logger is properly injected
3. Ensure context is set
4. Check Docker logging driver configuration

### Performance issues

1. Reduce LOG_LEVEL in production (use 'info' or 'warn')
2. Use LOG_FORMAT=json in production
3. Configure log rotation in Docker
4. Review slow request thresholds

### Correlation IDs not working

1. Verify CorrelationIdMiddleware is registered
2. Check that EnhancedLoggingModule is imported first
3. Ensure correlation ID header is passed between services

## Examples

See `/libs/infrastructure/src/lib/logging/examples/` for complete integration examples:

- `auth-service.example.ts` - Full service integration example
- `http-client.example.ts` - HTTP client logging example

## Support

For issues or questions, please refer to the main FunnelAgents documentation or create an issue in the project repository.
