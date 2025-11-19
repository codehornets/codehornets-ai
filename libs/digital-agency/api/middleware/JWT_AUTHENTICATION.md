# JWT Authentication Implementation

## Overview

The API middleware now uses **real JWT (JSON Web Token) authentication** instead of mock authentication. This provides secure, stateless authentication for API requests.

## Implementation Details

### File Modified
- **Location**: `C:\workspace\@ornomedia-ai\digital-agency\api\middleware\auth.py`

### Methods Implemented

#### 1. `validate_token(token: str) -> bool`
**Purpose**: Validates JWT tokens with comprehensive security checks.

**Features**:
- JWT signature verification using HS256 algorithm
- Token expiration checking
- Issuer (iss) validation
- Audience (aud) validation
- Required claims validation (user_id, exp, iat)

**Error Handling**:
- `jwt.ExpiredSignatureError` - Token has expired
- `jwt.JWTClaimsError` - Invalid claims (issuer, audience, etc.)
- `JWTError` - General JWT decoding/validation errors
- `Exception` - Catches any unexpected errors

**Security**: Fails closed - returns `False` on any error, never exposes internal error details to client.

#### 2. `get_user_from_token(token: str) -> dict`
**Purpose**: Extracts user information from validated JWT token.

**Extracts**:
- `user_id` - Unique user identifier (required)
- `username` - User's username (optional, defaults to "unknown")
- `email` - User's email address (optional, defaults to "")
- `roles` - List of user roles (optional, defaults to [])
- `permissions` - User permissions from `_get_user_permissions()` helper

**Returns**:
```python
{
    "user_id": "user_123",
    "username": "johndoe",
    "email": "john@example.com",
    "roles": ["admin", "user"],
    "permissions": ["read", "write"]
}
```

#### 3. `_get_user_permissions(user_id: str) -> List[str]`
**Purpose**: Helper method to retrieve user permissions.

**Current Implementation**: Returns default permissions `["read", "write"]`

**TODO**: Implement database query to fetch actual user permissions:
```python
# Example future implementation:
user = await db.query(User).filter(User.id == user_id).first()
return user.permissions if user else default_permissions
```

## Configuration Required

### Environment Variables

Add these to your `.env` file:

```bash
# JWT Authentication (REQUIRED)
JWT_SECRET_KEY=your-strong-secret-key-change-in-production-use-long-random-string
JWT_ISSUER=ornomedia-api
JWT_AUDIENCE=ornomedia-clients

# JWT Algorithm (optional, defaults to HS256)
JWT_ALGORITHM=HS256
```

### Generate a Strong Secret Key

```bash
# Python method:
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL method:
openssl rand -base64 32
```

**SECURITY WARNING**:
- Never commit the actual `JWT_SECRET_KEY` to version control
- Use different keys for development, staging, and production
- Rotate keys periodically
- Store production keys in secure secret management systems (AWS Secrets Manager, HashiCorp Vault, etc.)

## Dependencies

### Already Installed
The required JWT library is already in `requirements.txt`:

```
python-jose[cryptography]==3.3.0
```

This provides:
- JWT encoding/decoding
- Cryptographic signature verification
- Claims validation
- Support for multiple algorithms (HS256, RS256, etc.)

## Security Improvements

### Before (Mock Implementation)
- Accepted any non-empty token
- No signature verification
- No expiration checking
- No claims validation
- Returned mock user data

### After (Real JWT)
- Verifies JWT signature with SECRET_KEY
- Validates token expiration timestamp
- Checks issuer and audience claims
- Validates required claims (user_id, exp, iat)
- Extracts real user data from token payload
- Comprehensive error handling and logging
- Fails closed on any validation error

### Security Features
1. **Signature Verification**: Ensures token hasn't been tampered with
2. **Expiration Checking**: Prevents use of old/expired tokens
3. **Issuer Validation**: Ensures token was issued by trusted authority
4. **Audience Validation**: Ensures token is intended for this API
5. **Claims Validation**: Verifies required fields are present
6. **Error Logging**: All authentication failures are logged
7. **No Error Exposure**: Client only sees generic error messages

## Testing

### Test File
Location: `C:\workspace\@ornomedia-ai\digital-agency\api\middleware\test_auth_example.py`

### Test Scenarios

1. **Valid Token** - Should authenticate successfully
   ```python
   token = create_test_token()
   assert middleware.validate_token(token) is True
   ```

2. **Expired Token** - Should reject
   ```python
   token = create_test_token(expires_delta=timedelta(hours=-1))
   assert middleware.validate_token(token) is False
   ```

3. **Invalid Signature** - Should reject
   ```python
   token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
   assert middleware.validate_token(token) is False
   ```

4. **Missing Claims** - Should reject
   ```python
   token = create_test_token(include_required_claims=False)
   assert middleware.validate_token(token) is False
   ```

5. **User Extraction** - Should extract correct user info
   ```python
   user = middleware.get_user_from_token(token)
   assert user["user_id"] == "expected_id"
   assert user["email"] == "user@example.com"
   ```

### Running Tests

```bash
# Run all tests
pytest api/middleware/test_auth_example.py -v

# Run specific test
pytest api/middleware/test_auth_example.py::TestJWTAuthentication::test_valid_token_should_authenticate -v

# Run with coverage
pytest api/middleware/test_auth_example.py --cov=api.middleware.auth --cov-report=html
```

### Manual Testing with cURL

```bash
# 1. Generate a test token (run the test file)
python api/middleware/test_auth_example.py

# 2. Test public endpoint (no auth required)
curl http://localhost:8000/api/v1/health

# 3. Test protected endpoint without token (should return 401)
curl http://localhost:8000/api/v1/some-protected-resource

# 4. Test protected endpoint with valid token
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:8000/api/v1/some-protected-resource

# 5. Test with expired token (should return 401)
curl -H "Authorization: Bearer EXPIRED_TOKEN_HERE" \
     http://localhost:8000/api/v1/some-protected-resource
```

## Creating JWT Tokens

For testing and development, you can create tokens using the test utility:

```python
from api.middleware.test_auth_example import create_test_token
from datetime import timedelta

# Create standard user token
token = create_test_token(
    user_id="user_123",
    username="johndoe",
    email="john@example.com",
    roles=["user"]
)

# Create admin token
admin_token = create_test_token(
    user_id="admin_001",
    username="admin",
    email="admin@example.com",
    roles=["admin", "user"]
)

# Create token that expires in 1 hour
short_lived_token = create_test_token(
    expires_delta=timedelta(hours=1)
)
```

## Production Deployment Checklist

- [ ] Set strong `JWT_SECRET_KEY` (32+ random characters)
- [ ] Configure `JWT_ISSUER` for your API
- [ ] Configure `JWT_AUDIENCE` for your client apps
- [ ] Use environment-specific secrets (dev, staging, prod)
- [ ] Store secrets in secure secret management system
- [ ] Implement token rotation strategy
- [ ] Set appropriate token expiration times
- [ ] Implement refresh token mechanism (if needed)
- [ ] Monitor authentication logs for suspicious activity
- [ ] Set up alerts for authentication failures
- [ ] Implement rate limiting on auth endpoints
- [ ] Use HTTPS for all API communication
- [ ] Implement the database query in `_get_user_permissions()`

## Token Structure Example

```json
{
  "user_id": "user_123",
  "username": "johndoe",
  "email": "john@example.com",
  "roles": ["user", "admin"],
  "iat": 1699564800,
  "exp": 1699568400,
  "iss": "ornomedia-api",
  "aud": "ornomedia-clients"
}
```

## Common Issues & Troubleshooting

### Issue: "Invalid token" error
- **Check**: JWT_SECRET_KEY matches between token generation and validation
- **Check**: Token hasn't expired
- **Check**: Issuer and audience match configuration

### Issue: "Missing authorization header"
- **Check**: Header format is `Authorization: Bearer <token>`
- **Check**: Token is included in request
- **Check**: Header name is exactly "Authorization"

### Issue: "Token expired"
- **Check**: System clock is synchronized (NTP)
- **Check**: Token expiration time is appropriate
- **Check**: Client is requesting fresh tokens

### Issue: Permissions not working
- **Action**: Implement `_get_user_permissions()` with database query
- **Check**: Database connection is configured
- **Check**: User exists in database

## Next Steps

1. **Implement Token Generation Endpoint**
   - Create `/api/v1/auth/login` endpoint
   - Verify user credentials
   - Generate and return JWT token

2. **Implement Token Refresh**
   - Create `/api/v1/auth/refresh` endpoint
   - Validate refresh token
   - Issue new access token

3. **Implement User Permissions**
   - Connect `_get_user_permissions()` to database
   - Create permissions table/model
   - Add role-based access control (RBAC)

4. **Add Token Blacklist**
   - Implement Redis-based token blacklist
   - Support token revocation
   - Handle logout functionality

5. **Monitoring & Analytics**
   - Track authentication success/failure rates
   - Monitor token usage patterns
   - Alert on suspicious activity

## References

- [JWT.io](https://jwt.io/) - JWT introduction and debugger
- [python-jose documentation](https://python-jose.readthedocs.io/)
- [OWASP JWT Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [RFC 7519 - JWT Specification](https://datatracker.ietf.org/doc/html/rfc7519)
