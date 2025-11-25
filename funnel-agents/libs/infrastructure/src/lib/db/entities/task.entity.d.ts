import { BaseDbEntity } from './base.entity';
export declare class TaskDbEntity extends BaseDbEntity {
    title: string;
    description?: string;
    type: string;
    status: string;
    priority: string;
    agentId: string;
    inputData?: Record<string, any>;
    outputData?: Record<string, any>;
    executionLog: Array<{
        timestamp: string;
        level: string;
        message: string;
        metadata?: Record<string, any>;
    }>;
    executionContext: {
        agentId: string;
        agentName?: string;
        startedAt?: string;
        endedAt?: string;
        executionTimeMs?: number;
        attempts: number;
        maxRetries: number;
        lastError?: string;
    };
    metadata: {
        workspaceId?: string;
        campaignId?: string;
        clientId?: string;
        tags?: string[];
        source?: string;
        parentTaskId?: string;
        childTaskIds?: string[];
    };
    config: {
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
    workspaceId?: string;
    campaignId?: string;
    clientId?: string;
    scheduledFor?: Date;
    startedAt?: Date;
    completedAt?: Date;
    failedAt?: Date;
    cancelledAt?: Date;
    tags?: string[];
}
