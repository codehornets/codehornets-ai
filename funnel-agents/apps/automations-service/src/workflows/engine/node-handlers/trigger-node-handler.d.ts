import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';
/**
 * TriggerNodeHandler - Handles trigger nodes (manual, webhook, event, scheduled)
 * Trigger nodes are the entry point of a workflow and initialize the context
 */
export declare class TriggerNodeHandler extends BaseNodeHandler {
    execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult>;
    validate(node: WorkflowNode): {
        valid: boolean;
        errors?: string[];
    };
}
