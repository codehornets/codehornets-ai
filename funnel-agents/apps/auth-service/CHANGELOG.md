# Changelog - Auth Service

All notable changes to the Auth Service will be documented in this file.

## [0.1.0] - 2025-11-25

### Added

#### Core Features
- JWT-based authentication system
- User registration endpoint (`POST /auth/register`)
- User login endpoint (`POST /auth/login`)
- Token refresh endpoint (`POST /auth/refresh`)
- Get current user endpoint (`GET /auth/me`)
- Logout endpoint (`POST /auth/logout`)

#### Entities
- User entity with TypeORM
  - Fields: id, email, password, name, avatar, role, created_at, updated_at
  - Roles: admin, user, viewer
  - Email uniqueness constraint

#### Security
- Password hashing with bcrypt (10 salt rounds)
- JWT access tokens (15 minutes expiration)
- JWT refresh tokens (7 days expiration)
- Passport JWT strategy
- JWT authentication guard

#### DTOs
- LoginDto with validation
- RegisterDto with validation
- RefreshTokenDto with validation
- AuthResponseDto for responses

#### Infrastructure
- TypeORM PostgreSQL integration
- Dual server setup (HTTP + TCP microservice)
- CORS configuration
- Global validation pipe
- Environment variable configuration

#### Testing
- Unit tests for AuthService
- Unit tests for AuthController
- Test coverage for all endpoints

#### Documentation
- README with API documentation
- Environment variables example
- Database schema documentation
- Development and deployment instructions

### Technical Details

**Stack:**
- NestJS 10.x
- TypeORM 0.3.x
- PostgreSQL
- JWT
- Passport
- bcrypt

**Ports:**
- HTTP: 3001 (REST API)
- TCP: 3011 (Microservice communication)

**Database:**
- PostgreSQL database: `funnelagents_auth`
- Auto-synchronization enabled in development
