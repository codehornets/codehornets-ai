# FunnelAgents Shared Libraries - Quick Start

## 🚀 5-Minute Setup

### 1. Install Dependencies
```bash
cd /home/anga/workspace/beta/codehornets-ai/funnel-agents
npm install
```

### 2. Build Libraries
```bash
npm run build
```

### 3. Use in Your Service

```typescript
// my-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import from shared libs
import { TasksService, TaskCommandHandlers, TaskQueryHandlers } from '@funnelagents/application';
import { TaskDbEntity, TaskRepository, CacheModule } from '@funnelagents/infrastructure';
import { TasksController } from '@funnelagents/interfaces';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([TaskDbEntity]),
    CacheModule,
  ],
  providers: [
    TasksService,
    TaskRepository,
    ...TaskCommandHandlers,
    ...TaskQueryHandlers,
  ],
  controllers: [TasksController],
})
export class MyServiceModule {}
```

### 4. Create a Task

```typescript
import { TasksService } from '@funnelagents/application';
import { TaskType, TaskPriority } from '@funnelagents/domain';

@Injectable()
class MyService {
  constructor(private tasks: TasksService) {}

  async example() {
    // Create
    const task = await this.tasks.createTask({
      title: 'Process lead',
      type: TaskType.LEAD_QUALIFICATION,
      priority: TaskPriority.HIGH,
      agentId: 'agent-123',
      inputData: { leadId: 'lead-456' },
    });

    // Execute
    await this.tasks.executeTask(task.id);

    // Complete
    await this.tasks.completeTask(task.id, {
      success: true,
      qualified: true,
      score: 85,
    });
  }
}
```

## 📋 Common Operations

### Query Tasks
```typescript
// List all pending tasks
const tasks = await this.tasks.listTasks({
  status: TaskStatus.PENDING,
  page: 1,
  limit: 10,
});

// Filter by agent
const agentTasks = await this.tasks.listTasks({
  agentId: 'agent-123',
  status: TaskStatus.RUNNING,
});

// Get single task
const task = await this.tasks.getTask('task-id');
```

### Update Task
```typescript
// Change priority
await this.tasks.updateTask('task-id', {
  priority: TaskPriority.URGENT,
});

// Reassign agent
await this.tasks.updateTask('task-id', {
  agentId: 'different-agent-id',
});
```

### Handle Failures
```typescript
// Fail task (auto-retry if configured)
await this.tasks.failTask('task-id', 'Agent timeout');

// Manual retry
await this.tasks.retryTask('task-id');

// Cancel
await this.tasks.cancelTask('task-id', 'User requested');
```

### Use Cache
```typescript
import { CacheService } from '@funnelagents/infrastructure';

@Injectable()
class MyService {
  constructor(private cache: CacheService) {}

  async getCached() {
    return this.cache.getOrSet(
      'my-key',
      async () => {
        // Expensive operation
        return await this.fetchData();
      },
      { ttl: 3600 } // 1 hour
    );
  }
}
```

### Use Transactions
```typescript
import { TransactionManagerFactory } from '@funnelagents/infrastructure';

@Injectable()
class MyService {
  constructor(private txFactory: TransactionManagerFactory) {}

  async multiOperation() {
    return this.txFactory.executeInTransaction(async (manager) => {
      const task = await manager.save(TaskDbEntity, taskData);
      const log = await manager.save(LogEntity, logData);
      return { task, log };
    });
  }
}
```

## 🌐 REST API Endpoints

### Tasks
```bash
# Create
POST /tasks
{
  "title": "Qualify lead",
  "type": "lead_qualification",
  "priority": "high",
  "agentId": "agent-123"
}

# List
GET /tasks?status=pending&page=1&limit=10

# Get
GET /tasks/{id}

# Update
PUT /tasks/{id}
{
  "priority": "urgent"
}

# Execute
POST /tasks/{id}/execute

# Complete
POST /tasks/{id}/complete
{
  "outputData": { "success": true }
}

# Fail
POST /tasks/{id}/fail
{
  "error": "Agent timeout"
}

# Cancel
POST /tasks/{id}/cancel
{
  "reason": "User requested"
}

# Retry
POST /tasks/{id}/retry

# Delete
DELETE /tasks/{id}
```

## 📦 What's Included

### Domain Layer
- ✅ Task aggregate with business logic
- ✅ 9 domain events
- ✅ Repository interfaces
- ✅ Value objects (UniqueId, Email, Money, etc.)

### Application Layer
- ✅ 8 command handlers
- ✅ 2 query handlers
- ✅ TasksService facade
- ✅ CQRS integration

### Infrastructure Layer
- ✅ TypeORM repository
- ✅ Redis cache service
- ✅ Transaction manager
- ✅ Event publisher
- ✅ Event subscribers

### Interface Layer
- ✅ TasksController
- ✅ AgentsController (skeleton)
- ✅ LeadsController (skeleton)
- ✅ DTOs with validation

## 🔧 Environment Variables

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
```

## 📚 Documentation

- **Full Documentation**: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/libs/README.md`
- **Implementation Report**: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/libs/IMPLEMENTATION_REPORT.md`
- **Completion Summary**: `/home/anga/workspace/beta/codehornets-ai/funnel-agents/libs/COMPLETION_SUMMARY.md`

## 🐛 Troubleshooting

### "Cannot find module '@funnelagents/domain'"
```bash
npm run build
```

### Redis connection errors
CacheService gracefully degrades if Redis unavailable. Check logs for details.

### TypeORM errors
Ensure database is running and environment variables are set correctly.

## 🎓 Learn More

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)

## ✨ Key Features

- ✅ Clean Architecture
- ✅ Domain-Driven Design
- ✅ CQRS Pattern
- ✅ Event-Driven
- ✅ Redis Caching
- ✅ Transaction Support
- ✅ Full REST API
- ✅ Swagger Docs
- ✅ Input Validation
- ✅ Comprehensive Error Handling

---

**Ready to go!** Start using the shared libraries in your services.
