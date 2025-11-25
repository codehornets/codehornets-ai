import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';
/**
 * ConditionNodeHandler - Evaluates boolean expressions for conditional branching
 * Supports various operators and determines which path to take
 */
export declare class ConditionNodeHandler extends BaseNodeHandler {
    private readonly logger;
    execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult>;
    /**
     * Evaluate a simple boolean condition string
     */
    private evaluateSimpleCondition;
    /**
     * Evaluate a comparison between two values
     */
    private evaluateComparison;
    /**
     * Evaluate multiple conditions with AND/OR logic
     */
    private evaluateMultipleConditions;
    validate(node: WorkflowNode): {
        valid: boolean;
        errors?: string[];
    };
}
