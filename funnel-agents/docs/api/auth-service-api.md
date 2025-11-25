# Auth Service API Documentation

The Auth Service handles user authentication, registration, and profile management for the FunnelAgents platform. It uses JWT-based authentication with refresh token support.

## Base URL

```
Development: http://localhost:3001 (direct) or http://localhost:3000/api/auth (via API Gateway)
Production: https://api.yourdomain.com/api/auth
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 15 minutes. Use the refresh token endpoint to obtain new tokens.

---

## Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

| Field    | Type   | Required | Description                              |
|----------|--------|----------|------------------------------------------|
| email    | string | Yes      | Valid email address                      |
| password | string | Yes      | Minimum 6 characters                     |
| name     | string | Yes      | User's display name                      |
| avatar   | string | No       | URL to user's avatar image               |
| role     | string | No       | One of: `admin`, `user`, `viewer` (default: `user`) |

**Example Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "user"
}
```

**Response (201 Created):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "onboarding_completed": false
  }
}
```

**Error Responses:**

| Status | Description                           |
|--------|---------------------------------------|
| 400    | Validation error (invalid email, short password, etc.) |
| 409    | User with this email already exists   |

---

### POST /auth/login

Authenticate an existing user.

**Request Body:**

| Field    | Type   | Required | Description          |
|----------|--------|----------|----------------------|
| email    | string | Yes      | Registered email     |
| password | string | Yes      | User's password      |

**Example Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "onboarding_completed": true,
    "company_name": "Acme Inc",
    "team_size": "10-50",
    "industry": "Technology"
  }
}
```

**Error Responses:**

| Status | Description                |
|--------|----------------------------|
| 400    | Validation error           |
| 401    | Invalid credentials        |

---

### POST /auth/refresh

Obtain new access and refresh tokens using a valid refresh token.

**Request Body:**

| Field         | Type   | Required | Description              |
|---------------|--------|----------|--------------------------|
| refresh_token | string | Yes      | Valid refresh token      |

**Example Request:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

**Error Responses:**

| Status | Description           |
|--------|-----------------------|
| 401    | Invalid refresh token |

---

### GET /auth/me

Get the current authenticated user's profile.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "role": "user",
  "onboarding_completed": true,
  "company_name": "Acme Inc",
  "team_size": "10-50",
  "industry": "Technology",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z"
}
```

**Error Responses:**

| Status | Description                  |
|--------|------------------------------|
| 401    | Missing or invalid token     |

---

### PATCH /auth/me

Update the current authenticated user's profile.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Request Body:**

| Field               | Type    | Required | Description                     |
|---------------------|---------|----------|---------------------------------|
| name                | string  | No       | User's display name             |
| avatar              | string  | No       | URL to avatar image             |
| onboarding_completed| boolean | No       | Whether onboarding is complete  |
| company_name        | string  | No       | User's company name             |
| team_size           | string  | No       | Team size (e.g., "1-10", "10-50") |
| industry            | string  | No       | Industry/sector                 |

**Example Request:**

```json
{
  "name": "John Smith",
  "onboarding_completed": true,
  "company_name": "Acme Inc",
  "team_size": "10-50",
  "industry": "Technology"
}
```

**Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Smith",
  "avatar": "https://example.com/avatar.jpg",
  "role": "user",
  "onboarding_completed": true,
  "company_name": "Acme Inc",
  "team_size": "10-50",
  "industry": "Technology",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T15:45:00Z"
}
```

**Error Responses:**

| Status | Description              |
|--------|--------------------------|
| 400    | Validation error         |
| 401    | Missing or invalid token |

---

### POST /auth/logout

Log out the current user. The client should remove stored tokens.

**Headers:**
- `Authorization: Bearer <access_token>` (required)

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**

| Status | Description              |
|--------|--------------------------|
| 401    | Missing or invalid token |

---

## Data Models

### User

| Field               | Type      | Description                         |
|---------------------|-----------|-------------------------------------|
| id                  | UUID      | Unique identifier                   |
| email               | string    | User's email (unique, indexed)      |
| name                | string    | Display name                        |
| avatar              | string?   | Avatar image URL                    |
| role                | enum      | `admin`, `user`, or `viewer`        |
| onboarding_completed| boolean   | Whether user completed onboarding   |
| company_name        | string?   | Company name                        |
| team_size           | string?   | Team size range                     |
| industry            | string?   | Industry/sector                     |
| created_at          | datetime  | Account creation timestamp          |
| updated_at          | datetime  | Last update timestamp               |

### AuthResponse

| Field         | Type   | Description                  |
|---------------|--------|------------------------------|
| access_token  | string | JWT access token (15m expiry)|
| refresh_token | string | JWT refresh token (7d expiry)|
| user          | User   | User profile data            |

---

## Token Details

### Access Token

- **Type:** JWT
- **Expiration:** 15 minutes
- **Payload:**
  ```json
  {
    "sub": "<user_id>",
    "email": "<user_email>",
    "role": "<user_role>",
    "iat": 1704067200,
    "exp": 1704068100
  }
  ```

### Refresh Token

- **Type:** JWT
- **Expiration:** 7 days
- **Payload:** Same as access token

---

## Configuration

### Environment Variables

| Variable           | Description                    | Required | Default                      |
|--------------------|--------------------------------|----------|------------------------------|
| JWT_SECRET         | Secret for signing access JWTs | **YES** | **NONE** - Service will fail to start without this |
| JWT_REFRESH_SECRET | Secret for signing refresh JWTs| **YES** | **NONE** - Service will fail to start without this |
| JWT_EXPIRATION     | Access token expiration        | No | `15m` |
| AUTH_SERVICE_HOST  | Service host                   | No | `0.0.0.0`                  |
| AUTH_SERVICE_PORT  | Service port                   | No | `3001`                       |

**SECURITY NOTICE**:
- JWT secrets are **REQUIRED** and have **NO FALLBACK VALUES**
- The service will terminate on startup if JWT_SECRET or JWT_REFRESH_SECRET are not set
- Generate secure secrets using: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Never commit actual secrets to version control
- Use different secrets for JWT_SECRET and JWT_REFRESH_SECRET

---

## Error Format

All errors follow a standard format:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

For validation errors:

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 6 characters"],
  "error": "Bad Request"
}
```

---

## Security Considerations

1. **Password Storage:** Passwords are hashed using bcrypt with 10 salt rounds
2. **Token Security:** Store tokens securely (HttpOnly cookies recommended for web apps)
3. **HTTPS:** Always use HTTPS in production
4. **Token Refresh:** Implement automatic token refresh before expiration
5. **Logout:** Clear all stored tokens on logout
