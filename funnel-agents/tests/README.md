# FunnelAgents Test Suite

Complete testing infrastructure for the FunnelAgents AI-powered multi-agent orchestration platform.

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run in watch mode (development)
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Test Organization

```
funnel-agents/
├── libs/shared/src/testing/          # Shared test utilities
│   ├── test-database.module.ts       # SQLite/PostgreSQL test DB
│   ├── mock-queue.module.ts          # Mock BullMQ queues
│   ├── test-utils.ts                 # Helpers and utilities
│   └── factories/                    # Entity factories
│       ├── user.factory.ts           # User test data
│       ├── lead.factory.ts           # Lead test data
│       ├── workflow.factory.ts       # Workflow test data
│       ├── task.factory.ts           # Task test data
│       ├── agent.factory.ts          # Agent test data
│       └── campaign.factory.ts       # Campaign test data
│
├── apps/*/src/**/*.spec.ts           # Unit tests (co-located)
└── apps/api-gateway/test/            # E2E tests
    ├── app.e2e-spec.ts               # Gateway integration
    └── critical-flows.e2e-spec.ts    # User journey tests
```

## Test Types

### Unit Tests
Fast, isolated tests for individual functions and services.

**Location**: `apps/*/src/**/*.spec.ts`

**Run**:
```bash
npm run test:unit
npm run test:services  # All services only
```

**Coverage**: 70%+ on average, 80%+ on critical paths

### Integration Tests
Tests with real database and service interactions.

**Location**: `apps/*/src/**/*.integration.spec.ts`

**Run**:
```bash
npm run test:integration
```

### E2E Tests
Full HTTP request/response testing through API Gateway.

**Location**: `apps/api-gateway/test/*.e2e-spec.ts`

**Run**:
```bash
npm run test:e2e          # API Gateway only
npm run test:e2e:all      # All E2E suites
```

## Available Commands

### Primary Test Commands
```bash
npm test                   # All tests
npm run test:unit          # Unit tests only
npm run test:e2e           # E2E tests only
npm run test:cov           # With coverage
```

### Development Commands
```bash
npm run test:watch         # Watch mode
npm run test:affected      # Only affected tests
npm run test:debug         # Debug mode
```

### Service-Specific Tests
```bash
npm run test:services      # All services
make test-auth             # Auth service
make test-crm              # CRM service
make test-campaigns        # Campaigns service
make test-automations      # Automations service
```

### CI Commands
```bash
npm run test:ci            # CI mode (strict)
npm run test:integration   # Integration tests
```

## Test Infrastructure

### Test Database Module

Provides fast, isolated database for testing:

```typescript
import { TestDatabaseModule } from '@funnelagents/shared/testing';

TestDatabaseModule.forRoot([User, Lead, Contact]);
```

**Features**:
- In-memory SQLite (default)
- PostgreSQL support (integration tests)
- Auto cleanup between tests
- TypeORM entity sync

### Mock Queue Module

Mock BullMQ without Redis:

```typescript
import { MockQueueModule } from '@funnelagents/shared/testing';

MockQueueModule.register(['emails', 'tasks']);
```

### Entity Factories

Generate test data with sensible defaults:

```typescript
import {
  createMockUser,
  createMockLead,
  createMockQualifiedLead,
  createMockWorkflow,
  createMockActiveWorkflow,
  createMockTask,
  createMockAgent,
  createMockCampaign,
} from '@funnelagents/shared/testing';

const user = createMockUser({ email: 'test@example.com' });
const lead = createMockQualifiedLead({ score: 85 });
const workflow = createMockActiveWorkflow();
```

**Factory Variants**:
- `createMock*()` - Basic entity
- `createMock*s(count)` - Multiple entities
- `createMock*Qualified()` - Specialized variants

### Test Utilities

Common helpers and mocks:

```typescript
import {
  createMockRepository,
  createMockJwtService,
  createMockConfigService,
  createMockLogger,
  testHelpers,
  waitFor,
} from '@funnelagents/shared/testing';

// Mock repository
const mockRepo = createMockRepository<User>();

// Mock services
const mockJwt = createMockJwtService();
const mockConfig = createMockConfigService();

// Random test data
const email = testHelpers.randomEmail();
const uuid = testHelpers.randomUuid();

// Wait for async conditions
await waitFor(() => task.status === 'completed');
```

## Writing Tests

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { createMockRepository, createMockLead } from '@funnelagents/shared/testing';

describe('LeadsService', () => {
  let service: LeadsService;
  let repository: any;

  beforeEach(async () => {
    const mockRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getRepositoryToken(Lead), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repository = module.get(getRepositoryToken(Lead));
  });

  it('should create a lead', async () => {
    const mockLead = createMockLead();
    repository.create.mockReturnValue(mockLead);
    repository.save.mockResolvedValue(mockLead);

    const result = await service.create({ name: 'Test', email: 'test@example.com' });

    expect(result).toEqual(mockLead);
    expect(repository.save).toHaveBeenCalled();
  });
});
```

### E2E Test Example

```typescript
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /auth/register', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'Test123!' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });
});
```

## Coverage

View coverage report:

```bash
# Generate coverage
npm run test:cov

# Open HTML report
open coverage/index.html
```

**Coverage Goals**:
- Branches: 70%+
- Functions: 70%+
- Lines: 70%+
- Statements: 70%+

**Critical Paths** (80%+):
- Authentication flows
- Lead qualification
- Workflow execution
- Campaign management

## CI/CD

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests
- Pre-commit hooks (affected tests)

**GitHub Actions**: `.github/workflows/tests.yml`

**Pipeline Stages**:
1. Unit Tests (Node 18.x, 20.x)
2. Integration Tests (PostgreSQL + Redis)
3. E2E Tests
4. Lint & Format
5. Coverage Report

## Debugging

### Run Specific Test
```bash
npm test -- --testNamePattern="should create"
npm test -- leads.service.spec.ts
```

### Debug Mode
```bash
npm run test:debug
```

Then attach your debugger to the Node process.

### Watch Mode
```bash
npm run test:watch
```

## Best Practices

1. **Test Isolation**: Use `beforeEach` and clear mocks
2. **Descriptive Names**: Start with "should"
3. **AAA Pattern**: Arrange, Act, Assert
4. **Single Behavior**: One assertion per test
5. **Mock External**: HTTP, database, queues
6. **Use Factories**: Consistent test data
7. **Type Safety**: Full TypeScript

## Troubleshooting

### Tests Timeout
```typescript
jest.setTimeout(10000);
```

### Port Conflicts
```bash
lsof -i :3000  # Check port usage
```

### Database Locks
```typescript
afterEach(async () => {
  await cleanDatabase(dataSource);
});
```

### Mock Issues
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Resources

- [Full Testing Guide](../TESTING.md)
- [Implementation Report](../TEST_IMPLEMENTATION_REPORT.md)
- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## Contributing

When adding features:
1. Write tests first (TDD)
2. Aim for 80%+ coverage
3. Add integration tests for critical paths
4. Update documentation
5. Run full suite before PR

---

**Test Count**: 70+ tests
**Coverage**: 70%+ average
**Services**: 7 microservices
**E2E Flows**: 3 complete journeys
