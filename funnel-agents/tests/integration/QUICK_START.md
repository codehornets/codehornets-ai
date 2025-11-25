# Integration Tests - Quick Start

Fast guide to running integration tests.

## TL;DR

```bash
# One command - runs everything
make test-integration
```

## Step-by-Step

### 1. Start Test Infrastructure

```bash
make test-integration-infra-up
```

This starts:
- PostgreSQL on port 5433
- Redis on port 6380

### 2. Run Tests

```bash
# All tests
npm run test:integration

# Specific suite
npm run test:integration -- microservices.spec.ts
npm run test:integration -- queues.spec.ts
npm run test:integration -- database.spec.ts
npm run test:integration -- agent-api.spec.ts
```

### 3. Cleanup

```bash
make test-integration-infra-down
```

## Watch Mode

For active development:

```bash
# Terminal 1: Keep infrastructure running
make test-integration-infra-up

# Terminal 2: Run tests in watch mode
npm run test:integration:watch

# When done
make test-integration-infra-down
```

## What Each Suite Tests

| Suite | File | Tests | Duration |
|-------|------|-------|----------|
| **Microservices** | `microservices.spec.ts` | TCP communication | 30-60s |
| **Queues** | `queues.spec.ts` | BullMQ + Redis | 60-90s |
| **Database** | `database.spec.ts` | PostgreSQL ops | 30-45s |
| **Agent API** | `agent-api.spec.ts` | Python FastAPI | 45-60s |

## Requirements

### Minimum (for basic tests)

- Docker + Docker Compose
- Node.js 18+
- Ports 5433, 6380 available

### Full Suite

Add these for complete coverage:
- Auth Service running (port 3011)
- CRM Service running (port 3012)
- Agents Service running (port 3015)
- Python Agent API (port 8000)

## Common Issues

### Port Conflict

```bash
lsof -i :5433
kill -9 <PID>
```

### Infrastructure Not Ready

```bash
# Check status
docker ps | grep test

# View logs
make test-integration-logs

# Restart
make test-integration-infra-down
make test-integration-infra-up
```

### Tests Timing Out

Edit `jest.integration.config.js`:

```javascript
testTimeout: 120000 // Increase to 2 minutes
```

## CI/CD

Tests run automatically on:
- Push to main/develop
- Pull requests
- Manual workflow dispatch

## More Info

See [README.md](./README.md) for comprehensive documentation.

---

**Quick Commands**

```bash
make test-integration              # Full run with auto cleanup
make test-integration-infra-up     # Start infrastructure
make test-integration-infra-down   # Stop infrastructure
npm run test:integration:watch     # Watch mode
```
