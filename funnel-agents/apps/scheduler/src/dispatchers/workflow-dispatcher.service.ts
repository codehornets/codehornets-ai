import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';

@Injectable()
export class WorkflowDispatcherService {
  private readonly logger = new Logger(WorkflowDispatcherService.name);

  constructor(
    @Inject('AUTOMATIONS_SERVICE')
    private readonly automationsClient: ClientProxy,
    private readonly lockService: DistributedLockService,
  ) {}

  /**
   * Dispatch workflow execution to automations service
   * Uses distributed locking to prevent duplicate workflow executions
   */
  async dispatch(task: ScheduledTask): Promise<any> {
    this.logger.log(
      `Dispatching workflow: ${task.target_id} from task ${task.id}`,
    );

    if (!task.target_id) {
      throw new Error('Workflow task missing target_id (workflow_id)');
    }

    // Acquire lock for workflow dispatch
    const lockKey = `workflow:dispatch:${task.target_id}:${task.id}`;
    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: task.timeout_seconds * 1000 + 5000, // Task timeout + 5s buffer
      retryCount: 1,
      retryDelay: 500,
    });

    if (!lockResult.acquired) {
      this.logger.warn(
        `Workflow ${task.target_id} dispatch already in progress, skipping`
      );
      throw new Error('Workflow dispatch already in progress');
    }

    try {
      const payload = {
        workflow_id: task.target_id,
        triggered_by: 'scheduler',
        scheduled_task_id: task.id,
        config: task.config || {},
        timestamp: new Date().toISOString(),
      };

      // Send message to automations service to start workflow
      const result = await firstValueFrom(
        this.automationsClient
          .send('workflow.execute', payload)
          .pipe(timeout(task.timeout_seconds * 1000)),
      );

      this.logger.log(
        `Workflow ${task.target_id} dispatched successfully: ${result?.execution_id}`,
      );

      return {
        workflow_id: task.target_id,
        execution_id: result?.execution_id,
        status: result?.status,
        dispatched_at: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to dispatch workflow ${task.target_id}: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      // Release lock
      if (lockResult.lockId) {
        await this.lockService.release(lockKey, lockResult.lockId);
      }
    }
  }

  /**
   * Check if workflow service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.automationsClient.send('health.check', {}).pipe(timeout(5000)),
      );
      return true;
    } catch (error) {
      this.logger.warn('Automations service is not available');
      return false;
    }
  }
}
