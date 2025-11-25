# FunnelAgents Testing Guide

## Overview

This document provides comprehensive information about the testing strategy and infrastructure for the FunnelAgents platform.

## Test Structure

```
funnel-agents/
├── libs/shared/src/testing/          # Shared test utilities
│   ├── test-database.module.ts       # Test database setup
│   ├── mock-queue.module.ts          # Mock BullMQ queues
│   ├── test-utils.ts                 # Test helpers and utilities
│   └── factories/                    # Entity factories
│       ├── user.factory.ts
│       ├── lead.factory.ts
│       ├── workflow.factory.ts
│       ├── task.factory.ts
│       ├── agent.factory.ts
│       └── campaign.factory.ts
├── apps/*/src/**/*.spec.ts           # Unit tests
└── apps/api-gateway/test/*.e2e-spec.ts  # E2E tests
```

## Running Tests

### All Tests
```bash
npm test                  # Run all tests
npm run test:cov          # Run all tests with coverage
npm run test:ci           # Run tests in CI mode
```

### Unit Tests
```bash
npm run test:unit         # Run only unit tests
npm run test:watch        # Run tests in watch mode
npm run test:affected     # Run tests for affected projects
npm run test:services     # Run tests for all services
```

### Integration Tests
```bash
npm run test:integration  # Run integration tests
```

### E2E Tests
```bash
npm run test:e2e          # Run E2E tests for API gateway
npm run test:e2e:all      # Run all E2E tests
```

### Coverage
```bash
npm run test:cov          # Generate coverage report
```

Coverage reports are generated in the `coverage/` directory and include:
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`

## Test Infrastructure

### Test Database Module

The `TestDatabaseModule` provides an in-memory SQLite database for fast, isolated tests:

```typescript
import { TestDatabaseModule } from '@funnelagents/shared/testing';
import { User } from './entities/user.entity';

TestDatabaseModule.forRoot([User, Lead, Contact]);
```

### Mock Queue Module

The `MockQueueModule` provides mock BullMQ queues without requiring Redis:

```typescript
import { MockQueueModule, createMockQueue } from '@funnelagents/shared/testing';

// In test module
MockQueueModule.register(['emails', 'notifications']);

// In tests
const mockQueue = createMockQueue('emails');
await mockQueue.add('send', { to: 'test@example.com' });
```

### Entity Factories

Factory functions create test entities with sensible defaults:

```typescript
import {
  createMockUser,
  createMockLead,
  createMockWorkflow,
  createMockTask,
  createMockAgent,
  createMockCampaign,
} from '@funnelagents/shared/testing';

const user = createMockUser({ email: 'test@example.com' });
const lead = createMockQualifiedLead({ score: 85 });
const workflow = createMockActiveWorkflow();
```

### Test Utilities

Helper functions for common testing patterns:

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
const mockConfig = createMockConfigService({ JWT_SECRET: 'test' });

// Test helpers
const email = testHelpers.randomEmail();
const uuid = testHelpers.randomUuid();

// Wait for async conditions
await waitFor(() => task.status === 'completed', 5000);
```

## Writing Tests

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { Lead } from './lead.entity';
import {
  createMockRepository,
  createMockLead,
} from '@funnelagents/shared/testing';

describe('LeadsService', () => {
  let service: LeadsService;
  let repository: jest.Mocked<Repository<Lead>>;

  const mockLead = createMockLead({ status: 'new' });

  beforeEach(async () => {
    const mockRepo = createMockRepository<Lead>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getRepositoryToken(Lead),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repository = module.get(getRepositoryToken(Lead));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should qualify a lead', async () => {
    repository.findOne.mockResolvedValue(mockLead);
    repository.save.mockImplementation((lead) => Promise.resolve(lead));

    const result = await service.qualify('lead-1');

    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('score_breakdown');
    expect(repository.save).toHaveBeenCalled();
  });
});
```

### Integration Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LeadsModule } from './leads.module';
import { TestDatabaseModule } from '@funnelagents/shared/testing';
import { Lead } from './lead.entity';

describe('LeadsService Integration', () => {
  let module: TestingModule;
  let service: LeadsService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestDatabaseModule.forRoot([Lead]),
        LeadsModule,
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should create and retrieve a lead', async () => {
    const createDto = {
      name: 'John Doe',
      email: 'john@example.com',
      source: 'website',
    };

    const created = await service.create(createDto);
    expect(created).toHaveProperty('id');

    const retrieved = await service.findOne(created.id);
    expect(retrieved.email).toBe(createDto.email);
  });
});
```

### E2E Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register and login', async () => {
    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
        name: 'Test User',
      })
      .expect(201);

    authToken = registerRes.body.access_token;

    // Login
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!',
      })
      .expect(200);
  });
});
```

## Test Coverage Goals

We aim for the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Critical paths should aim for 80%+ coverage:

- Authentication flows
- Lead qualification
- Workflow execution
- Campaign management
- Data validation

## CI/CD Integration

Tests run automatically on:

- **Push to main/develop**: Full test suite
- **Pull requests**: Full test suite + coverage report
- **Pre-commit hook**: Affected tests + linting

GitHub Actions workflow: `.github/workflows/tests.yml`

### CI Pipeline Stages

1. **Unit Tests**: Fast, isolated tests (Node 18.x, 20.x)
2. **Integration Tests**: Tests with PostgreSQL + Redis
3. **E2E Tests**: Full application tests
4. **Lint**: Code style and formatting
5. **Coverage**: Generate and report coverage

## Best Practices

### 1. Test Isolation

- Use `beforeEach` to reset state
- Clear mocks with `jest.clearAllMocks()`
- Use in-memory database for speed
- Don't share state between tests

### 2. Test Organization

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => {});
    it('should handle edge case', () => {});
    it('should throw error for invalid input', () => {});
  });
});
```

### 3. Naming Conventions

- Test files: `*.spec.ts` (unit), `*.e2e-spec.ts` (e2e)
- Test descriptions: Start with "should"
- Use descriptive variable names
- Keep tests focused on single behavior

### 4. Mock Strategy

- Mock external dependencies (HTTP, databases, queues)
- Don't mock the unit under test
- Use factory functions for consistent test data
- Keep mocks simple and maintainable

### 5. Assertions

```typescript
// Good: Specific assertions
expect(result).toHaveProperty('id');
expect(result.status).toBe('completed');
expect(result.score).toBeGreaterThan(50);

// Avoid: Vague assertions
expect(result).toBeTruthy();
expect(result).toBeDefined();
```

### 6. Async Testing

```typescript
// Good: Properly handle async
it('should complete async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

// Use waitFor for polling
await waitFor(() => queue.isEmpty(), 5000);
```

## Debugging Tests

### Run Specific Test

```bash
npm test -- --testNamePattern="should qualify a lead"
npm test -- leads.service.spec.ts
```

### Debug Mode

```bash
npm run test:debug
```

Then attach debugger to Node.js process.

### Watch Mode

```bash
npm run test:watch
```

Tests re-run automatically on file changes.

## Troubleshooting

### Tests Timeout

Increase timeout for slow tests:

```typescript
jest.setTimeout(10000); // 10 seconds

it('slow test', async () => {
  // ...
}, 10000);
```

### Database Conflicts

Ensure tests are isolated:

```typescript
afterEach(async () => {
  await cleanDatabase(dataSource);
});
```

### Port Conflicts

E2E tests may fail if ports are in use. Check:

```bash
lsof -i :3000  # Check if API gateway port is in use
```

### Mock Issues

Clear mocks between tests:

```typescript
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/testing)

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Aim for 80%+ coverage on new code
3. Add integration tests for critical paths
4. Update this documentation if needed
5. Run full test suite before PR

## Contact

For questions about testing:
- Check existing test examples in the codebase
- Review this documentation
- Ask in team chat or create an issue
