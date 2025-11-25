import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowRunsRepository } from '../../workflow-runs/workflow-runs.repository';
import { WorkflowNode } from '../entities/workflow.entity';
import { WorkflowRun } from '../../workflow-runs/entities/workflow-run.entity';
import { WorkflowContext } from './workflow-context';
import { TriggerNodeHandler, AgentNodeHandler, ConditionNodeHandler, EmailNodeHandler, DelayNodeHandler, WebhookNodeHandler } from './node-handlers';
/**
 * WorkflowExecutionEngine - Main workflow execution engine
 * Orchestrates node execution, handles branching, and manages execution state
 */
export declare class WorkflowExecutionEngine {
    private readonly workflowsRepository;
    private readonly workflowRunsRepository;
    private readonly triggerNodeHandler;
    private readonly agentNodeHandler;
    private readonly conditionNodeHandler;
    private readonly emailNodeHandler;
    private readonly delayNodeHandler;
    private readonly webhookNodeHandler;
    private readonly logger;
    private readonly nodeHandlers;
    constructor(workflowsRepository: WorkflowsRepository, workflowRunsRepository: WorkflowRunsRepository, triggerNodeHandler: TriggerNodeHandler, agentNodeHandler: AgentNodeHandler, conditionNodeHandler: ConditionNodeHandler, emailNodeHandler: EmailNodeHandler, delayNodeHandler: DelayNodeHandler, webhookNodeHandler: WebhookNodeHandler);
    /**
     * Main entry point - Execute a workflow by ID
     */
    executeWorkflow(workflowId: string, triggerData?: Record<string, any>): Promise<WorkflowRun>;
    /**
     * Execute workflow starting from a specific node
     */
    private executeFromNode;
    /**
     * Execute a single node with the given context
     */
    executeNode(node: WorkflowNode, context: WorkflowContext, workflowRun: WorkflowRun): Promise<any>;
    /**
     * Find the next nodes to execute based on edges and conditions
     */
    private findNextNodes;
    /**
     * Evaluate a condition string using the context
     */
    evaluateCondition(condition: string, context: WorkflowContext): boolean;
    /**
     * Update execution log in workflow run
     */
    private updateExecutionLog;
    /**
     * Handle different trigger types
     */
    handleTrigger(trigger: {
        type: string;
        workflowId: string;
    }, payload: Record<string, any>): Promise<WorkflowRun>;
    /**
     * Validate entire workflow before execution
     */
    validateWorkflow(workflowId: string): Promise<{
        valid: boolean;
        errors: string[];
    }>;
}
