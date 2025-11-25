# Integration Tests

Comprehensive integration tests for FunnelAgents microservices, queue processing, database operations, and Python agent API.

## Overview

These tests validate real inter-service communication and infrastructure components:

1. **Microservices** (`microservices.spec.ts`) - TCP communication between API Gateway and backend services
2. **Queues** (`queues.spec.ts`) - BullMQ job processing with real Redis
3. **Database** (`database.spec.ts`) - Repository operations with real PostgreSQL
4. **Python Agent API** (`agent-api.spec.ts`) - HTTP calls to Python FastAPI service

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Running services (for full integration tests)

### Run All Integration Tests

```bash
# Start test infrastructure
cd tests/integration
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
sleep 5

# Run integration tests
cd ../..
npm run test:integration

# Cleanup
cd tests/integration
docker-compose -f docker-compose.test.yml down -v
```

### Run Specific Test Suites

```bash
# Microservices only
npm run test:integration -- microservices.spec.ts

# Queue processing only
npm run test:integration -- queues.spec.ts

# Database operations only
npm run test:integration -- database.spec.ts

# Python Agent API only
npm run test:integration -- agent-api.spec.ts
```

### Watch Mode

```bash
npm run test:integration:watch
```

## Test Infrastructure

### Docker Test Environment

The `docker-compose.test.yml` provides isolated test dependencies:

- **PostgreSQL** - Port 5433 (to avoid conflicts with dev database)
- **Redis** - Port 6380 (to avoid conflicts with dev Redis)

### Environment Variables

Create `.env.test` for custom configuration:

```env
# PostgreSQL Test Database
TEST_POSTGRES_HOST=localhost
TEST_POSTGRES_PORT=5433
TEST_POSTGRES_DB=funnel_agents_test
TEST_POSTGRES_USER=funnel_agents
TEST_POSTGRES_PASSWORD=secret

# Redis Test Instance
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6380

# Service TCP Ports
TEST_AUTH_SERVICE_TCP_PORT=3011
TEST_CRM_SERVICE_TCP_PORT=3012
TEST_AGENTS_SERVICE_TCP_PORT=3015

# Python Agent API
TEST_PYTHON_AGENT_API_URL=http://localhost:8000
```

## Test Suites

### 1. Microservices Integration Tests

**File**: `microservices.spec.ts`

**Tests**:
- API Gateway → Auth Service TCP communication
- API Gateway → CRM Service TCP communication
- API Gateway → Agents Service TCP communication
- Timeout handling and enforcement
- Error propagation from services
- Connection resilience and reconnection

**Requirements**:
- Auth Service running on TCP port 3011
- CRM Service running on TCP port 3012
- Agents Service running on TCP port 3015

**Run**:
```bash
npm run test:integration -- microservices.spec.ts
```

### 2. BullMQ Queue Integration Tests

**File**: `queues.spec.ts`

**Tests**:
- Job enqueue/dequeue with real Redis
- Retry logic with exponential backoff
- Job failure handling and failed queue
- Concurrent job processing
- Priority-based processing
- Rate limiting
- Queue pause/resume
- Job cleanup and management

**Requirements**:
- Redis running on port 6380

**Run**:
```bash
# Start Redis
docker-compose -f tests/integration/docker-compose.test.yml up -d redis-test

# Run tests
npm run test:integration -- queues.spec.ts
```

### 3. Database Integration Tests

**File**: `database.spec.ts`

**Tests**:
- Repository CRUD operations
- Transactions and rollback
- Nested transactions with savepoints
- Concurrent reads and writes
- Optimistic locking
- Deadlock handling
- Connection pooling
- Pool exhaustion handling

**Requirements**:
- PostgreSQL running on port 5433

**Run**:
```bash
# Start PostgreSQL
docker-compose -f tests/integration/docker-compose.test.yml up -d postgres-test

# Run tests
npm run test:integration -- database.spec.ts
```

### 4. Python Agent API Integration Tests

**File**: `agent-api.spec.ts`

**Tests**:
- Health check endpoints
- Agent discovery and listing
- Agent information retrieval
- Agent execution via HTTP
- Timeout handling
- Error responses and validation
- Cache management
- Concurrent request handling

**Requirements**:
- Python Agent API running on port 8000

**Run**:
```bash
# Start Python Agent API
cd libs/digital-agency/api
docker-compose up -d

# Run tests
cd ../../../
npm run test:integration -- agent-api.spec.ts
```

## Test Patterns

### Graceful Degradation

All tests check for service availability and skip gracefully if dependencies are not running:

```typescript
try {
  const result = await service.call();
  expect(result).toBeDefined();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    console.warn('Service not available, skipping test');
    return;
  }
  throw error;
}
```

### Cleanup

Tests clean up after themselves:

```typescript
beforeEach(async () => {
  await cleanAllQueues();
  await cleanTestData();
});

afterAll(async () => {
  await closeConnections();
});
```

### Concurrent Testing

Tests validate concurrent operations:

```typescript
const results = await Promise.all([
  service1.call(),
  service2.call(),
  service3.call(),
]);

expect(results).toHaveLength(3);
```

## CI/CD Integration

### GitHub Actions

Integration tests run in CI with full infrastructure:

```yaml
- name: Start test infrastructure
  run: |
    cd tests/integration
    docker-compose -f docker-compose.test.yml up -d
    sleep 10

- name: Run integration tests
  run: npm run test:integration
  env:
    TEST_POSTGRES_HOST: localhost
    TEST_REDIS_HOST: localhost
```

### Local Development

Run with local services:

```bash
# Terminal 1: Start services
make dev

# Terminal 2: Run integration tests
npm run test:integration:watch
```

## Debugging

### Verbose Logging

Enable detailed logs:

```bash
DEBUG=* npm run test:integration
```

### Inspect Failed Jobs

For queue tests:

```bash
# Connect to Redis
redis-cli -p 6380

# List failed jobs
KEYS bull:tasks:failed
HGETALL bull:tasks:failed:{job_id}
```

### Database Queries

For database tests:

```bash
# Connect to test database
psql -h localhost -p 5433 -U funnel_agents -d funnel_agents_test

# View test data
SELECT * FROM leads WHERE email LIKE '%integration-test%';
```

### Service Logs

Check service logs:

```bash
# Docker logs
docker-compose logs auth-service
docker-compose logs crm-service

# Local service logs
tail -f logs/auth-service.log
```

## Troubleshooting

### Port Conflicts

```bash
# Check if ports are in use
lsof -i :5433  # PostgreSQL
lsof -i :6380  # Redis

# Kill conflicting processes
kill -9 <PID>
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker ps | grep postgres-test

# Check PostgreSQL logs
docker logs funnel-agents-postgres-test

# Test connection
psql -h localhost -p 5433 -U funnel_agents -d funnel_agents_test
```

### Redis Connection Issues

```bash
# Verify Redis is running
docker ps | grep redis-test

# Test connection
redis-cli -h localhost -p 6380 ping
```

### Service Unavailable

```bash
# Check if services are running
make status

# Start required services
make start-auth
make start-crm
make start-agents
```

### Test Timeouts

Increase timeout for slow systems:

```typescript
// In test file
jest.setTimeout(120000); // 2 minutes

// Or per test
it('should handle slow operation', async () => {
  // test code
}, 60000); // 1 minute timeout
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data in `beforeEach` and `afterAll`
3. **Timeouts**: Set appropriate timeouts for network operations
4. **Error Handling**: Check for service availability before running tests
5. **Concurrency**: Use `runInBand` to avoid race conditions
6. **Real Dependencies**: Use actual Redis/PostgreSQL, not mocks
7. **Meaningful Assertions**: Test actual behavior, not just response structure

## Performance

Integration tests are slower than unit tests due to real I/O:

- **Microservices**: ~30-60 seconds
- **Queues**: ~60-90 seconds
- **Database**: ~30-45 seconds
- **Agent API**: ~45-60 seconds

**Total**: ~3-4 minutes for full suite

## Coverage

Integration tests complement unit tests by covering:

- Network communication
- Database transactions
- Queue processing
- Service interactions
- Error scenarios
- Timeout handling
- Concurrent operations

Target: 80%+ coverage of critical integration paths

## Contributing

When adding integration tests:

1. Follow existing patterns for service availability checks
2. Clean up test data properly
3. Use descriptive test names
4. Add timeouts for async operations
5. Document any special setup requirements
6. Update this README with new test suites

## Resources

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [TypeORM Testing](https://typeorm.io/#/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testcontainers](https://www.testcontainers.org/)

---

**Maintained by**: Backend Team
**Last Updated**: 2025-01-25
