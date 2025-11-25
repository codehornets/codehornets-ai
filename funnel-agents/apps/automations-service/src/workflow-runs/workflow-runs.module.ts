import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowRunsController } from './workflow-runs.controller';
import { WorkflowRunsService } from './workflow-runs.service';
import { WorkflowRunsRepository } from './workflow-runs.repository';
import { WorkflowRun } from './entities/workflow-run.entity';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkflowRun]),
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [WorkflowRunsController],
  providers: [WorkflowRunsService, WorkflowRunsRepository],
  exports: [WorkflowRunsService, WorkflowRunsRepository],
})
export class WorkflowRunsModule {}
