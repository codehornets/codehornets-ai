import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '@funnelagents/infrastructure';
import { HttpService } from '@nestjs/axios';
interface WorkflowJobData {
    type: 'execute_workflow';
    payload: {
        workflowRunId: string;
        workflowId: string;
        triggerData?: any;
    };
    metadata?: {
        correlationId?: string;
        timestamp?: Date;
        source?: string;
    };
}
interface WorkflowJobResult {
    success: boolean;
    data?: {
        workflowRunId: string;
        status: string;
        executionTime: number;
        nodesExecuted: number;
    };
    error?: string;
}
export declare class WorkflowProcessor extends BaseQueueProcessor<WorkflowJobData> {
    private readonly automationsClient;
    private readonly agentsClient;
    private readonly httpService;
    private readonly serviceLogger;
    constructor(automationsClient: ClientProxy, agentsClient: ClientProxy, httpService: HttpService);
    process(job: Job<WorkflowJobData>): Promise<WorkflowJobResult>;
    private executeWorkflow;
    private executeNodeChain;
    private executeAgentNode;
    private executeConditionNode;
    private executeDelayNode;
    private executeWebhookNode;
    private executeEmailNode;
    private evaluateCondition;
    private resolveValue;
    private mapInputData;
    private fetchWorkflow;
    private fetchWorkflowRun;
    private updateWorkflowRunStatus;
    private fetchAgentDetails;
    private invokeAgent;
}
export {};
