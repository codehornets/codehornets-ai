import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowsRepository } from './workflows.repository';
import { Workflow } from './entities/workflow.entity';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module';

// Engine
import { WorkflowExecutionEngine } from './engine/workflow-execution-engine';

// Node handlers
import {
  TriggerNodeHandler,
  AgentNodeHandler,
  ConditionNodeHandler,
  EmailNodeHandler,
  DelayNodeHandler,
  WebhookNodeHandler,
} from './engine/node-handlers';

// Triggers
import { WebhookTriggerController } from './triggers/webhook-trigger.controller';
import { EventTriggerListener } from './triggers/event-trigger.listener';
import { ScheduledTriggerService } from './triggers/scheduled-trigger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    forwardRef(() => WorkflowRunsModule),
  ],
  controllers: [WorkflowsController, WebhookTriggerController],
  providers: [
    // Core services
    WorkflowsService,
    WorkflowsRepository,

    // Execution engine
    WorkflowExecutionEngine,

    // Node handlers
    TriggerNodeHandler,
    AgentNodeHandler,
    ConditionNodeHandler,
    EmailNodeHandler,
    DelayNodeHandler,
    WebhookNodeHandler,

    // Trigger handlers
    EventTriggerListener,
    ScheduledTriggerService,
  ],
  exports: [WorkflowsService, WorkflowsRepository, WorkflowExecutionEngine],
})
export class WorkflowsModule {}
