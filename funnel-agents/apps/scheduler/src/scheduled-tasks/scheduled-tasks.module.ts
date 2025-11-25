import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledTask } from './entities/scheduled-task.entity';
import { TaskExecution } from './entities/task-execution.entity';
import { ScheduledTasksService } from './scheduled-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledTask, TaskExecution])],
  providers: [ScheduledTasksService],
  exports: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
