# Auth Service Security Features - Setup Guide

## Overview

The Auth Service now includes comprehensive security features:

1. Password Reset Flow with email integration
2. Token Blacklist for logout functionality
3. Rate Limiting on sensitive endpoints
4. Role-Based Access Control (RBAC)
5. Account Lockout after failed login attempts
6. Security Headers (Helmet, CSP)
7. Comprehensive Audit Logging

---

## Required Dependencies

Add these dependencies to your root `package.json`:

```bash
npm install helmet nodemailer @nestjs/throttler
npm install --save-dev @types/nodemailer
```

Or with pnpm:

```bash
pnpm add helmet nodemailer @nestjs/throttler
pnpm add -D @types/nodemailer
```

---

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# SMTP Configuration (for password reset emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@funnelagents.ai

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Database (already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/funnel_agents
```

---

## Database Schema Changes

The following tables have been created/modified:

### 1. **users** table updates:
- `failed_login_attempts` (integer, default: 0)
- `locked_until` (timestamp, nullable)
- `last_login` (timestamp, nullable)

### 2. **password_reset_tokens** table (new):
- `id` (uuid, primary key)
- `token` (string)
- `user_id` (uuid, foreign key to users)
- `expires_at` (timestamp)
- `used` (boolean, default: false)
- `created_at` (timestamp)

### 3. **token_blacklist** table (new):
- `id` (uuid, primary key)
- `token` (string, unique)
- `user_id` (uuid)
- `expires_at` (timestamp)
- `created_at` (timestamp)

### 4. **audit_logs** table (new):
- `id` (uuid, primary key)
- `user_id` (uuid, nullable)
- `email` (string)
- `action` (enum: login, logout, register, password_change, etc.)
- `ip_address` (string, nullable)
- `user_agent` (text, nullable)
- `metadata` (jsonb, nullable)
- `success` (boolean, default: true)
- `error_message` (text, nullable)
- `created_at` (timestamp)

### 5. **login_attempts** table (new):
- `id` (uuid, primary key)
- `email` (string)
- `ip_address` (string)
- `success` (boolean, default: false)
- `created_at` (timestamp)

---

## API Endpoints

### Authentication Endpoints

#### 1. Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Rate Limit**: 10 requests per minute per IP

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Rate Limit**: 5 requests per minute per IP

**Account Lockout**: After 5 failed attempts, account is locked for 15 minutes

#### 3. Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

Adds token to blacklist, preventing further use.

#### 4. Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

### Password Management

#### 5. Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Rate Limit**: 3 requests per hour per IP

Sends password reset email with secure token (expires in 1 hour).

#### 6. Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "<reset_token_from_email>",
  "password": "NewSecurePass123!"
}
```

#### 7. Change Password (Authenticated)
```http
POST /auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_password": "OldPass123!",
  "new_password": "NewSecurePass123!"
}
```

### Profile Management

#### 8. Get Profile
```http
GET /auth/me
Authorization: Bearer <access_token>
```

#### 9. Update Profile
```http
PATCH /auth/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "company_name": "Tech Corp",
  "team_size": "10-50",
  "industry": "Technology"
}
```

### Admin Endpoints (RBAC - Admin Only)

#### 10. Unlock Account
```http
POST /auth/unlock-account
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "email": "locked-user@example.com"
}
```

#### 11. Get All Audit Logs
```http
GET /auth/audit-log?limit=100&offset=0
Authorization: Bearer <admin_access_token>
```

#### 12. Get My Audit Logs
```http
GET /auth/audit-log/me
Authorization: Bearer <access_token>
```

---

## Security Features Details

### 1. Password Reset Flow

- **Token Generation**: Secure 32-byte random token
- **Expiry**: 1 hour
- **Single Use**: Token marked as used after successful reset
- **Email Integration**: Nodemailer with SMTP
- **Security**: Doesn't reveal if email exists in system

### 2. Token Blacklist

- **On Logout**: Token added to blacklist
- **JWT Strategy Check**: Validates token not blacklisted
- **Auto Cleanup**: Hourly cron job removes expired tokens
- **Prevents**: Token reuse after logout

### 3. Rate Limiting

Global limits:
- **Default**: 100 requests per minute
- **Login**: 5 requests per minute per IP
- **Register**: 10 requests per minute per IP
- **Forgot Password**: 3 requests per hour per IP

### 4. RBAC Guards

Roles: `admin`, `user`, `viewer`

Usage in controllers:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Post('sensitive-endpoint')
async adminOnly() {
  // Only admins can access
}
```

### 5. Account Lockout

- **Threshold**: 5 failed login attempts within 30 minutes
- **Duration**: 15 minutes lockout
- **Email Notification**: Sent when account is locked
- **Auto Unlock**: After lockout period expires
- **Admin Override**: Admins can manually unlock accounts

### 6. Security Headers

Helmet middleware provides:
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security
- X-XSS-Protection

### 7. Audit Logging

Logged actions:
- `login` - Successful login
- `logout` - User logout
- `register` - New user registration
- `password_change` - Password changed
- `password_reset_request` - Reset email sent
- `password_reset_complete` - Password reset
- `profile_update` - Profile modified
- `token_refresh` - Token refreshed
- `failed_login` - Failed login attempt
- `account_locked` - Account locked
- `account_unlocked` - Account unlocked

Each log entry includes:
- User ID and email
- Action type
- IP address
- User agent
- Metadata (optional additional data)
- Success/failure status
- Error message (if failed)
- Timestamp

---

## Password Requirements

Enforced by validators:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

---

## Email Configuration

### Gmail Setup

1. Enable 2FA on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create new app password for "Mail"
3. Use the generated password in `SMTP_PASS`

### Other SMTP Providers

**SendGrid**:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**AWS SES**:
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
```

### Email Simulation (Development)

If SMTP credentials are not configured, emails are logged to console instead of being sent.

---

## Scheduled Jobs

The service runs these background jobs:

1. **Token Blacklist Cleanup** (hourly)
   - Removes expired tokens from blacklist

2. **Password Reset Token Cleanup** (daily at midnight)
   - Removes expired password reset tokens

3. **Login Attempts Cleanup** (hourly)
   - Removes login attempts older than 7 days

---

## Testing

### Test User Creation

Create test users with different roles:

```bash
# Run the seed script
npm run seed:auth-service
```

### Manual Testing

1. **Test Rate Limiting**:
```bash
# Should fail on 6th attempt
for i in {1..6}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

2. **Test Account Lockout**:
```bash
# Fail login 5 times to trigger lockout
for i in {1..5}; do
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"WrongPassword123!"}'
done
```

3. **Test RBAC**:
```bash
# Try accessing admin endpoint with user token (should fail)
curl -X GET http://localhost:3001/auth/audit-log \
  -H "Authorization: Bearer <user_token>"
```

4. **Test Token Blacklist**:
```bash
# Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer <token>"

# Try using same token (should fail)
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <same_token>"
```

---

## Production Checklist

- [ ] Change all secret keys in environment variables
- [ ] Set `NODE_ENV=production`
- [ ] Disable TypeORM `synchronize` in production
- [ ] Set up proper SMTP provider (not Gmail)
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Monitor audit logs regularly
- [ ] Set up alerts for suspicious activity
- [ ] Review and adjust rate limits based on usage
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx) with additional security headers
- [ ] Set up log aggregation (e.g., ELK stack)
- [ ] Implement database encryption at rest
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## Monitoring & Alerts

Set up monitoring for:

1. **Failed Login Attempts**: Alert if > 100 in 10 minutes
2. **Account Lockouts**: Alert on suspicious patterns
3. **Password Reset Requests**: Alert on unusual spikes
4. **Token Blacklist Size**: Monitor for memory issues
5. **Audit Log Volume**: Track for anomalies

---

## Security Best Practices

1. **Rotate JWT secrets** regularly (e.g., every 90 days)
2. **Monitor audit logs** for suspicious activity
3. **Review locked accounts** for potential attacks
4. **Update dependencies** regularly for security patches
5. **Use HTTPS only** in production
6. **Implement IP allowlisting** for admin endpoints (optional)
7. **Set up Web Application Firewall** (WAF)
8. **Regular penetration testing**
9. **GDPR compliance**: Provide user data export/deletion
10. **Implement MFA** for admin accounts (future enhancement)

---

## Troubleshooting

### Token Blacklist Not Working

- Check that `TokenBlacklistService` is properly injected in `JwtAuthGuard`
- Verify database table `token_blacklist` exists
- Check logs for blacklist errors

### Email Not Sending

- Verify SMTP credentials
- Check firewall allows outbound connections on SMTP port
- Review email service logs
- Test with email simulation mode first

### Account Stuck Locked

- Check `locked_until` timestamp in database
- Manually unlock: `UPDATE users SET locked_until = NULL WHERE email = '...'`
- Or use admin unlock endpoint

### Rate Limiting Too Strict

- Adjust limits in `auth.controller.ts` `@Throttle()` decorators
- Modify global limits in `app.module.ts` `ThrottlerModule.forRoot()`

---

## Future Enhancements

- [ ] Multi-Factor Authentication (MFA/2FA)
- [ ] OAuth2 integration (Google, GitHub, etc.)
- [ ] Device management (trusted devices)
- [ ] Session management UI
- [ ] Security questions for password recovery
- [ ] Biometric authentication support
- [ ] Passwordless authentication (Magic Links)
- [ ] Advanced threat detection (AI-based)
- [ ] CAPTCHA integration for high-risk operations
- [ ] Geolocation-based security

---

## Support

For issues or questions, contact the development team or review the audit logs for debugging information.
