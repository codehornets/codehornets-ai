import { TaskType, TaskPriority, TaskStatus } from '@funnelagents/domain';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    type: TaskType;
    priority: TaskPriority;
    agentId: string;
    inputData?: Record<string, any>;
    metadata?: {
        workspaceId?: string;
        campaignId?: string;
        clientId?: string;
        tags?: string[];
        source?: string;
    };
    config?: {
        timeout?: number;
        retryPolicy?: {
            maxRetries: number;
            retryDelay: number;
            backoffMultiplier?: number;
        };
        requiresApproval?: boolean;
        notifyOnCompletion?: boolean;
        notificationChannels?: string[];
    };
    scheduledFor?: Date;
}
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    agentId?: string;
    inputData?: Record<string, any>;
    metadata?: {
        workspaceId?: string;
        campaignId?: string;
        clientId?: string;
        tags?: string[];
    };
    config?: {
        timeout?: number;
        retryPolicy?: {
            maxRetries: number;
            retryDelay: number;
            backoffMultiplier?: number;
        };
        requiresApproval?: boolean;
        notifyOnCompletion?: boolean;
    };
    scheduledFor?: Date;
}
export declare class ExecuteTaskDto {
    agentId?: string;
}
export declare class CompleteTaskDto {
    outputData: Record<string, any>;
}
export declare class FailTaskDto {
    error: string;
}
export declare class CancelTaskDto {
    reason: string;
    cancelledBy?: string;
}
export declare class TaskQueryDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    agentId?: string;
    workspaceId?: string;
    campaignId?: string;
    clientId?: string;
    tags?: string[];
}
