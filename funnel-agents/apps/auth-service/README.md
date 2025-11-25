# Auth Service

Authentication and user management service for the FunnelAgents platform.

## Features

- JWT-based authentication
- User registration and login
- Token refresh mechanism
- Password hashing with bcrypt
- Role-based access control (admin, user, viewer)
- Protected routes with JWT guards

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL
- JWT (jsonwebtoken)
- Passport
- bcrypt

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Key variables:
- `AUTH_SERVICE_PORT`: HTTP port (default: 3001)
- `AUTH_SERVICE_TCP_PORT`: TCP microservice port (default: 3011)
- `DB_*`: Database connection settings
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRATION`: Access token expiration time
- `JWT_REFRESH_SECRET`: Secret key for refresh token signing
- `JWT_REFRESH_EXPIRATION`: Refresh token expiration time

## API Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "role": "user"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user"
  }
}
```

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** Same as register response.

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** Same as register response with new tokens.

### GET /auth/me
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "role": "user",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### POST /auth/logout
Logout current user (invalidates token on client side).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Database Schema

### Users Table

| Column     | Type      | Constraints           |
|------------|-----------|-----------------------|
| id         | uuid      | PRIMARY KEY           |
| email      | varchar   | UNIQUE, NOT NULL      |
| password   | varchar   | NOT NULL              |
| name       | varchar   | NOT NULL              |
| avatar     | varchar   | NULLABLE              |
| role       | varchar   | DEFAULT 'user'        |
| created_at | timestamp | DEFAULT CURRENT_TIME  |
| updated_at | timestamp | DEFAULT CURRENT_TIME  |

## Development

### Run the service

```bash
# Development mode with watch
nx serve auth-service

# Build
nx build auth-service

# Test
nx test auth-service

# Lint
nx lint auth-service
```

### Database Setup

Make sure PostgreSQL is running and create the database:

```sql
CREATE DATABASE funnelagents_auth;
```

The service will automatically synchronize the schema on startup (in development mode).

## Security Considerations

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **JWT Secrets**: Use strong, unique secrets in production
3. **Token Expiration**: Access tokens expire in 15 minutes by default
4. **Refresh Tokens**: Refresh tokens expire in 7 days by default
5. **CORS**: Configure `CORS_ORIGIN` to match your frontend domain
6. **HTTPS**: Always use HTTPS in production

## Integration with API Gateway

The auth service runs on two ports:
- HTTP (3001): For direct REST API access
- TCP (3011): For microservice communication with the API Gateway

The API Gateway can proxy requests to this service or communicate via TCP for internal operations.
