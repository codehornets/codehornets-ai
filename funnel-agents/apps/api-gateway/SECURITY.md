# API Gateway Security Implementation

This document describes the security measures implemented in the API Gateway.

## Table of Contents

- [Overview](#overview)
- [Security Headers (Helmet)](#security-headers-helmet)
- [CSRF Protection](#csrf-protection)
- [CORS Configuration](#cors-configuration)
- [Implementation Details](#implementation-details)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Overview

The API Gateway implements multiple layers of security:

1. **Helmet** - Security headers middleware
2. **CSRF Protection** - Token-based CSRF prevention
3. **CORS** - Proper cross-origin resource sharing configuration
4. **Cookie Security** - HttpOnly, Secure, SameSite cookies
5. **Input Validation** - Request validation and sanitization

## Security Headers (Helmet)

Helmet is a collection of middleware that sets various HTTP headers to help protect the app.

### Enabled Headers

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
})
```

### Security Headers Set

- **X-DNS-Prefetch-Control** - Controls DNS prefetching
- **X-Frame-Options** - Prevents clickjacking (DENY)
- **X-Content-Type-Options** - Prevents MIME type sniffing (nosniff)
- **X-Download-Options** - Prevents downloads from opening directly (noopen)
- **X-Permitted-Cross-Domain-Policies** - Controls cross-domain policies
- **Referrer-Policy** - Controls referrer information
- **Content-Security-Policy** - Restricts resource loading
- **Strict-Transport-Security** - Enforces HTTPS (production)

### Customizing Headers

To modify security headers, edit `apps/api-gateway/src/main.ts`:

```typescript
app.use(
  helmet({
    // Your custom configuration
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-cdn.com"],
        // ... other directives
      },
    },
  })
);
```

## CSRF Protection

Cross-Site Request Forgery protection using the `csurf` middleware.

### How It Works

1. Client requests CSRF token: `GET /api/security/csrf-token`
2. Server generates token and sets cookie
3. Client includes token in headers for state-changing requests
4. Server validates token before processing request

### Token Generation

```typescript
// apps/api-gateway/src/security/csrf.controller.ts
@Get('csrf-token')
getCsrfToken(@Req() req: Request, @Res() res: Response) {
  const token = req.csrfToken();
  return res.json({
    csrfToken: token,
    message: 'CSRF token generated successfully',
  });
}
```

### Token Validation

CSRF protection is applied to all routes except:
- GET, HEAD, OPTIONS requests
- `/health` endpoints
- `/api/security/csrf-token` endpoint
- `/webhooks` endpoints (external services)

```typescript
// main.ts
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

app.use((req: any, res: any, next: any) => {
  if (
    req.path.includes('/health') ||
    req.path.includes('/api/security/csrf-token') ||
    req.path.includes('/webhooks')
  ) {
    return next();
  }
  return csrfProtection(req, res, next);
});
```

### Expected Headers

Clients must include CSRF token in one of these headers:
- `X-CSRF-Token`
- `CSRF-Token`

### Cookie Configuration

```typescript
{
  httpOnly: true,                               // Prevents XSS access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',                           // Prevents CSRF
}
```

## CORS Configuration

Cross-Origin Resource Sharing is configured to allow requests from trusted origins.

### Configuration

```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true); // Allow no-origin requests
    }

    if (corsOrigins.includes(origin)) {
      return callback(null, origin); // Allow trusted origins
    }

    if (origin.startsWith('http://localhost:')) {
      return callback(null, origin); // Allow localhost in dev
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'CSRF-Token',
  ],
  exposedHeaders: ['X-CSRF-Token'],
});
```

### Environment Variables

Set allowed origins via environment variable:

```bash
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

### Development vs Production

- **Development**: Automatically allows `http://localhost:*` origins
- **Production**: Only allows explicitly configured origins

## Implementation Details

### File Structure

```
apps/api-gateway/src/
├── main.ts                          # Main entry point with security setup
├── app.module.ts                    # App module with SecurityModule
├── security/
│   ├── security.module.ts          # Security module
│   └── csrf.controller.ts          # CSRF token endpoint
└── types/
    └── csurf.d.ts                  # TypeScript declarations for csurf
```

### Dependencies

```json
{
  "helmet": "^7.1.0",
  "csurf": "^1.11.0",
  "cookie-parser": "^1.4.6"
}
```

### Middleware Order

Critical order in `main.ts`:

1. Cookie Parser (required for CSRF)
2. Helmet (security headers)
3. CSRF Protection
4. Global Pipes (validation)
5. Global Filters (error handling)
6. Global Interceptors (logging, transforms)
7. CORS

## Testing

### Testing CSRF Protection

```bash
# Get CSRF token
curl -c cookies.txt http://localhost:3000/api/security/csrf-token

# Make request with token
CSRF_TOKEN=$(grep _csrf cookies.txt | awk '{print $7}')
curl -b cookies.txt \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"data": "value"}' \
  http://localhost:3000/api/endpoint

# Request without token (should fail)
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"data": "value"}' \
  http://localhost:3000/api/endpoint
```

### Testing Security Headers

```bash
# Check headers
curl -I http://localhost:3000/api/health

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: ...
```

### Testing CORS

```bash
# Valid origin
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3000/api/endpoint

# Invalid origin (should be blocked)
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  http://localhost:3000/api/endpoint
```

## Best Practices

### Environment Configuration

**Development** (`.env.local`):
```bash
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:4200
API_GATEWAY_PORT=3000
```

**Production** (`.env`):
```bash
NODE_ENV=production
CORS_ORIGINS=https://app.example.com,https://admin.example.com
API_GATEWAY_PORT=3000
```

### Cookie Security

Always use secure cookie settings in production:

```typescript
{
  httpOnly: true,     // Prevent XSS access
  secure: true,       // HTTPS only
  sameSite: 'strict', // Prevent CSRF
  maxAge: 3600000,    // 1 hour
}
```

### CSRF Exemptions

Only exempt routes that truly don't need CSRF protection:
- Health checks (monitoring services)
- Webhooks (external services with signature verification)
- Public read-only endpoints

### CSP Tuning

Start with strict CSP and relax as needed:

```typescript
// Start strict
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    // ... strict rules
  }
}

// Add exceptions only when necessary
scriptSrc: ["'self'", "https://trusted-cdn.com"]
```

### Error Handling

Don't leak security information in errors:

```typescript
// BAD
throw new ForbiddenException('Invalid CSRF token');

// GOOD
throw new ForbiddenException('Invalid request');
```

### Rate Limiting

Combine with rate limiting for enhanced security:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    // ... other imports
  ],
})
```

### Security Audit Checklist

Before production deployment:

- [ ] Helmet is enabled with proper CSP
- [ ] CSRF protection is enabled for state-changing requests
- [ ] CORS is configured with explicit allowed origins
- [ ] Cookies use `httpOnly`, `secure`, and `sameSite`
- [ ] Environment variables are properly configured
- [ ] Rate limiting is enabled
- [ ] Input validation is applied to all routes
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS is enforced in production
- [ ] Security headers are tested and verified

## Troubleshooting

### CSRF Token Issues

**Problem**: CSRF token validation fails

**Solutions**:
1. Verify cookie-parser is installed and initialized before CSRF middleware
2. Check that cookies are enabled in the client
3. Ensure client includes token in correct header (`X-CSRF-Token` or `CSRF-Token`)
4. Verify cookie `sameSite` setting matches your setup

### CORS Errors

**Problem**: CORS blocks legitimate requests

**Solutions**:
1. Add origin to `CORS_ORIGINS` environment variable
2. Check origin format (include protocol and port)
3. Verify `credentials: true` if using cookies
4. Check allowed headers include required headers

### Helmet CSP Violations

**Problem**: Resources blocked by CSP

**Solutions**:
1. Check browser console for CSP violation details
2. Add trusted source to appropriate CSP directive
3. Use nonces or hashes for inline scripts
4. Consider if resource is truly needed

### Cookie Not Set

**Problem**: CSRF cookie not created

**Solutions**:
1. Ensure cookie-parser middleware is initialized
2. Check domain/path settings
3. Verify `secure` flag matches protocol (HTTP vs HTTPS)
4. Test with `curl -v` to see full response headers

## Additional Resources

- [Helmet Documentation](https://helmetjs.github.io/)
- [CSRF Protection Guide](https://github.com/expressjs/csurf)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
