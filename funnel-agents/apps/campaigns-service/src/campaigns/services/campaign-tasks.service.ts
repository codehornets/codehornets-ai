import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { TaskTemplate } from '../entities/campaign-template.entity';

export interface CreateTasksFromTemplateOptions {
  campaign_id: string;
  workspace_id?: string;
  tasks: TaskTemplate[];
  delay_between_tasks?: number; // milliseconds
}

export interface TaskCreationResult {
  campaign_id: string;
  total_tasks: number;
  created_tasks: Array<{
    task_id: string;
    title: string;
    status: string;
  }>;
  failed_tasks: Array<{
    title: string;
    error: string;
  }>;
}

@Injectable()
export class CampaignTasksService {
  private readonly logger = new Logger(CampaignTasksService.name);

  constructor(
    @Inject('TASKS_SERVICE')
    private readonly tasksClient: ClientProxy,
  ) {}

  /**
   * Create tasks from campaign template
   * Integrates with tasks-service via TCP
   */
  async createTasksFromTemplate(
    options: CreateTasksFromTemplateOptions,
  ): Promise<TaskCreationResult> {
    this.logger.log(
      `Creating ${options.tasks.length} tasks for campaign ${options.campaign_id}`,
    );

    const result: TaskCreationResult = {
      campaign_id: options.campaign_id,
      total_tasks: options.tasks.length,
      created_tasks: [],
      failed_tasks: [],
    };

    for (const taskTemplate of options.tasks) {
      try {
        const taskData = {
          title: taskTemplate.title,
          description: taskTemplate.description,
          workspace_id: options.workspace_id,
          campaign_id: options.campaign_id,
          agent_domain: taskTemplate.agent_domain,
          priority: taskTemplate.priority || 'medium',
          status: 'pending',
          metadata: {
            created_from_template: true,
            template_task: true,
          },
        };

        this.logger.debug(`Creating task: ${taskData.title}`);

        const response = await firstValueFrom(
          this.tasksClient.send('tasks.create', taskData).pipe(timeout(10000)),
        );

        result.created_tasks.push({
          task_id: response.id,
          title: taskData.title,
          status: response.status,
        });

        this.logger.log(`Task created successfully: ${response.id}`);

        // Add delay between tasks if specified
        if (options.delay_between_tasks) {
          await this.delay(options.delay_between_tasks);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Failed to create task "${taskTemplate.title}": ${err.message}`,
          err.stack,
        );

        result.failed_tasks.push({
          title: taskTemplate.title,
          error: err.message,
        });
      }
    }

    this.logger.log(
      `Task creation completed. Success: ${result.created_tasks.length}, Failed: ${result.failed_tasks.length}`,
    );

    return result;
  }

  /**
   * Create a single task via tasks-service
   */
  async createTask(taskData: {
    title: string;
    description?: string;
    workspace_id?: string;
    campaign_id: string;
    agent_domain?: string;
    priority?: string;
    due_date?: Date;
    assigned_to?: string;
  }): Promise<any> {
    this.logger.log(`Creating single task: ${taskData.title}`);

    try {
      const response = await firstValueFrom(
        this.tasksClient
          .send('tasks.create', {
            ...taskData,
            status: 'pending',
            metadata: {
              created_from_campaign: true,
            },
          })
          .pipe(timeout(10000)),
      );

      this.logger.log(`Task created: ${response.id}`);
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to create task: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Get tasks for a campaign
   */
  async getCampaignTasks(campaignId: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.tasksClient
          .send('tasks.findAll', {
            filters: { campaign_id: campaignId },
          })
          .pipe(timeout(10000)),
      );

      return response.data || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch tasks for campaign ${campaignId}`,
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    try {
      await firstValueFrom(
        this.tasksClient
          .send('tasks.update', {
            id: taskId,
            status,
          })
          .pipe(timeout(10000)),
      );

      this.logger.log(`Task ${taskId} status updated to ${status}`);
    } catch (error) {
      this.logger.error(
        `Failed to update task ${taskId}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  /**
   * Delete tasks for a campaign
   */
  async deleteCampaignTasks(campaignId: string): Promise<number> {
    try {
      const tasks = await this.getCampaignTasks(campaignId);

      let deletedCount = 0;
      for (const task of tasks) {
        try {
          await firstValueFrom(
            this.tasksClient
              .send('tasks.delete', { id: task.id })
              .pipe(timeout(5000)),
          );
          deletedCount++;
        } catch (error) {
          this.logger.warn(`Failed to delete task ${task.id}`);
        }
      }

      this.logger.log(
        `Deleted ${deletedCount} tasks for campaign ${campaignId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete tasks for campaign ${campaignId}`,
        error instanceof Error ? error.stack : error,
      );
      return 0;
    }
  }

  /**
   * Check if tasks service is available
   */
  async isTasksServiceAvailable(): Promise<boolean> {
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
