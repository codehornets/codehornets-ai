# Controllers Integration Guide

## Quick Setup Guide

### 1. Module Configuration

#### For API Gateway or Service Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

// Controllers
import { AgentsController } from '@funnelagents/interfaces';
import { LeadsController } from '@funnelagents/interfaces';
import { TasksController } from '@funnelagents/interfaces';

// Services
import { AgentsService, AgentExecutionService } from '@funnelagents/application';
import { LeadsService } from '@funnelagents/application';
import { TasksService } from '@funnelagents/application';

// Entities
import { Agent } from '@funnelagents/domain';
import { Lead } from './entities/lead.entity';
import { Task } from '@funnelagents/domain';

// Repositories
import { AgentRepository } from '@funnelagents/infrastructure';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, Lead, Task]),
    HttpModule,
  ],
  controllers: [
    AgentsController,
    LeadsController,
    TasksController,
  ],
  providers: [
    // Agent services
    AgentsService,
    AgentExecutionService,
    {
      provide: 'IAgentRepository',
      useClass: AgentRepository,
    },

    // Leads service
    LeadsService,

    // Tasks service
    TasksService,
  ],
})
export class ApiModule {}
```

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Agent Execution Service
PYTHON_AGENT_API_URL=http://localhost:8000/api/v1
AGENT_EXECUTION_TIMEOUT=300000
AGENT_EXECUTION_MAX_RETRIES=3

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=funnelagents
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

### 3. Database Setup

Ensure Lead entity is properly created:

```typescript
// apps/crm-service/src/leads/lead.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  company: string;

  @Column({ name: 'job_title', nullable: true })
  job_title: string;

  @Column()
  source: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number;

  @Column({ name: 'score_breakdown', type: 'jsonb', nullable: true })
  score_breakdown: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ name: 'campaign_id', nullable: true })
  campaign_id: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
```

### 4. Running Migrations

```bash
# Generate migration
npm run migration:generate -- -n CreateLeadsTable

# Run migration
npm run migration:run
```

### 5. Testing the Endpoints

#### Create an Agent
```bash
curl -X POST http://localhost:3000/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lead Qualifier Agent",
    "type": "lead_qualifier",
    "domain": "sales",
    "description": "Qualifies incoming leads based on ICP criteria",
    "capabilities": [
      {
        "name": "Lead Generation",
        "description": "Can generate qualified leads"
      }
    ],
    "config": {
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 2000
    }
  }'
```

#### Create a Lead
```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Acme Corp",
    "jobTitle": "CTO",
    "source": "website"
  }'
```

#### List Agents
```bash
curl -X GET "http://localhost:3000/agents?page=1&limit=10&status=idle"
```

#### Qualify a Lead
```bash
curl -X POST http://localhost:3000/leads/{leadId}/qualify \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "notes": "Strong fit for our ICP",
    "qualifiedBy": "agent-123"
  }'
```

#### Execute an Agent
```bash
curl -X POST http://localhost:3000/agents/{agentId}/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "task": "qualify_lead",
      "lead_id": "lead-123",
      "context": {
        "icp_criteria": ["B2B SaaS", "Series A+", "Tech industry"]
      }
    },
    "timeout": 300
  }'
```

### 6. Response Examples

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Lead Qualifier Agent",
    "type": "lead_qualifier",
    "status": "idle",
    "metrics": {
      "tasksCompleted": 15,
      "averageExecutionTime": 2500,
      "successRate": 93.33
    }
  }
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "John Doe", "email": "john@example.com" },
    { "id": "2", "name": "Jane Smith", "email": "jane@example.com" }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Lead with ID 123 not found"
  }
}
```

### 7. Swagger Documentation

Access Swagger UI at: `http://localhost:3000/api/docs`

To enable Swagger in your main.ts:

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('FunnelAgents API')
    .setDescription('API for managing agents, leads, and tasks')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log(`Application is running on: http://localhost:3000`);
  console.log(`Swagger docs available at: http://localhost:3000/api/docs`);
}
bootstrap();
```

### 8. Common Integration Issues

#### Issue: Cannot find module '@funnelagents/application'
**Solution**: Ensure path aliases are configured in tsconfig.json:
```json
{
  "compilerOptions": {
    "paths": {
      "@funnelagents/application": ["libs/application/src/index.ts"],
      "@funnelagents/interfaces": ["libs/interfaces/src/index.ts"],
      "@funnelagents/domain": ["libs/domain/src/index.ts"],
      "@funnelagents/infrastructure": ["libs/infrastructure/src/index.ts"]
    }
  }
}
```

#### Issue: LeadsService not found
**Solution**: Ensure LeadsService is exported from application layer:
```typescript
// libs/application/src/lib/crm/index.ts
export * from './leads.service';

// libs/application/src/index.ts
export * from './lib/crm';
```

#### Issue: Repository errors
**Solution**: Ensure entity is registered in TypeORM module:
```typescript
TypeOrmModule.forFeature([Lead])
```

### 9. Testing

#### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from '@funnelagents/application';
import { TasksService } from '@funnelagents/application';

describe('AgentsController', () => {
  let controller: AgentsController;
  let agentsService: AgentsService;

  const mockAgentsService = {
    findById: jest.fn(),
    create: jest.fn(),
    findWithFilters: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    delete: jest.fn(),
    executeAgent: jest.fn(),
  };

  const mockTasksService = {
    listTasks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<AgentsController>(AgentsController);
    agentsService = module.get<AgentsService>(AgentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return an agent', async () => {
      const mockAgent = {
        id: { value: '123' },
        name: 'Test Agent',
        type: 'lead_qualifier',
        status: 'idle',
      };

      mockAgentsService.findById.mockResolvedValue(mockAgent);

      const result = await controller.findOne('123');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('123');
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockAgentsService.findById.mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow('Agent with ID 999 not found');
    });
  });
});
```

### 10. Authentication Setup (Optional)

Add JWT guards to protect endpoints:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('agents')
@UseGuards(JwtAuthGuard)  // Protect all routes
export class AgentsController {
  // ... routes
}
```

Or protect individual routes:

```typescript
@Post()
@UseGuards(JwtAuthGuard)  // Protect only this route
async create(@Body() dto: CreateAgentDto) {
  // ...
}
```

## Summary

Follow these steps to integrate the controllers:

1. ✅ Configure module with proper providers
2. ✅ Set environment variables
3. ✅ Ensure database schema is created
4. ✅ Run migrations
5. ✅ Test endpoints with curl or Postman
6. ✅ Setup Swagger documentation
7. ✅ Add authentication guards (optional)
8. ✅ Write tests

All controllers are ready for production use!
