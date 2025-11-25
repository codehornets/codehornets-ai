import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowExecutionEngine } from '../engine/workflow-execution-engine';

export interface WorkflowEvent {
  name: string;
  payload: Record<string, any>;
  timestamp: Date;
  source?: string;
}

/**
 * EventTriggerListener - Listens to application events and triggers workflows
 * Responds to domain events emitted by other services
 */
@Injectable()
export class EventTriggerListener {
  private readonly logger = new Logger(EventTriggerListener.name);

  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly executionEngine: WorkflowExecutionEngine
  ) {}

  /**
   * Listen to all workflow events
   * Events should be emitted with the pattern: workflow.trigger.<eventName>
   */
  @OnEvent('workflow.trigger.*', { async: true })
  async handleWorkflowTriggerEvent(event: WorkflowEvent): Promise<void> {
    this.logger.log(`Workflow trigger event received: ${event.name}`);

    try {
      // Find all active workflows listening to this event
      const workflows = await this.workflowsRepository.findAll({
        status: 'active',
        trigger_type: 'event',
      });

      const matchingWorkflows = workflows.filter(
        workflow => workflow.trigger_config?.eventName === event.name
      );

      if (matchingWorkflows.length === 0) {
        this.logger.log(`No workflows found for event: ${event.name}`);
        return;
      }

      this.logger.log(
        `Found ${matchingWorkflows.length} workflow(s) for event: ${event.name}`
      );

      // Execute all matching workflows
      const executions = matchingWorkflows.map(async workflow => {
        try {
          const triggerData = {
            eventName: event.name,
            payload: event.payload,
            timestamp: event.timestamp || new Date(),
            source: event.source,
          };

          const workflowRun = await this.executionEngine.executeWorkflow(
            workflow.id,
            triggerData
          );

          this.logger.log(
            `Workflow ${workflow.id} triggered by event ${event.name}, run: ${workflowRun.id}`
          );

          return workflowRun;
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Failed to execute workflow ${workflow.id} for event ${event.name}: ${errorMessage}`,
            error.stack
          );
          throw error;
        }
      });

      // Wait for all executions to complete (or fail)
      await Promise.allSettled(executions);
    } catch (error: any) {
      this.logger.error(
        `Error handling workflow trigger event: ${event.name}`,
        error.stack
      );
    }
  }

  /**
   * Listen to specific common events
   */

  @OnEvent('user.created', { async: true })
  async handleUserCreated(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'user.created',
      payload,
      timestamp: new Date(),
      source: 'user-service',
    });
  }

  @OnEvent('user.updated', { async: true })
  async handleUserUpdated(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'user.updated',
      payload,
      timestamp: new Date(),
      source: 'user-service',
    });
  }

  @OnEvent('lead.created', { async: true })
  async handleLeadCreated(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'lead.created',
      payload,
      timestamp: new Date(),
      source: 'leads-service',
    });
  }

  @OnEvent('lead.updated', { async: true })
  async handleLeadUpdated(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'lead.updated',
      payload,
      timestamp: new Date(),
      source: 'leads-service',
    });
  }

  @OnEvent('conversation.completed', { async: true })
  async handleConversationCompleted(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'conversation.completed',
      payload,
      timestamp: new Date(),
      source: 'conversations-service',
    });
  }

  @OnEvent('task.completed', { async: true })
  async handleTaskCompleted(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'task.completed',
      payload,
      timestamp: new Date(),
      source: 'tasks-service',
    });
  }

  @OnEvent('payment.received', { async: true })
  async handlePaymentReceived(payload: Record<string, any>): Promise<void> {
    await this.handleWorkflowTriggerEvent({
      name: 'payment.received',
      payload,
      timestamp: new Date(),
      source: 'billing-service',
    });
  }
}
