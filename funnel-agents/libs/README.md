# FunnelAgents Shared Libraries

Shared libraries following Clean Architecture / Hexagonal Architecture principles, providing domain entities, application services, infrastructure implementations, and interface definitions for all FunnelAgents microservices.

## 📦 Library Structure

```
libs/
├── domain/              # Pure business logic (no dependencies)
│   ├── shared-kernel/   # Common types, base entities, value objects
│   ├── tasks/          # Task aggregate, events, repository interface
│   ├── agents/         # Agent aggregate, events, repository interface
│   ├── crm/            # CRM domain entities
│   ├── content/        # Content domain entities
│   ├── reports/        # Report domain entities
│   ├── campaigns/      # Campaign domain entities
│   ├── clients/        # Client domain entities
│   └── automations/    # Automation domain entities
│
├── application/         # Use cases, CQRS handlers, services
│   ├── tasks/          # Task commands, queries, service
│   ├── agents/         # Agent commands, queries, service
│   ├── crm/            # CRM use cases
│   ├── content/        # Content use cases
│   ├── reports/        # Report use cases
│   ├── campaigns/      # Campaign use cases
│   ├── clients/        # Client use cases
│   └── automations/    # Automation use cases
│
├── infrastructure/      # Technical implementations
│   ├── db/             # TypeORM entities, repositories, transactions
│   ├── cache/          # Redis caching service
│   ├── events/         # Event publisher, subscribers
│   ├── messaging/      # Message queue integration
│   ├── http/           # HTTP clients
│   ├── logging/        # Logging service
│   └── config/         # Configuration management
│
├── interfaces/          # API definitions, DTOs, controllers
│   ├── rest/           # REST controllers
│   ├── graphql/        # GraphQL resolvers (future)
│   └── dto/            # Data Transfer Objects
│
└── shared/             # Cross-cutting utilities
    └── utils/          # Helper functions
```

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Using in a Service

```typescript
// Example: tasks-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

// Domain
import { ITaskRepository } from '@funnelagents/domain';

// Application
import {
  TasksService,
  TaskCommandHandlers,
  TaskQueryHandlers
} from '@funnelagents/application';

// Infrastructure
import {
  TaskDbEntity,
  TaskRepository,
  CacheModule,
  EventPublisherService,
  TaskEventSubscriber
} from '@funnelagents/infrastructure';

// Interface
import { TasksController } from '@funnelagents/interfaces';

@Module({
  imports: [
    CqrsModule,
    EventEmitterModule.forRoot(),
    TypeOrmModule.forFeature([TaskDbEntity]),
    CacheModule,
  ],
  providers: [
    // Service
    TasksService,

    // Repository
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },

    // CQRS Handlers
    ...TaskCommandHandlers,
    ...TaskQueryHandlers,

    // Events
    EventPublisherService,
    TaskEventSubscriber,
  ],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
```

## 📚 Key Components

### Domain Layer

#### Task Entity
```typescript
import { Task, TaskType, TaskPriority } from '@funnelagents/domain';

const task = Task.create({
  title: 'Qualify lead',
  type: TaskType.LEAD_QUALIFICATION,
  priority: TaskPriority.HIGH,
  agentId: 'agent-uuid',
  inputData: { leadId: '123' },
  metadata: { workspaceId: 'workspace-1' },
  config: {
    timeout: 300000,
    retryPolicy: { maxRetries: 3, retryDelay: 1000 }
  }
});

// Business methods
task.start('agent-uuid');
task.complete({ success: true, score: 85 });
task.fail('Error message');
task.cancel('User requested');
task.retry();

// Events are automatically emitted
const events = task.domainEvents; // TaskCreatedEvent, TaskStartedEvent, etc.
```

### Application Layer

#### Using TasksService
```typescript
import { TasksService } from '@funnelagents/application';
import { TaskStatus, TaskPriority, TaskType } from '@funnelagents/domain';

@Injectable()
class MyService {
  constructor(private readonly tasksService: TasksService) {}

  async createAndExecuteTask() {
    // Create task
    const result = await this.tasksService.createTask({
      title: 'Process lead',
      type: TaskType.LEAD_QUALIFICATION,
      priority: TaskPriority.HIGH,
      agentId: 'agent-uuid',
      inputData: { leadId: '123' },
    });

    // Execute task
    await this.tasksService.executeTask(result.id);

    // Complete task
    await this.tasksService.completeTask(result.id, {
      success: true,
      qualified: true,
    });

    // Query tasks
    const tasks = await this.tasksService.listTasks({
      status: TaskStatus.COMPLETED,
      page: 1,
      limit: 10,
    });

    return tasks;
  }
}
```

#### Direct CQRS Usage
```typescript
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTaskCommand, GetTaskQuery } from '@funnelagents/application';

@Injectable()
class DirectCqrsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute() {
    // Execute command
    const result = await this.commandBus.execute(
      new CreateTaskCommand(
        'Task title',
        TaskType.LEAD_QUALIFICATION,
        TaskPriority.HIGH,
        'agent-uuid',
      )
    );

    // Execute query
    const task = await this.queryBus.execute(
      new GetTaskQuery(result.id)
    );

    return task;
  }
}
```

### Infrastructure Layer

#### Using CacheService
```typescript
import { CacheService } from '@funnelagents/infrastructure';

@Injectable()
class MyCachedService {
  constructor(private readonly cache: CacheService) {}

  async getCachedData(key: string) {
    // Get or set pattern
    return this.cache.getOrSet(
      key,
      async () => {
        // Fetch from database
        return await this.fetchFromDb();
      },
      { ttl: 3600, prefix: 'myservice' }
    );
  }

  async invalidateCache(pattern: string) {
    await this.cache.deletePattern(`myservice:${pattern}*`);
  }
}
```

#### Using TransactionManager
```typescript
import { TransactionManagerFactory } from '@funnelagents/infrastructure';

@Injectable()
class MyTransactionalService {
  constructor(
    private readonly txFactory: TransactionManagerFactory,
  ) {}

  async performMultiEntityOperation() {
    return this.txFactory.executeInTransaction(async (manager) => {
      // All operations use the same transaction
      const task = await manager.save(TaskDbEntity, taskData);
      const agent = await manager.save(AgentDbEntity, agentData);
      return { task, agent };
    });
  }
}
```

### Interface Layer

#### REST API Endpoints (TasksController)

```http
# Create task
POST /tasks
Content-Type: application/json
{
  "title": "Qualify lead",
  "type": "lead_qualification",
  "priority": "high",
  "agentId": "agent-uuid",
  "inputData": { "leadId": "123" }
}

# List tasks with filters
GET /tasks?status=pending&priority=high&page=1&limit=10

# Get single task
GET /tasks/{id}

# Update task
PUT /tasks/{id}
Content-Type: application/json
{
  "priority": "urgent"
}

# Execute task
POST /tasks/{id}/execute

# Complete task
POST /tasks/{id}/complete
Content-Type: application/json
{
  "outputData": { "success": true, "score": 85 }
}

# Fail task
POST /tasks/{id}/fail
Content-Type: application/json
{
  "error": "Agent timeout"
}

# Cancel task
POST /tasks/{id}/cancel
Content-Type: application/json
{
  "reason": "User requested"
}

# Retry task
POST /tasks/{id}/retry

# Delete task
DELETE /tasks/{id}
```

## 🎯 Design Patterns

### Domain-Driven Design (DDD)
- **Aggregates**: Task, Agent, Lead, etc.
- **Value Objects**: UniqueId, Email, Money, etc.
- **Domain Events**: All state changes emit events
- **Repository Pattern**: Abstract data access

### CQRS (Command Query Responsibility Segregation)
- **Commands**: Modify state (CreateTask, UpdateTask, etc.)
- **Queries**: Read state (GetTask, ListTasks, etc.)
- **Handlers**: Process commands/queries
- **Service Facade**: TasksService wraps CommandBus/QueryBus

### Event-Driven Architecture
- **Domain Events**: Emitted by aggregates
- **Event Subscribers**: React to domain events
- **Event Publisher**: Publish to message bus
- **Eventual Consistency**: Across aggregates

### Clean Architecture / Hexagonal Architecture
- **Domain** (inner): Business logic, no dependencies
- **Application** (middle): Use cases, depends on domain
- **Infrastructure** (outer): Technical implementations
- **Interface** (outer): API definitions

## 🧪 Testing

### Unit Tests Example
```typescript
import { Task, TaskType, TaskPriority, TaskStatus } from '@funnelagents/domain';

describe('Task Entity', () => {
  it('should create task with pending status', () => {
    const task = Task.create({
      title: 'Test task',
      type: TaskType.LEAD_QUALIFICATION,
      priority: TaskPriority.HIGH,
      agentId: 'agent-1',
      metadata: {},
      config: {},
    });

    expect(task.status).toBe(TaskStatus.PENDING);
    expect(task.domainEvents).toHaveLength(1);
    expect(task.domainEvents[0].eventType).toBe('task.created');
  });

  it('should transition to running when started', () => {
    const task = Task.create(/* ... */);
    task.start();

    expect(task.status).toBe(TaskStatus.RUNNING);
    expect(task.startedAt).toBeDefined();
  });

  it('should emit TaskStartedEvent when started', () => {
    const task = Task.create(/* ... */);
    task.clearEvents(); // Clear creation event
    task.start();

    const events = task.domainEvents;
    expect(events).toHaveLength(2); // Started + StatusChanged
    expect(events[0].eventType).toBe('task.started');
  });
});
```

### Integration Test Example
```typescript
import { Test } from '@nestjs/testing';
import { TasksService } from '@funnelagents/application';
import { TaskStatus, TaskPriority, TaskType } from '@funnelagents/domain';

describe('Tasks Integration', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [/* ... */],
      providers: [/* ... */],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should complete full task lifecycle', async () => {
    // Create
    const created = await service.createTask({
      title: 'Test task',
      type: TaskType.LEAD_QUALIFICATION,
      priority: TaskPriority.HIGH,
      agentId: 'agent-1',
    });

    // Execute
    await service.executeTask(created.id);
    let task = await service.getTask(created.id);
    expect(task.status).toBe(TaskStatus.RUNNING);

    // Complete
    await service.completeTask(created.id, { success: true });
    task = await service.getTask(created.id);
    expect(task.status).toBe(TaskStatus.COMPLETED);
  });
});
```

## 📖 API Documentation

Swagger/OpenAPI documentation is automatically generated from controller decorators.

Access at: `http://localhost:3000/api/docs` (when running a service)

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=funnel_agents
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# App
NODE_ENV=development
PORT=3000
```

## 🏗️ Architecture Principles

1. **Dependency Inversion**: High-level modules don't depend on low-level modules
2. **Single Responsibility**: Each class has one reason to change
3. **Open/Closed**: Open for extension, closed for modification
4. **Interface Segregation**: Many specific interfaces vs. one general interface
5. **Liskov Substitution**: Subtypes must be substitutable for their base types

## 📝 Code Style

- Use TypeScript strict mode
- Follow NestJS conventions
- Use dependency injection
- Prefer composition over inheritance
- Write tests for all business logic
- Document public APIs with JSDoc

## 🚨 Common Issues

### Issue: "Cannot find module '@funnelagents/domain'"
**Solution**: Build the libraries first
```bash
npm run build
```

### Issue: "ITaskRepository is not a constructor"
**Solution**: Inject interface symbol, not the interface itself
```typescript
@Inject('ITaskRepository')
private readonly repository: ITaskRepository
```

### Issue: Redis connection errors in development
**Solution**: CacheService gracefully degrades if Redis unavailable. Check logs.

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

## 🤝 Contributing

1. Follow existing patterns and conventions
2. Write tests for new features
3. Update documentation
4. Use conventional commits
5. Keep domain layer pure (no infrastructure dependencies)

## 📄 License

MIT
