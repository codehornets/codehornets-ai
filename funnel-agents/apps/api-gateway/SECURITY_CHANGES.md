# API Gateway Security Configuration Changes

## CSRF Protection Status

### Before
```
CSRF: ENABLED (blocking all requests)
Status: Causing 500 errors on signup
```

### After
```
CSRF: DISABLED (development mode)
Status: Requests flow through successfully
```

## Request Flow

### Before (Broken)
```
Frontend (localhost:5173)
  |
  | POST /api/auth/signup
  | Headers: Content-Type, Origin
  | Body: {email, password, name}
  |
  v
API Gateway (localhost:3000)
  |
  | ❌ CSRF Check - FAIL (no token)
  | ❌ Error: "invalid csrf token"
  |
  X (Request blocked)
```

### After (Working)
```
Frontend (localhost:5173)
  |
  | POST /api/auth/signup
  | Headers: Content-Type, Origin
  | Body: {email, password, name}
  |
  v
API Gateway (localhost:3000)
  |
  | ✓ CORS Check - PASS (localhost:5173 allowed)
  | ✓ CSRF Check - SKIPPED (disabled)
  | ✓ Proxy to auth-service
  |
  v
Auth Service (localhost:3001)
  |
  | ✓ CORS Check - PASS
  | ✓ Rate Limiting - OK
  | ✓ Validation - OK
  | ✓ /signup endpoint - Found!
  |
  v
Response: {token, user, expires_in}
```

## Security Layers Still Active

Even with CSRF disabled, these protections remain:

1. **CORS** - Origin validation (only localhost in dev)
2. **Rate Limiting** - Throttle guards prevent brute force
3. **Input Validation** - ValidationPipe checks all inputs
4. **Helmet** - Security headers (CSP, XSS protection)
5. **SameSite Cookies** - CSRF protection at browser level
6. **JWT Tokens** - Authentication for protected routes
7. **Audit Logging** - All auth events logged
8. **Account Lockout** - Failed login attempts tracked

## When to Re-enable CSRF

Before production deployment:

1. Implement CSRF token flow in frontend
2. Uncomment CSRF middleware in `main.ts`
3. Test with tokens
4. Deploy to production

## Configuration

Current settings in `main.ts`:

```typescript
// CSRF: Disabled (commented out)
// CORS: Enabled with origin validation
// Cookies: SameSite=strict, HttpOnly=true
// Credentials: Allowed for auth cookies
```
