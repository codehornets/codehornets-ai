import { Module } from '@nestjs/common';
import { CronJobsService } from './cron-jobs.service';
import { ScheduledTasksModule } from '../scheduled-tasks/scheduled-tasks.module';
import { DispatchersModule } from '../dispatchers/dispatchers.module';

@Module({
  imports: [ScheduledTasksModule, DispatchersModule],
  providers: [CronJobsService],
  exports: [CronJobsService],
})
export class CronJobsModule {}
