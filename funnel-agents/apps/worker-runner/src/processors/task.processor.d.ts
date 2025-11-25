import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '@funnelagents/infrastructure';
import { HttpService } from '@nestjs/axios';
interface TaskJobData {
    type: 'execute_task';
    payload: {
        taskId: string;
        workspaceId?: string;
    };
    metadata?: {
        correlationId?: string;
        timestamp?: Date;
        source?: string;
    };
}
interface TaskJobResult {
    success: boolean;
    data?: {
        taskId: string;
        status: string;
        output?: any;
        executionTime?: number;
    };
    error?: string;
}
export declare class TaskProcessor extends BaseQueueProcessor<TaskJobData> {
    private readonly tasksClient;
    private readonly agentsClient;
    private readonly httpService;
    private readonly serviceLogger;
    constructor(tasksClient: ClientProxy, agentsClient: ClientProxy, httpService: HttpService);
    process(job: Job<TaskJobData>): Promise<TaskJobResult>;
    private fetchTaskDetails;
    private fetchAgentDetails;
    private updateTaskStatus;
    private invokeAgent;
}
export {};
