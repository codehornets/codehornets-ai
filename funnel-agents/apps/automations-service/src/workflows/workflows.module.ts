import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { WorkflowsRepository } from './workflows.repository';
import { Workflow } from './entities/workflow.entity';
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow]),
    forwardRef(() => WorkflowRunsModule),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowsRepository],
  exports: [WorkflowsService, WorkflowsRepository],
})
export class WorkflowsModule {}
