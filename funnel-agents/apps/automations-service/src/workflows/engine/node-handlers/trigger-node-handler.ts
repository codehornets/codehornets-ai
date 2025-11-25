import { Injectable } from '@nestjs/common';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

/**
 * TriggerNodeHandler - Handles trigger nodes (manual, webhook, event, scheduled)
 * Trigger nodes are the entry point of a workflow and initialize the context
 */
@Injectable()
export class TriggerNodeHandler extends BaseNodeHandler {
  async execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const { triggerType, webhookPath, eventName, schedule } = node.data;

      // Trigger nodes just pass through the trigger data
      const output: Record<string, any> = {
        triggerType: triggerType || 'manual',
        triggeredAt: new Date().toISOString(),
        data: context.getTriggerData(),
      };

      // Add trigger-specific metadata
      if (triggerType === 'webhook' && webhookPath) {
        output.webhookPath = webhookPath;
      }

      if (triggerType === 'event' && eventName) {
        output.eventName = eventName;
      }

      if (triggerType === 'scheduled' && schedule) {
        output.schedule = schedule;
      }

      return this.success(output);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.failure(`Trigger execution failed: ${errorMessage}`);
    }
  }

  validate(node: WorkflowNode): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!node.data.triggerType) {
      errors.push('Trigger type is required');
    }

    const validTriggerTypes = ['manual', 'webhook', 'event', 'scheduled'];
    if (node.data.triggerType && !validTriggerTypes.includes(node.data.triggerType)) {
      errors.push(`Invalid trigger type. Must be one of: ${validTriggerTypes.join(', ')}`);
    }

    if (node.data.triggerType === 'webhook' && !node.data.webhookPath) {
      errors.push('Webhook path is required for webhook triggers');
    }

    if (node.data.triggerType === 'event' && !node.data.eventName) {
      errors.push('Event name is required for event triggers');
    }

    if (node.data.triggerType === 'scheduled' && !node.data.schedule) {
      errors.push('Schedule is required for scheduled triggers');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
