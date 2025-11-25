import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

export interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  nextNodes?: string[]; // For conditional branching
}

/**
 * Base interface for all node handlers
 */
export abstract class BaseNodeHandler {
  /**
   * Execute the node with the given context
   */
  abstract execute(
    node: WorkflowNode,
    context: WorkflowContext
  ): Promise<NodeExecutionResult>;

  /**
   * Validate node configuration
   */
  abstract validate(node: WorkflowNode): { valid: boolean; errors?: string[] };

  /**
   * Helper to resolve variables in node data
   */
  protected resolveNodeData(data: Record<string, any>, context: WorkflowContext): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        resolved[key] = context.evaluateExpression(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        resolved[key] = this.resolveNodeData(value, context);
      } else if (Array.isArray(value)) {
        resolved[key] = value.map(item =>
          typeof item === 'string' ? context.evaluateExpression(item) : item
        );
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Create a success result
   */
  protected success(output: any, nextNodes?: string[]): NodeExecutionResult {
    return {
      success: true,
      output,
      nextNodes,
    };
  }

  /**
   * Create a failure result
   */
  protected failure(error: string): NodeExecutionResult {
    return {
      success: false,
      error,
    };
  }
}
