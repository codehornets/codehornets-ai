import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowExecutionEngine } from '../engine/workflow-execution-engine';
import { Workflow } from '../entities/workflow.entity';
/**
 * ScheduledTriggerService - Manages scheduled workflow triggers
 * Integrates with NestJS scheduler to run workflows on cron schedules
 */
export declare class ScheduledTriggerService implements OnModuleInit {
    private readonly schedulerRegistry;
    private readonly workflowsRepository;
    private readonly executionEngine;
    private readonly logger;
    private readonly scheduledWorkflows;
    constructor(schedulerRegistry: SchedulerRegistry, workflowsRepository: WorkflowsRepository, executionEngine: WorkflowExecutionEngine);
    /**
     * Initialize scheduled workflows on module startup
     */
    onModuleInit(): Promise<void>;
    /**
     * Load all active scheduled workflows and register cron jobs
     */
    loadScheduledWorkflows(): Promise<void>;
    /**
     * Schedule a workflow to run on cron schedule
     */
    scheduleWorkflow(workflow: Workflow): Promise<void>;
    /**
     * Remove a workflow from the schedule
     */
    unscheduleWorkflow(workflowId: string): void;
    /**
     * Reschedule a workflow (useful when workflow is updated)
     */
    rescheduleWorkflow(workflowId: string): Promise<void>;
    /**
     * Get all scheduled workflows
     */
    getScheduledWorkflows(): string[];
    /**
     * Check if a workflow is scheduled
     */
    isScheduled(workflowId: string): boolean;
    /**
     * Reload all schedules (useful for admin operations)
     */
    reloadSchedules(): Promise<void>;
    /**
     * Validate a cron schedule string
     */
    validateSchedule(schedule: string): {
        valid: boolean;
        error?: string;
    };
}
