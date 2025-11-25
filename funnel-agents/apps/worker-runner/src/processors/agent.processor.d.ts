import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '@funnelagents/infrastructure';
import { HttpService } from '@nestjs/axios';
interface AgentJobData {
    type: 'execute_agent';
    payload: {
        agentId: string;
        taskDescription?: string;
        inputData?: any;
        context?: Record<string, any>;
        workspaceId?: string;
    };
    metadata?: {
        correlationId?: string;
        timestamp?: Date;
        source?: string;
    };
}
interface AgentJobResult {
    success: boolean;
    data?: {
        agentId: string;
        output: any;
        executionTime: number;
        tokensUsed?: number;
        modelUsed?: string;
    };
    error?: string;
}
export declare class AgentProcessor extends BaseQueueProcessor<AgentJobData> {
    private readonly agentsClient;
    private readonly httpService;
    private readonly serviceLogger;
    constructor(agentsClient: ClientProxy, httpService: HttpService);
    process(job: Job<AgentJobData>): Promise<AgentJobResult>;
    private fetchAgentDetails;
    private updateAgentStats;
    private invokeAgent;
}
export {};
