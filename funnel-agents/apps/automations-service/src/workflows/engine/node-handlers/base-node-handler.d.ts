import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';
export interface NodeExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    nextNodes?: string[];
}
/**
 * Base interface for all node handlers
 */
export declare abstract class BaseNodeHandler {
    /**
     * Execute the node with the given context
     */
    abstract execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult>;
    /**
     * Validate node configuration
     */
    abstract validate(node: WorkflowNode): {
        valid: boolean;
        errors?: string[];
    };
    /**
     * Helper to resolve variables in node data
     */
    protected resolveNodeData(data: Record<string, any>, context: WorkflowContext): Record<string, any>;
    /**
     * Create a success result
     */
    protected success(output: any, nextNodes?: string[]): NodeExecutionResult;
    /**
     * Create a failure result
     */
    protected failure(error: string): NodeExecutionResult;
}
