# Auth Service Security Features - Quick Start

## Installation (3 steps)

### 1. Install Dependencies
```bash
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents/apps/auth-service
./INSTALL_DEPENDENCIES.sh
```

### 2. Configure Environment
Copy these to your root `.env` file:
```env
# Required
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Optional (email simulation mode if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@funnelagents.ai
```

### 3. Run the Service
```bash
npm run dev:auth-service
```

---

## What's New?

### ✅ Password Reset Flow
```bash
# 1. Request reset
POST /auth/forgot-password
{ "email": "user@example.com" }

# 2. Check email for token
# 3. Reset password
POST /auth/reset-password
{ "token": "...", "password": "NewPass123!" }
```

### ✅ Token Blacklist (Logout)
```bash
POST /auth/logout
Authorization: Bearer <token>
# Token now invalid - can't be reused
```

### ✅ Rate Limiting
- Login: 5 attempts/minute
- Register: 10 attempts/minute
- Forgot Password: 3 attempts/hour

### ✅ Account Lockout
- 5 failed logins = 15 minute lockout
- Email notification sent
- Auto-unlock after timeout

### ✅ RBAC Guards
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
async adminOnly() { ... }
```

### ✅ Audit Logging
```bash
# Get your audit logs
GET /auth/audit-log/me
Authorization: Bearer <token>

# Admin: Get all logs
GET /auth/audit-log?limit=100&offset=0
Authorization: Bearer <admin-token>
```

### ✅ Security Headers
- Helmet middleware
- CSP, X-Frame-Options, etc.
- CORS configured

---

## Testing

### Test Rate Limiting
```bash
for i in {1..6}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 6th request should be rate limited
```

### Test Account Lockout
```bash
for i in {1..5}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"real@user.com","password":"WrongPass123!"}'
done
# Account locked after 5th attempt
```

### Test Token Blacklist
```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}' \
  | jq -r '.access_token')

# Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Try using same token (should fail)
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## New Endpoints

| Endpoint                  | Method | Auth  | Rate Limit |
|---------------------------|--------|-------|------------|
| /auth/forgot-password     | POST   | No    | 3/hour     |
| /auth/reset-password      | POST   | No    | -          |
| /auth/change-password     | POST   | Yes   | -          |
| /auth/logout              | POST   | Yes   | -          |
| /auth/unlock-account      | POST   | Admin | -          |
| /auth/audit-log           | GET    | Admin | -          |
| /auth/audit-log/me        | GET    | Yes   | -          |

---

## Database Tables Added

1. `password_reset_tokens` - Reset token management
2. `token_blacklist` - Invalidated JWTs
3. `audit_logs` - Security event logging
4. `login_attempts` - Failed login tracking
5. `users` - Updated (lockout fields added)

---

## Files Created

**Entities**: 5 new entity files
**Services**: 5 new service files
**DTOs**: 4 new DTO files
**Guards**: 1 new guard + 1 modified
**Decorators**: 3 new decorators

**Total**: 35+ files created/modified

---

## Documentation

- **Full Setup**: `SECURITY_SETUP.md`
- **Implementation Details**: `IMPLEMENTATION_REPORT.md`
- **Environment Config**: `env.example.txt`
- **This Guide**: `QUICK_START.md`

---

## Troubleshooting

### Email not sending?
- Check SMTP credentials in .env
- Test with simulation mode (no SMTP config)
- Emails logged to console if SMTP not configured

### Account stuck locked?
- Wait 15 minutes for auto-unlock
- Or admin unlock: `POST /auth/unlock-account`

### Rate limiting too strict?
- Adjust in `auth.controller.ts` @Throttle() decorators
- Modify global limits in `app.module.ts`

---

## Security Checklist

- [ ] Change JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Configure production SMTP provider
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Review and adjust rate limits
- [ ] Set up monitoring and alerts
- [ ] Regular security audits

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure .env
3. ✅ Test locally
4. [ ] Deploy to staging
5. [ ] Security review
6. [ ] Deploy to production

---

**Status**: All security features implemented and ready for testing!

For detailed information, see `SECURITY_SETUP.md` and `IMPLEMENTATION_REPORT.md`.
