import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { BaseNodeHandler, NodeExecutionResult } from './base-node-handler';
import { WorkflowNode } from '../../entities/workflow.entity';
import { WorkflowContext } from '../workflow-context';

/**
 * AgentNodeHandler - Invokes agents via agents-service
 * Calls the agents service API to execute an agent with given input
 */
@Injectable()
export class AgentNodeHandler extends BaseNodeHandler {
  private readonly logger = new Logger(AgentNodeHandler.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    super();
  }

  async execute(node: WorkflowNode, context: WorkflowContext): Promise<NodeExecutionResult> {
    try {
      const resolvedData = this.resolveNodeData(node.data, context);
      const { agentId, agentName, input, timeout, parameters } = resolvedData;

      if (!agentId && !agentName) {
        return this.failure('Either agentId or agentName must be provided');
      }

      const agentsServiceUrl = this.configService.get<string>(
        'AGENTS_SERVICE_URL',
        'http://localhost:3001'
      );

      const requestPayload = {
        input: input || {},
        parameters: parameters || {},
        workflowContext: context.toJSON(),
      };

      this.logger.log(`Invoking agent ${agentId || agentName} with input`, requestPayload);

      // Make HTTP call to agents service
      const endpoint = agentId
        ? `${agentsServiceUrl}/api/agents/${agentId}/execute`
        : `${agentsServiceUrl}/api/agents/by-name/${agentName}/execute`;

      const response = await firstValueFrom(
        this.httpService.post(endpoint, requestPayload, {
          timeout: timeout || 30000, // Default 30 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const output = {
        agentId: agentId || response.data.agentId,
        agentName: agentName || response.data.agentName,
        result: response.data.result,
        executionTime: response.data.executionTime,
        metadata: response.data.metadata,
      };

      this.logger.log(`Agent execution completed successfully`, { agentId, output });

      return this.success(output);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || String(error);
      this.logger.error(`Agent execution failed: ${errorMessage}`, error.stack);
      return this.failure(`Agent execution failed: ${errorMessage}`);
    }
  }

  validate(node: WorkflowNode): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (!node.data.agentId && !node.data.agentName) {
      errors.push('Either agentId or agentName must be provided');
    }

    if (node.data.timeout && typeof node.data.timeout !== 'number') {
      errors.push('Timeout must be a number (milliseconds)');
    }

    if (node.data.timeout && node.data.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms (1 second)');
    }

    if (node.data.timeout && node.data.timeout > 300000) {
      errors.push('Timeout must not exceed 300000ms (5 minutes)');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
