import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';
/**
 * DelayNodeHandler - Waits for a specified duration before continuing
 * Supports milliseconds, seconds, minutes, hours, and days
 */
export declare class DelayNodeHandler extends BaseNodeHandler {
    private readonly logger;
    execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult>;
    /**
     * Convert duration to milliseconds based on unit
     */
    private convertToMilliseconds;
    /**
     * Promise-based delay utility
     */
    private delay;
    validate(node: WorkflowNode): {
        valid: boolean;
        errors?: string[];
    };
}
