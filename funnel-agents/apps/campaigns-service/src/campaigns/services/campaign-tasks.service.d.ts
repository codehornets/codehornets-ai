import { ClientProxy } from '@nestjs/microservices';
import { TaskTemplate } from '../entities/campaign-template.entity';
export interface CreateTasksFromTemplateOptions {
    campaign_id: string;
    workspace_id?: string;
    tasks: TaskTemplate[];
    delay_between_tasks?: number;
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
export declare class CampaignTasksService {
    private readonly tasksClient;
    private readonly logger;
    constructor(tasksClient: ClientProxy);
    /**
     * Create tasks from campaign template
     * Integrates with tasks-service via TCP
     */
    createTasksFromTemplate(options: CreateTasksFromTemplateOptions): Promise<TaskCreationResult>;
    /**
     * Create a single task via tasks-service
     */
    createTask(taskData: {
        title: string;
        description?: string;
        workspace_id?: string;
        campaign_id: string;
        agent_domain?: string;
        priority?: string;
        due_date?: Date;
        assigned_to?: string;
    }): Promise<any>;
    /**
     * Get tasks for a campaign
     */
    getCampaignTasks(campaignId: string): Promise<any[]>;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: string): Promise<void>;
    /**
     * Delete tasks for a campaign
     */
    deleteCampaignTasks(campaignId: string): Promise<number>;
    /**
     * Check if tasks service is available
     */
    isTasksServiceAvailable(): Promise<boolean>;
    private delay;
}
