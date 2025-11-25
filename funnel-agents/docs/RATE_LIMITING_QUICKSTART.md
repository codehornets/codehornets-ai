# Rate Limiting Quick Start Guide

## Summary

Rate limiting has been successfully implemented across all 11 backend services. Each service now protects its endpoints from abuse with configurable rate limits.

## What Was Implemented

### 1. Core Rate Limiting Module
- **Location**: `/libs/shared/src/rate-limiting/`
- **Files**:
  - `throttler.config.ts` - Rate limit configurations
  - `custom-throttler.guard.ts` - Enhanced guards with better error messages
  - `index.ts` - Export file

### 2. Default Rate Limits
- **Global Default**: 100 requests per minute
- **Auth Login**: 10 requests per minute
- **Auth Register**: 10 requests per minute
- **Password Reset**: 5 requests per hour
- **Public Endpoints**: 60 requests per minute

### 3. Services Updated
All 11 services now have rate limiting:
1. API Gateway
2. Auth Service (with strict limits)
3. CRM Service
4. Agents Service
5. Campaigns Service
6. Automations Service
7. Reports Service
8. Tasks Service
9. Content Service
10. Scheduler Service
11. Worker Runner Service

## Quick Test

### Test Rate Limiting

```bash
# Test default rate limit (should block after 100 requests)
for i in {1..105}; do
  echo "Request $i"
  curl -s http://localhost:3000/api/health | jq .
  sleep 0.1
done

# Test auth rate limit (should block after 10 requests)
for i in {1..12}; do
  echo "Login attempt $i"
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"password"}' | jq .
done
```

### Expected Response When Rate Limited

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded",
  "error": "Too Many Requests",
  "details": {
    "message": "You have exceeded the rate limit for this endpoint. Please try again later.",
    "endpoint": "GET /api/health",
    "ip": "127.0.0.1",
    "retryAfter": "60 seconds"
  }
}
```

## Configuration

### Environment Variables

Add to `.env` file (optional, for distributed rate limiting):

```bash
# Redis for distributed rate limiting across multiple instances
REDIS_URL=redis://localhost:6379
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Customize Rate Limits

Edit `/libs/shared/src/rate-limiting/throttler.config.ts`:

```typescript
export const RATE_LIMITS = {
  DEFAULT: {
    ttl: 60000,    // Time window in milliseconds
    limit: 100,    // Max requests in time window
  },
  // Add more configurations as needed
}
```

### Apply Custom Rate Limit to Endpoint

```typescript
import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '@funnelagents/shared';

@Post('special-endpoint')
@Throttle({ default: RATE_LIMITS.PUBLIC })
async specialEndpoint() {
  // Your code
}
```

### Skip Rate Limiting

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('health')
@SkipThrottle()
async healthCheck() {
  return { status: 'ok' };
}
```

## Files Modified

### Core Files Created
- `/libs/shared/src/rate-limiting/throttler.config.ts`
- `/libs/shared/src/rate-limiting/custom-throttler.guard.ts`
- `/libs/shared/src/rate-limiting/index.ts`
- `/libs/shared/src/index.ts` (updated)

### Service Files Updated
- `apps/api-gateway/src/app.module.ts`
- `apps/auth-service/src/app.module.ts`
- `apps/auth-service/src/auth.controller.ts`
- `apps/crm-service/src/app.module.ts`
- `apps/agents-service/src/app.module.ts`
- `apps/campaigns-service/src/app.module.ts`
- `apps/automations-service/src/app.module.ts`
- `apps/reports-service/src/app.module.ts`
- `apps/tasks-service/src/app.module.ts`
- `apps/content-service/src/app.module.ts`
- `apps/scheduler/src/app.module.ts`
- `apps/worker-runner/src/app.module.ts`

### Configuration Files Updated
- `.env.example` (added Redis configuration notes)

## How It Works

1. **Global Protection**: All endpoints are protected by default with 100 req/min limit
2. **Per-IP Tracking**: Rate limits are tracked per IP address
3. **Custom Endpoints**: Specific endpoints (like auth) have stricter limits
4. **Better Error Messages**: Users get clear feedback when rate limited
5. **Redis Support**: Optional distributed rate limiting across service instances

## Redis Storage (Optional)

### Current State
- Rate limits are stored in-memory (per service instance)
- Redis storage is prepared but commented out

### To Enable Redis Storage

1. Ensure Redis is running
2. Set `REDIS_URL` in `.env`
3. Install Redis storage adapter (if needed):
   ```bash
   npm install @nestjs/throttler-storage-redis
   ```
4. Uncomment Redis code in `throttler.config.ts`

## Security Benefits

- ✅ Prevents brute force attacks on auth endpoints
- ✅ Protects against DoS attacks
- ✅ Ensures fair API usage
- ✅ Reduces resource exhaustion
- ✅ Helps with cost control

## Troubleshooting

### Rate Limits Not Working
- Check that `@nestjs/throttler` is installed
- Verify APP_GUARD is configured in app.module.ts
- Check that endpoint doesn't have `@SkipThrottle()`

### Rate Limits Too Strict
- Adjust limits in `throttler.config.ts`
- Consider using different limits for authenticated users
- Increase limits for high-traffic endpoints

### Build Errors
- TypeScript path aliasing warnings are expected in monorepo
- The code will run correctly at runtime
- Use `@funnelagents/shared` imports (not relative paths)

## Monitoring

### What to Monitor
- Rate limit violations per endpoint
- Top violating IP addresses
- Average requests per user/IP
- System performance impact

### Logging
Rate limit violations are logged automatically with:
- Endpoint path
- IP address
- Timestamp
- User agent

## Next Steps

1. **Test**: Verify rate limiting works in your environment
2. **Monitor**: Watch for rate limit violations in logs
3. **Adjust**: Fine-tune limits based on actual usage
4. **Redis**: Consider enabling Redis for production
5. **Analytics**: Add dashboards to track rate limit metrics

## Additional Resources

- Full Implementation Report: `RATE_LIMITING_IMPLEMENTATION_REPORT.md`
- NestJS Throttler Docs: https://docs.nestjs.com/security/rate-limiting
- Redis Setup Guide: https://redis.io/docs/getting-started/

## Support

If you encounter issues:
1. Check the logs for rate limiting errors
2. Verify environment variables are set correctly
3. Test with simple curl commands
4. Review the implementation report for detailed information
