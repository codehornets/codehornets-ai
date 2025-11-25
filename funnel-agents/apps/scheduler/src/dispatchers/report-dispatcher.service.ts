import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';

@Injectable()
export class ReportDispatcherService {
  private readonly logger = new Logger(ReportDispatcherService.name);

  constructor(
    @Inject('REPORTS_SERVICE')
    private readonly reportsClient: ClientProxy,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Dispatch report generation with distributed locking
   */
  async dispatch(task: ScheduledTask): Promise<any> {
    this.logger.log(
      `Dispatching report generation: ${task.target_id} from task ${task.id}`,
    );

    if (!task.target_id) {
      throw new Error('Report task missing target_id (report_id)');
    }

    // Acquire lock for report generation
    const lockKey = `report:dispatch:${task.target_id}:${task.id}`;
    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: task.timeout_seconds * 1000 + 5000,
      retryCount: 1,
      retryDelay: 500,
    });

    if (!lockResult.acquired) {
      this.logger.warn(
        `Report ${task.target_id} generation already in progress, skipping`
      );
      throw new Error('Report generation already in progress');
    }

    try {
      const payload = {
        report_id: task.target_id,
        triggered_by: 'scheduler',
        scheduled_task_id: task.id,
        config: task.config || {},
        timestamp: new Date().toISOString(),
      };

      const result = await firstValueFrom(
        this.reportsClient
          .send('report.generate', payload)
          .pipe(timeout(task.timeout_seconds * 1000)),
      );

      this.logger.log(
        `Report ${task.target_id} generation dispatched successfully`,
      );

      return {
        report_id: task.target_id,
        generation_id: result?.generation_id,
        status: result?.status,
        dispatched_at: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to dispatch report generation ${task.target_id}: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      if (lockResult.lockId) {
        await this.lockService.release(lockKey, lockResult.lockId);
      }
    }
  }

  /**
   * Check if reports service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.reportsClient.send('health.check', {}).pipe(timeout(5000)),
      );
      return true;
    } catch (error) {
      this.logger.warn('Reports service is not available');
      return false;
    }
  }
}
