import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';

@Injectable()
export class AgentDispatcherService {
  private readonly logger = new Logger(AgentDispatcherService.name);

  constructor(
    @Inject('TASKS_SERVICE')
    private readonly tasksClient: ClientProxy,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Dispatch agent task creation/execution with distributed locking
   */
  async dispatch(task: ScheduledTask): Promise<any> {
    this.logger.log(
      `Dispatching agent task: ${task.target_id} from task ${task.id}`,
    );

    // Acquire lock for agent task dispatch
    const lockKey = `agent:dispatch:${task.target_id}:${task.id}`;
    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: task.timeout_seconds * 1000 + 5000,
      retryCount: 1,
      retryDelay: 500,
    });

    if (!lockResult.acquired) {
      this.logger.warn(
        `Agent task ${task.target_id} dispatch already in progress, skipping`
      );
      throw new Error('Agent task dispatch already in progress');
    }

    try {
      const payload = {
        agent_id: task.target_id,
        triggered_by: 'scheduler',
        scheduled_task_id: task.id,
        task_data: task.config || {},
        timestamp: new Date().toISOString(),
      };

      const result = await firstValueFrom(
        this.tasksClient
          .send('task.create', payload)
          .pipe(timeout(task.timeout_seconds * 1000)),
      );

      this.logger.log(
        `Agent task for ${task.target_id} dispatched successfully: ${result?.task_id}`,
      );

      return {
        agent_id: task.target_id,
        task_id: result?.task_id,
        status: result?.status,
        dispatched_at: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to dispatch agent task ${task.target_id}: ${err.message}`,
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
   * Check if tasks service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.tasksClient.send('health.check', {}).pipe(timeout(5000)),
      );
      return true;
    } catch (error) {
      this.logger.warn('Tasks service is not available');
      return false;
    }
  }
}
