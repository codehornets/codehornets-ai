import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowExecutionEngine } from '../engine/workflow-execution-engine';
/**
 * WebhookTriggerController - Handles webhook triggers for workflows
 * Exposes endpoints for external systems to trigger workflows
 */
export declare class WebhookTriggerController {
    private readonly workflowsRepository;
    private readonly executionEngine;
    private readonly logger;
    constructor(workflowsRepository: WorkflowsRepository, executionEngine: WorkflowExecutionEngine);
    /**
     * Trigger workflow by webhook path
     * POST /webhooks/:path
     */
    triggerByPath(path: string, payload: Record<string, any>, headers: Record<string, string>): Promise<{
        success: boolean;
        workflowId: string;
        workflowName: string;
        runId: string;
        status: import("../../workflow-runs/entities/workflow-run.entity").WorkflowRunStatus;
    }>;
    /**
     * Trigger workflow by workflow ID
     * POST /webhooks/workflow/:workflowId
     */
    triggerById(workflowId: string, payload: Record<string, any>, headers: Record<string, string>): Promise<{
        success: boolean;
        workflowId: string;
        workflowName: string;
        runId: string;
        status: import("../../workflow-runs/entities/workflow-run.entity").WorkflowRunStatus;
    }>;
}
