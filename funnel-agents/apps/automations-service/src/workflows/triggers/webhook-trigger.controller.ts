import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowExecutionEngine } from '../engine/workflow-execution-engine';

/**
 * WebhookTriggerController - Handles webhook triggers for workflows
 * Exposes endpoints for external systems to trigger workflows
 */
@Controller('webhooks')
export class WebhookTriggerController {
  private readonly logger = new Logger(WebhookTriggerController.name);

  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly executionEngine: WorkflowExecutionEngine
  ) {}

  /**
   * Trigger workflow by webhook path
   * POST /webhooks/:path
   */
  @Post(':path')
  @HttpCode(HttpStatus.OK)
  async triggerByPath(
    @Param('path') path: string,
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, string>
  ) {
    this.logger.log(`Webhook trigger received: ${path}`);

    // Find workflows with matching webhook path
    const workflows = await this.workflowsRepository.findAll({
      status: 'active',
      trigger_type: 'webhook',
    });

    const matchingWorkflow = workflows.find(
      workflow => workflow.trigger_config?.webhookPath === path
    );

    if (!matchingWorkflow) {
      throw new NotFoundException(`No active workflow found for webhook path: ${path}`);
    }

    // Validate webhook secret if configured
    if (matchingWorkflow.trigger_config?.webhookSecret) {
      const providedSecret = headers['x-webhook-secret'] || headers['authorization'];
      if (providedSecret !== matchingWorkflow.trigger_config.webhookSecret) {
        this.logger.warn(`Invalid webhook secret for path: ${path}`);
        throw new NotFoundException(`No active workflow found for webhook path: ${path}`);
      }
    }

    // Execute workflow with webhook payload
    const triggerData = {
      webhookPath: path,
      payload,
      headers,
      receivedAt: new Date().toISOString(),
    };

    const workflowRun = await this.executionEngine.executeWorkflow(
      matchingWorkflow.id,
      triggerData
    );

    return {
      success: true,
      workflowId: matchingWorkflow.id,
      workflowName: matchingWorkflow.name,
      runId: workflowRun.id,
      status: workflowRun.status,
    };
  }

  /**
   * Trigger workflow by workflow ID
   * POST /webhooks/workflow/:workflowId
   */
  @Post('workflow/:workflowId')
  @HttpCode(HttpStatus.OK)
  async triggerById(
    @Param('workflowId') workflowId: string,
    @Body() payload: Record<string, any>,
    @Headers() headers: Record<string, string>
  ) {
    this.logger.log(`Webhook trigger by ID: ${workflowId}`);

    const workflow = await this.workflowsRepository.findById(workflowId);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    if (workflow.status !== 'active') {
      throw new NotFoundException(`Workflow ${workflowId} is not active`);
    }

    if (workflow.trigger_type !== 'webhook') {
      throw new NotFoundException(`Workflow ${workflowId} is not a webhook trigger`);
    }

    // Validate webhook secret if configured
    if (workflow.trigger_config?.webhookSecret) {
      const providedSecret = headers['x-webhook-secret'] || headers['authorization'];
      if (providedSecret !== workflow.trigger_config.webhookSecret) {
        this.logger.warn(`Invalid webhook secret for workflow: ${workflowId}`);
        throw new NotFoundException(`Workflow ${workflowId} not found`);
      }
    }

    // Execute workflow with webhook payload
    const triggerData = {
      webhookPath: workflow.trigger_config?.webhookPath,
      payload,
      headers,
      receivedAt: new Date().toISOString(),
    };

    const workflowRun = await this.executionEngine.executeWorkflow(workflowId, triggerData);

    return {
      success: true,
      workflowId: workflow.id,
      workflowName: workflow.name,
      runId: workflowRun.id,
      status: workflowRun.status,
    };
  }
}
