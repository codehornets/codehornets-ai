import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowExecutionEngine } from '../engine/workflow-execution-engine';
import { Workflow } from '../entities/workflow.entity';

/**
 * ScheduledTriggerService - Manages scheduled workflow triggers
 * Integrates with NestJS scheduler to run workflows on cron schedules
 */
@Injectable()
export class ScheduledTriggerService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledTriggerService.name);
  private readonly scheduledWorkflows = new Map<string, CronJob>();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly executionEngine: WorkflowExecutionEngine
  ) {}

  /**
   * Initialize scheduled workflows on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing scheduled workflows');
    await this.loadScheduledWorkflows();
  }

  /**
   * Load all active scheduled workflows and register cron jobs
   */
  async loadScheduledWorkflows(): Promise<void> {
    try {
      const workflows = await this.workflowsRepository.findAll({
        status: 'active',
        trigger_type: 'scheduled',
      });

      this.logger.log(`Found ${workflows.length} scheduled workflow(s)`);

      for (const workflow of workflows) {
        await this.scheduleWorkflow(workflow);
      }
    } catch (error: any) {
      this.logger.error('Failed to load scheduled workflows', error.stack);
    }
  }

  /**
   * Schedule a workflow to run on cron schedule
   */
  async scheduleWorkflow(workflow: Workflow): Promise<void> {
    try {
      const schedule = workflow.trigger_config?.schedule;
      if (!schedule) {
        this.logger.warn(
          `Workflow ${workflow.id} has no schedule configured, skipping`
        );
        return;
      }

      // Remove existing job if any
      this.unscheduleWorkflow(workflow.id);

      // Create cron job
      const job = new CronJob(
        schedule,
        async () => {
          this.logger.log(`Executing scheduled workflow: ${workflow.id} (${workflow.name})`);

          try {
            const triggerData = {
              schedule,
              scheduledTime: new Date().toISOString(),
              triggerType: 'scheduled',
            };

            const workflowRun = await this.executionEngine.executeWorkflow(
              workflow.id,
              triggerData
            );

            this.logger.log(
              `Scheduled workflow executed: ${workflow.id}, run: ${workflowRun.id}`
            );
          } catch (error: any) {
            this.logger.error(
              `Scheduled workflow execution failed: ${workflow.id}`,
              error.stack
            );
          }
        },
        null,
        true, // Start immediately
        workflow.trigger_config?.timezone || 'UTC'
      );

      // Store job reference
      this.scheduledWorkflows.set(workflow.id, job);
      this.schedulerRegistry.addCronJob(workflow.id, job);

      this.logger.log(
        `Workflow ${workflow.id} scheduled with cron: ${schedule} (${workflow.trigger_config?.timezone || 'UTC'})`
      );
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to schedule workflow ${workflow.id}: ${errorMessage}`,
        error.stack
      );
    }
  }

  /**
   * Remove a workflow from the schedule
   */
  unscheduleWorkflow(workflowId: string): void {
    if (this.scheduledWorkflows.has(workflowId)) {
      const job = this.scheduledWorkflows.get(workflowId);
      job?.stop();
      this.scheduledWorkflows.delete(workflowId);

      try {
        this.schedulerRegistry.deleteCronJob(workflowId);
      } catch (error) {
        // Job might not exist in registry
      }

      this.logger.log(`Workflow ${workflowId} unscheduled`);
    }
  }

  /**
   * Reschedule a workflow (useful when workflow is updated)
   */
  async rescheduleWorkflow(workflowId: string): Promise<void> {
    this.logger.log(`Rescheduling workflow: ${workflowId}`);

    const workflow = await this.workflowsRepository.findById(workflowId);
    if (!workflow) {
      this.logger.warn(`Workflow ${workflowId} not found, cannot reschedule`);
      return;
    }

    if (workflow.status === 'active' && workflow.trigger_type === 'scheduled') {
      await this.scheduleWorkflow(workflow);
    } else {
      this.unscheduleWorkflow(workflowId);
    }
  }

  /**
   * Get all scheduled workflows
   */
  getScheduledWorkflows(): string[] {
    return Array.from(this.scheduledWorkflows.keys());
  }

  /**
   * Check if a workflow is scheduled
   */
  isScheduled(workflowId: string): boolean {
    return this.scheduledWorkflows.has(workflowId);
  }

  /**
   * Reload all schedules (useful for admin operations)
   */
  async reloadSchedules(): Promise<void> {
    this.logger.log('Reloading all scheduled workflows');

    // Clear existing schedules
    for (const workflowId of this.scheduledWorkflows.keys()) {
      this.unscheduleWorkflow(workflowId);
    }

    // Reload from database
    await this.loadScheduledWorkflows();
  }

  /**
   * Validate a cron schedule string
   */
  validateSchedule(schedule: string): { valid: boolean; error?: string } {
    try {
      // Try to create a cron job to validate
      new CronJob(schedule, () => {}, null, false);
      return { valid: true };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { valid: false, error: errorMessage };
    }
  }
}
