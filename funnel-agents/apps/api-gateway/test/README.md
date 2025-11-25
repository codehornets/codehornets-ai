# API Gateway E2E Tests

Comprehensive end-to-end tests for the API Gateway that verify the entire application stack.

## Overview

These tests verify:
- Authentication flows (register, login, logout, refresh tokens)
- Authorization and protected routes
- Service integrations (CRM, Campaigns, Agents, Tasks, Automations)
- Critical user workflows
- Error handling and edge cases

## Key Features

### Fail-Fast Service Verification
Tests will **fail immediately** if required services are unavailable, with clear error messages indicating which services need to be started.

### No Silent Failures
- Tests reject 404/502/503 as valid responses
- All `console.log` workarounds removed
- Proper assertions verify business logic
- Service errors cause test failure, not silent skips

### Test Helper Functions
- `verifyAllServicesHealthy()` - Checks all services before running tests
- `assertSuccessResponse()` - Ensures 2xx status codes
- `assertNotServiceError()` - Rejects 5xx service errors
- `generateTestEmail()` - Creates unique test emails

## Prerequisites

### Required Services

All tests require these services to be running:

| Service | Port | TCP Port | Purpose |
|---------|------|----------|---------|
| Auth Service | 3001 | 3011 | Authentication & authorization |
| CRM Service | 3002 | 3012 | Lead and contact management |
| Campaigns Service | 3003 | 3013 | Campaign management |
| Agents Service | 3005 | 3015 | AI agent management |
| Tasks Service | 3006 | 3016 | Task management |
| Automations Service | 3007 | 3017 | Workflow automation |

### Infrastructure Services

Tests also require:
- **PostgreSQL** (port 5432 or 5433 for test) - Database
- **Redis** (port 6379 or 6381 for test) - Cache and queues

## Running Tests

### Option 1: Using Docker Compose (Recommended)

Start the test environment with all required services:

```bash
cd infrastructure/docker
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be healthy
docker-compose -f docker-compose.test.yml ps

# Run tests
cd ../../apps/api-gateway
npm test

# Or run specific test file
npm test -- test/app.e2e-spec.ts
npm test -- test/critical-flows.e2e-spec.ts

# Cleanup
cd ../../infrastructure/docker
docker-compose -f docker-compose.test.yml down -v
```

### Option 2: Local Services

If running services locally, ensure all services are started on the correct ports:

```bash
# Start infrastructure
docker-compose up postgres redis -d

# Start each service (in separate terminals or with pm2)
cd apps/auth-service && npm run start:dev
cd apps/crm-service && npm run start:dev
cd apps/campaigns-service && npm run start:dev
cd apps/agents-service && npm run start:dev
cd apps/tasks-service && npm run start:dev
cd apps/automations-service && npm run start:dev

# Run tests
cd apps/api-gateway
npm test
```

### Option 3: Using Make Commands

```bash
# Start test environment
make test-env-up

# Run tests
make test

# Cleanup
make test-env-down
```

## Test Files

### app.e2e-spec.ts
Basic integration tests covering:
- Health checks
- Authentication flow (register, login, profile)
- Service integration (CRM, Campaigns, Agents, Workflows)
- Error handling

### critical-flows.e2e-spec.ts
Complex user workflows:
- User Registration → Login → Create Agent → Execute Task
- Lead Creation → Qualification → Conversion
- Workflow Creation → Execution → Results Verification

## Test Output

### Successful Run
```
All required services are healthy:
  ✓ Auth Service (localhost:3001)
  ✓ CRM Service (localhost:3002)
  ✓ Campaigns Service (localhost:3003)
  ✓ Agents Service (localhost:3005)
  ✓ Tasks Service (localhost:3006)
  ✓ Automations Service (localhost:3007)

API Gateway (e2e)
  /health (GET)
    ✓ should return health status
  Authentication Flow
    POST /auth/register
      ✓ should register a new user successfully
      ✓ should fail with duplicate email
    ...
```

### Failed Run (Services Down)
```
================================================================================
E2E TEST ENVIRONMENT ERROR: Required services are not available
================================================================================

The following services are required for E2E tests but are not responding:

  - Auth Service (localhost:3001)
    Error: connect ECONNREFUSED 127.0.0.1:3001

  - CRM Service (localhost:3002)
    Error: connect ECONNREFUSED 127.0.0.1:3002

To run E2E tests, you must start the test environment first:

  cd infrastructure/docker
  docker-compose -f docker-compose.test.yml up -d

================================================================================
```

## Environment Variables

The test suite respects these environment variables:

```bash
# Service hosts (default: localhost)
AUTH_SERVICE_HOST=localhost
CRM_SERVICE_HOST=localhost
CAMPAIGNS_SERVICE_HOST=localhost
AGENTS_SERVICE_HOST=localhost
TASKS_SERVICE_HOST=localhost
AUTOMATIONS_SERVICE_HOST=localhost

# Service ports (defaults shown)
AUTH_SERVICE_PORT=3001
CRM_SERVICE_PORT=3002
CAMPAIGNS_SERVICE_PORT=3003
AGENTS_SERVICE_PORT=3005
TASKS_SERVICE_PORT=3006
AUTOMATIONS_SERVICE_PORT=3007

# Database
DATABASE_URL=postgresql://funnel_agents_test:test_secret@localhost:5433/funnel_agents_test

# JWT
JWT_SECRET=test-jwt-secret-key-for-testing-only
```

## Debugging Tests

### Run with Verbose Output
```bash
npm test -- --verbose
```

### Run Specific Test
```bash
npm test -- --testNamePattern="should register a new user"
```

### Watch Mode
```bash
npm test -- --watch
```

### Debug in VS Code
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest E2E Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--config",
    "apps/api-gateway/jest.config.ts",
    "apps/api-gateway/test/app.e2e-spec.ts"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Troubleshooting

### Tests Timeout
- Increase Jest timeout: `jest.setTimeout(30000)` in test files
- Check service health manually: `curl http://localhost:3001/health`
- Check docker logs: `docker-compose -f docker-compose.test.yml logs`

### Database Conflicts
- Use separate test database
- Clean up test data between runs
- Use unique email addresses (handled by `generateTestEmail()`)

### Port Conflicts
- Check if ports are already in use: `lsof -i :3001`
- Use different ports via environment variables
- Stop conflicting services

### Service Not Responding
```bash
# Check service status
docker-compose -f docker-compose.test.yml ps

# Check service logs
docker-compose -f docker-compose.test.yml logs auth-service

# Restart specific service
docker-compose -f docker-compose.test.yml restart auth-service
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: funnel_agents_test
          POSTGRES_USER: funnel_agents_test
          POSTGRES_PASSWORD: test_secret
        ports:
          - 5433:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6381:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Start test services
        run: |
          cd infrastructure/docker
          docker-compose -f docker-compose.test.yml up -d
          sleep 30 # Wait for services

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Cleanup
        if: always()
        run: |
          cd infrastructure/docker
          docker-compose -f docker-compose.test.yml down -v
```

## Best Practices

1. **Always verify services first** - Use `verifyAllServicesHealthy()`
2. **Use unique test data** - Leverage `generateTestEmail()`
3. **Fail fast** - Don't accept service errors as valid responses
4. **Test isolation** - Each test should be independent
5. **Proper cleanup** - Use `afterAll()` and `afterEach()` hooks
6. **Clear assertions** - Check actual business logic, not just status codes
7. **Error messages** - Use descriptive error messages in assertions

## Contributing

When adding new tests:

1. Follow existing patterns
2. Use test helpers from `test-helpers.ts`
3. Add proper assertions (no silent failures)
4. Document complex test scenarios
5. Ensure tests are idempotent
6. Update this README if adding new requirements
