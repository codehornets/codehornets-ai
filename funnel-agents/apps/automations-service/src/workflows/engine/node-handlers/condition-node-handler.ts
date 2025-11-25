import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

/**
 * ConditionNodeHandler - Evaluates boolean expressions for conditional branching
 * Supports various operators and determines which path to take
 */
@Injectable()
export class ConditionNodeHandler extends BaseNodeHandler {
  private readonly logger = new Logger(ConditionNodeHandler.name);

  async execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const resolvedData = this.resolveNodeData(node.data, context);
      const { condition, operator, leftValue, rightValue, conditions } = resolvedData;

      let result: boolean;

      if (conditions && Array.isArray(conditions)) {
        // Multiple conditions with AND/OR logic
        result = this.evaluateMultipleConditions(conditions, resolvedData.logicalOperator || 'AND');
      } else if (condition) {
        // Simple boolean condition
        result = this.evaluateSimpleCondition(condition, context);
      } else if (operator) {
        // Comparison condition
        result = this.evaluateComparison(leftValue, operator, rightValue);
      } else {
        return this.failure('No valid condition configuration found');
      }

      this.logger.log(`Condition evaluated to: ${result}`, { nodeId: node.id });

      // Return the branch to take (typically handled by edges with conditions)
      const output = {
        result,
        condition: condition || { operator, leftValue, rightValue },
        evaluatedAt: new Date().toISOString(),
      };

      return this.success(output);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Condition evaluation failed: ${errorMessage}`, error.stack);
      return this.failure(`Condition evaluation failed: ${errorMessage}`);
    }
  }

  /**
   * Evaluate a simple boolean condition string
   */
  private evaluateSimpleCondition(condition: string, context: WorkflowContext): boolean {
    // For safety, we'll use a simple comparison parser instead of eval
    // Supports: ===, !==, >, <, >=, <=, &&, ||

    // Remove whitespace and evaluate
    const trimmed = condition.trim();

    // Handle boolean values
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Check for logical operators
    if (trimmed.includes('&&')) {
      const parts = trimmed.split('&&');
      return parts.every(part => this.evaluateSimpleCondition(part.trim(), context));
    }

    if (trimmed.includes('||')) {
      const parts = trimmed.split('||');
      return parts.some(part => this.evaluateSimpleCondition(part.trim(), context));
    }

    // Check for comparison operators
    const comparisonRegex = /(.+?)(===|!==|>=|<=|>|<)(.+)/;
    const match = trimmed.match(comparisonRegex);

    if (match) {
      const left = context.evaluateExpression(match[1].trim());
      const operator = match[2];
      const right = context.evaluateExpression(match[3].trim());

      return this.evaluateComparison(left, operator, right);
    }

    // If no operators, treat as a variable lookup
    const value = context.evaluateExpression(trimmed);
    return Boolean(value);
  }

  /**
   * Evaluate a comparison between two values
   */
  private evaluateComparison(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case '===':
      case '==':
        return left === right;
      case '!==':
      case '!=':
        return left !== right;
      case '>':
        return Number(left) > Number(right);
      case '<':
        return Number(left) < Number(right);
      case '>=':
        return Number(left) >= Number(right);
      case '<=':
        return Number(left) <= Number(right);
      case 'contains':
        return String(left).includes(String(right));
      case 'startsWith':
        return String(left).startsWith(String(right));
      case 'endsWith':
        return String(left).endsWith(String(right));
      case 'matches':
        return new RegExp(String(right)).test(String(left));
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Evaluate multiple conditions with AND/OR logic
   */
  private evaluateMultipleConditions(
    conditions: Array<{ leftValue: any; operator: string; rightValue: any }>,
    logicalOperator: 'AND' | 'OR'
  ): boolean {
    const results = conditions.map(cond =>
      this.evaluateComparison(cond.leftValue, cond.operator, cond.rightValue)
    );

    if (logicalOperator === 'AND') {
      return results.every(r => r === true);
    } else {
      return results.some(r => r === true);
    }
  }

  validate(node: WorkflowNode): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    const hasCondition = node.data.condition;
    const hasOperator = node.data.operator && node.data.leftValue !== undefined;
    const hasConditions = node.data.conditions && Array.isArray(node.data.conditions);

    if (!hasCondition && !hasOperator && !hasConditions) {
      errors.push('Condition node must have either condition, operator configuration, or conditions array');
    }

    if (hasOperator) {
      const validOperators = ['===', '!==', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith', 'matches'];
      if (!validOperators.includes(node.data.operator)) {
        errors.push(`Invalid operator. Must be one of: ${validOperators.join(', ')}`);
      }

      if (node.data.rightValue === undefined) {
        errors.push('rightValue is required when using operator');
      }
    }

    if (hasConditions) {
      if (!Array.isArray(node.data.conditions)) {
        errors.push('conditions must be an array');
      } else {
        node.data.conditions.forEach((cond: any, index: number) => {
          if (!cond.operator || cond.leftValue === undefined || cond.rightValue === undefined) {
            errors.push(`Condition at index ${index} is missing required fields (operator, leftValue, rightValue)`);
          }
        });
      }

      if (node.data.logicalOperator && !['AND', 'OR'].includes(node.data.logicalOperator)) {
        errors.push('logicalOperator must be either AND or OR');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
