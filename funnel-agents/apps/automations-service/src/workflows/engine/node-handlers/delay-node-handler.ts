import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

/**
 * DelayNodeHandler - Waits for a specified duration before continuing
 * Supports milliseconds, seconds, minutes, hours, and days
 */
@Injectable()
export class DelayNodeHandler extends BaseNodeHandler {
  private readonly logger = new Logger(DelayNodeHandler.name);

  async execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const resolvedData = this.resolveNodeData(node.data, context);
      const { duration, unit } = resolvedData;

      if (!duration) {
        return this.failure('Delay duration is required');
      }

      const delayMs = this.convertToMilliseconds(duration, unit || 'seconds');

      if (delayMs < 0) {
        return this.failure('Delay duration must be positive');
      }

      if (delayMs > 86400000) {
        // Max 24 hours
        return this.failure('Delay duration cannot exceed 24 hours');
      }

      this.logger.log(`Delaying execution for ${delayMs}ms (${duration} ${unit})`, {
        nodeId: node.id,
      });

      const startTime = Date.now();

      // Perform the actual delay
      await this.delay(delayMs);

      const endTime = Date.now();
      const actualDelay = endTime - startTime;

      const output = {
        duration,
        unit: unit || 'seconds',
        delayMs,
        actualDelayMs: actualDelay,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date(endTime).toISOString(),
      };

      this.logger.log(`Delay completed`, { nodeId: node.id, actualDelay });

      return this.success(output);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Delay execution failed: ${errorMessage}`, error.stack);
      return this.failure(`Delay execution failed: ${errorMessage}`);
    }
  }

  /**
   * Convert duration to milliseconds based on unit
   */
  private convertToMilliseconds(duration: number, unit: string): number {
    const multipliers: Record<string, number> = {
      milliseconds: 1,
      ms: 1,
      seconds: 1000,
      s: 1000,
      minutes: 60000,
      m: 60000,
      hours: 3600000,
      h: 3600000,
      days: 86400000,
      d: 86400000,
    };

    const multiplier = multipliers[unit.toLowerCase()];

    if (multiplier === undefined) {
      throw new Error(
        `Invalid delay unit: ${unit}. Must be one of: milliseconds, seconds, minutes, hours, days`
      );
    }

    return duration * multiplier;
  }

  /**
   * Promise-based delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validate(node: WorkflowNode): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!node.data.duration) {
      errors.push('Delay duration is required');
    }

    if (node.data.duration && typeof node.data.duration !== 'number') {
      errors.push('Duration must be a number');
    }

    if (node.data.duration && node.data.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    const validUnits = ['milliseconds', 'ms', 'seconds', 's', 'minutes', 'm', 'hours', 'h', 'days', 'd'];

    if (node.data.unit && !validUnits.includes(node.data.unit.toLowerCase())) {
      errors.push(`Invalid unit. Must be one of: ${validUnits.join(', ')}`);
    }

    // Check max duration (24 hours)
    if (node.data.duration && node.data.unit) {
      try {
        const ms = this.convertToMilliseconds(node.data.duration, node.data.unit);
        if (ms > 86400000) {
          errors.push('Duration cannot exceed 24 hours');
        }
      } catch (error) {
        // Validation error already added above
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
