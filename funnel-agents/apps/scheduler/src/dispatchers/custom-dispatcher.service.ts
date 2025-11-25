import { Injectable, Logger } from '@nestjs/common';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';

@Injectable()
export class CustomDispatcherService {
  private readonly logger = new Logger(CustomDispatcherService.name);

  constructor(private readonly lockService: DistributedLockService) {}

  /**
   * Dispatch custom scheduled task with distributed locking
   * This is a placeholder for custom task logic
   */
  async dispatch(task: ScheduledTask): Promise<any> {
    this.logger.log(`Dispatching custom task: ${task.id} (${task.name})`);

    // Acquire lock for custom task dispatch
    const lockKey = `custom:dispatch:${task.id}`;
    const lockResult = await this.lockService.acquire(lockKey, {
      ttl: task.timeout_seconds * 1000 + 5000,
      retryCount: 1,
      retryDelay: 500,
    });

    if (!lockResult.acquired) {
      this.logger.warn(
        `Custom task ${task.id} dispatch already in progress, skipping`
      );
      throw new Error('Custom task dispatch already in progress');
    }

    try {
      // Custom tasks can be extended based on config
      const taskConfig = task.config || {};

      // Example: Execute custom logic based on config
      if (taskConfig.type === 'webhook') {
        return await this.executeWebhook(task);
      } else if (taskConfig.type === 'script') {
        return await this.executeScript(task);
      } else if (taskConfig.type === 'notification') {
        return await this.sendNotification(task);
      }

      this.logger.warn(`Unknown custom task type: ${taskConfig.type}`);

      return {
        task_id: task.id,
        status: 'completed',
        message: 'Custom task executed with default handler',
        executed_at: new Date().toISOString(),
      };
    } finally {
      if (lockResult.lockId) {
        await this.lockService.release(lockKey, lockResult.lockId);
      }
    }
  }

  /**
   * Execute webhook call
   */
  private async executeWebhook(task: ScheduledTask): Promise<any> {
    this.logger.log(`Executing webhook for task ${task.id}`);

    const config = task.config as any;
    const url = config.webhook_url;
    const method = config.method || 'POST';
    const headers = config.headers || {};
    const body = config.body || {};

    if (!url) {
      throw new Error('Webhook URL not provided in task config');
    }

    try {
      // In a real implementation, use axios or fetch
      this.logger.log(`Would call webhook: ${method} ${url}`);

      return {
        task_id: task.id,
        type: 'webhook',
        url,
        status: 'success',
        executed_at: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Webhook execution failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Execute custom script
   */
  private async executeScript(task: ScheduledTask): Promise<any> {
    this.logger.log(`Executing script for task ${task.id}`);

    const config = task.config as any;
    const scriptPath = config.script_path;
    const args = config.args || [];

    if (!scriptPath) {
      throw new Error('Script path not provided in task config');
    }

    try {
      // In a real implementation, use child_process.spawn or similar
      this.logger.log(`Would execute script: ${scriptPath} ${args.join(' ')}`);

      return {
        task_id: task.id,
        type: 'script',
        script_path: scriptPath,
        status: 'success',
        executed_at: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Script execution failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(task: ScheduledTask): Promise<any> {
    this.logger.log(`Sending notification for task ${task.id}`);

    const config = task.config as any;
    const notificationType = config.notification_type; // email, slack, discord, etc.
    const recipients = config.recipients || [];
    const message = config.message || '';

    if (!recipients.length) {
      throw new Error('No recipients provided in task config');
    }

    try {
      // In a real implementation, integrate with notification services
      this.logger.log(
        `Would send ${notificationType} notification to: ${recipients.join(', ')}`,
      );

      return {
        task_id: task.id,
        type: 'notification',
        notification_type: notificationType,
        recipients_count: recipients.length,
        status: 'success',
        executed_at: new Date().toISOString(),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Notification sending failed: ${err.message}`);
      throw err;
    }
  }
}
