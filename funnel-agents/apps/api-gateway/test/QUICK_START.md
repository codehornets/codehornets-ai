# E2E Tests - Quick Start Guide

## TL;DR

```bash
# Start test environment
cd infrastructure/docker
docker-compose -f docker-compose.test.yml up -d

# Wait 20 seconds for services to be ready
sleep 20

# Run tests
cd ../../apps/api-gateway
npm test

# Cleanup
cd ../../infrastructure/docker
docker-compose -f docker-compose.test.yml down -v
```

## What Changed?

### Before (Bad)
- Tests silently skipped when services were down
- Accepted 404/502/503 as "success"
- Used `console.log` to hide failures
- No way to know if tests actually ran

### After (Good)
- **Fails immediately** if services unavailable with clear error message
- **Rejects service errors** (5xx status codes)
- **Proper assertions** verify business logic
- **Clear feedback** on what's wrong and how to fix it

## Common Commands

### Using Make
```bash
cd infrastructure/docker

# Full test workflow
make -f Makefile.test test

# Just run tests (services already up)
make -f Makefile.test test-quick

# Check if services are healthy
make -f Makefile.test test-health

# Start services only
make -f Makefile.test test-env-up

# Stop services
make -f Makefile.test test-env-down

# See all commands
make -f Makefile.test help
```

### Manual Commands
```bash
# Start services
cd infrastructure/docker
docker-compose -f docker-compose.test.yml up -d

# Check service status
docker-compose -f docker-compose.test.yml ps

# Watch logs
docker-compose -f docker-compose.test.yml logs -f auth-service-test

# Run specific test file
cd ../../apps/api-gateway
npm test -- test/app.e2e-spec.ts
npm test -- test/critical-flows.e2e-spec.ts

# Run specific test
npm test -- --testNamePattern="should register a new user"

# Run with verbose output
npm test -- --verbose

# Stop and cleanup
cd ../../infrastructure/docker
docker-compose -f docker-compose.test.yml down -v
```

## Troubleshooting

### Error: "Required services are not available"

**Solution:**
```bash
cd infrastructure/docker
docker-compose -f docker-compose.test.yml up -d
sleep 20  # Wait for services to start
```

### Error: "Port already in use"

**Solution:** Stop conflicting services
```bash
# Check what's using the port
lsof -i :3001

# Stop dev services
docker-compose down

# Or use different ports in .env
```

### Tests timeout

**Solution:** Check service health
```bash
# Manual health check
curl http://localhost:3001/health
curl http://localhost:3002/health

# Or use make command
cd infrastructure/docker
make -f Makefile.test test-health

# Check logs
docker-compose -f docker-compose.test.yml logs auth-service-test
```

### Database conflicts

**Solution:** Tests use isolated test database on port 5433
```bash
# Reset test database
cd infrastructure/docker
make -f Makefile.test test-db-reset

# Or restart services
docker-compose -f docker-compose.test.yml restart postgres-test
```

## Test Output Examples

### Success
```
All required services are healthy:
  ✓ Auth Service (localhost:3001)
  ✓ CRM Service (localhost:3002)
  ✓ Campaigns Service (localhost:3003)
  ✓ Agents Service (localhost:3005)
  ✓ Tasks Service (localhost:3006)
  ✓ Automations Service (localhost:3007)

 PASS  test/app.e2e-spec.ts (18.234 s)
 PASS  test/critical-flows.e2e-spec.ts (22.156 s)

Test Suites: 2 passed, 2 total
Tests:       46 passed, 46 total
```

### Failure (Services Down)
```
================================================================================
E2E TEST ENVIRONMENT ERROR: Required services are not available
================================================================================

The following services are required for E2E tests but are not responding:

  - Auth Service (localhost:3001)
    Error: connect ECONNREFUSED 127.0.0.1:3001

To run E2E tests, you must start the test environment first:

  cd infrastructure/docker
  docker-compose -f docker-compose.test.yml up -d

================================================================================
```

## Required Services

All these services must be running:

| Service | Port | Purpose |
|---------|------|---------|
| Auth | 3001 | Authentication |
| CRM | 3002 | Leads & Contacts |
| Campaigns | 3003 | Campaign Management |
| Agents | 3005 | AI Agents |
| Tasks | 3006 | Task Management |
| Automations | 3007 | Workflows |
| PostgreSQL | 5433 | Test Database |
| Redis | 6381 | Test Cache |

## Need More Info?

- **Full documentation**: `test/README.md`
- **Implementation details**: `test/E2E_TESTS_IMPLEMENTATION_REPORT.md`
- **Test helpers**: `test/test-helpers.ts`
- **Docker setup**: `infrastructure/docker/docker-compose.test.yml`

## Key Files

```
apps/api-gateway/test/
├── README.md                           # Full documentation
├── QUICK_START.md                      # This file
├── E2E_TESTS_IMPLEMENTATION_REPORT.md  # Detailed report
├── test-helpers.ts                     # Test utilities
├── app.e2e-spec.ts                     # Basic E2E tests
└── critical-flows.e2e-spec.ts          # Workflow tests

infrastructure/docker/
├── docker-compose.test.yml             # Test environment
└── Makefile.test                       # Make commands
```

## Best Practices

1. **Always start services first** - Tests will fail without them
2. **Use isolated test environment** - Don't test against dev services
3. **Check service health** - Use `make test-health` to verify
4. **Clean up after tests** - Use `docker-compose down -v` to remove volumes
5. **Read error messages** - They tell you exactly what's wrong

## Quick Reference

### Environment Check
```bash
# Are services running?
docker-compose -f docker-compose.test.yml ps

# Are services healthy?
make -f Makefile.test test-health

# What's in the logs?
docker-compose -f docker-compose.test.yml logs --tail=50
```

### Common Tasks
```bash
# Fresh start
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
sleep 20
npm test

# Quick retest
npm test

# Debug specific test
npm test -- --testNamePattern="authentication" --verbose
```

### Cleanup
```bash
# Stop services
docker-compose -f docker-compose.test.yml down

# Stop and remove volumes (fresh slate)
docker-compose -f docker-compose.test.yml down -v

# Remove test images (if needed)
docker-compose -f docker-compose.test.yml down --rmi local -v
```

## Pro Tips

1. **Keep test services running** during development - faster iteration
2. **Use `make test-quick`** when services are already up
3. **Check logs first** when tests fail mysteriously
4. **Reset database** if you suspect data corruption
5. **Use unique test data** - tests generate unique emails automatically

## Need Help?

1. Check if services are running: `docker-compose -f docker-compose.test.yml ps`
2. Check service logs: `docker-compose -f docker-compose.test.yml logs [service-name]`
3. Check service health: `make -f Makefile.test test-health`
4. Read the full docs: `test/README.md`
5. Check the implementation report: `test/E2E_TESTS_IMPLEMENTATION_REPORT.md`

---

**Remember**: These tests are designed to **fail loudly** when something is wrong. If you see an error, it means the tests are working correctly!
