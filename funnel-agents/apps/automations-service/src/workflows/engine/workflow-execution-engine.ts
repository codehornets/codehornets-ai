import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WorkflowsRepository } from '../workflows.repository';
import { WorkflowRunsRepository } from '../../workflow-runs/workflow-runs.repository';
import { Workflow, WorkflowNode, WorkflowEdge, NodeType } from '../entities/workflow.entity';
import { WorkflowRun, ExecutionLogEntry } from '../../workflow-runs/entities/workflow-run.entity';
import { WorkflowContext } from './workflow-context';
import {
  BaseNodeHandler,
  TriggerNodeHandler,
  AgentNodeHandler,
  ConditionNodeHandler,
  EmailNodeHandler,
  DelayNodeHandler,
  WebhookNodeHandler,
} from './node-handlers';

/**
 * WorkflowExecutionEngine - Main workflow execution engine
 * Orchestrates node execution, handles branching, and manages execution state
 */
@Injectable()
export class WorkflowExecutionEngine {
  private readonly logger = new Logger(WorkflowExecutionEngine.name);
  private readonly nodeHandlers: Map<NodeType, BaseNodeHandler>;

  constructor(
    private readonly workflowsRepository: WorkflowsRepository,
    private readonly workflowRunsRepository: WorkflowRunsRepository,
    private readonly triggerNodeHandler: TriggerNodeHandler,
    private readonly agentNodeHandler: AgentNodeHandler,
    private readonly conditionNodeHandler: ConditionNodeHandler,
    private readonly emailNodeHandler: EmailNodeHandler,
    private readonly delayNodeHandler: DelayNodeHandler,
    private readonly webhookNodeHandler: WebhookNodeHandler
  ) {
    // Register node handlers
    this.nodeHandlers = new Map();
    this.nodeHandlers.set('trigger', triggerNodeHandler);
    this.nodeHandlers.set('agent', agentNodeHandler);
    this.nodeHandlers.set('condition', conditionNodeHandler);
    this.nodeHandlers.set('email', emailNodeHandler);
    this.nodeHandlers.set('delay', delayNodeHandler);
    this.nodeHandlers.set('webhook', webhookNodeHandler);
  }

  /**
   * Main entry point - Execute a workflow by ID
   */
  async executeWorkflow(
    workflowId: string,
    triggerData: Record<string, any> = {}
  ): Promise<WorkflowRun> {
    this.logger.log(`Starting workflow execution: ${workflowId}`);

    const workflow = await this.workflowsRepository.findById(workflowId);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    // Create workflow run
    const workflowRun = await this.workflowRunsRepository.create({
      workflow_id: workflowId,
      status: 'running',
      trigger_type: workflow.trigger_type,
      trigger_data: triggerData,
      execution_log: [],
      started_at: new Date(),
    });

    try {
      // Initialize context
      const context = new WorkflowContext(triggerData);

      // Find trigger node
      const triggerNode = workflow.nodes.find(node => node.type === 'trigger');
      if (!triggerNode) {
        throw new Error('Workflow must have a trigger node');
      }

      // Execute workflow starting from trigger
      await this.executeFromNode(triggerNode, workflow, context, workflowRun);

      // Mark as completed
      await this.workflowRunsRepository.update(workflowRun.id, {
        status: 'completed',
        completed_at: new Date(),
      });

      this.logger.log(`Workflow execution completed: ${workflowId}`);

      // Return updated workflow run
      const completedRun = await this.workflowRunsRepository.findById(workflowRun.id);
      return completedRun!;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Workflow execution failed: ${errorMessage}`, error.stack);

      // Mark as failed
      await this.workflowRunsRepository.update(workflowRun.id, {
        status: 'failed',
        completed_at: new Date(),
        error_message: errorMessage,
      });

      // Return failed workflow run
      const failedRun = await this.workflowRunsRepository.findById(workflowRun.id);
      return failedRun!;
    }
  }

  /**
   * Execute workflow starting from a specific node
   */
  private async executeFromNode(
    node: WorkflowNode,
    workflow: Workflow,
    context: WorkflowContext,
    workflowRun: WorkflowRun
  ): Promise<void> {
    // Check if node was already executed (prevent cycles)
    if (context.getNodeOutput(node.id)) {
      this.logger.warn(`Node ${node.id} already executed, skipping to prevent cycle`);
      return;
    }

    // Execute the node
    const result = await this.executeNode(node, context, workflowRun);

    // Find next nodes to execute
    const nextNodes = this.findNextNodes(node, workflow, context, result);

    // Execute next nodes in sequence
    for (const nextNode of nextNodes) {
      await this.executeFromNode(nextNode, workflow, context, workflowRun);
    }
  }

  /**
   * Execute a single node with the given context
   */
  async executeNode(
    node: WorkflowNode,
    context: WorkflowContext,
    workflowRun: WorkflowRun
  ): Promise<any> {
    const startTime = new Date();

    // Create execution log entry
    const logEntry: ExecutionLogEntry = {
      node_id: node.id,
      node_type: node.type,
      status: 'running',
      started_at: startTime,
      input: node.data,
    };

    // Update workflow run with current node
    await this.updateExecutionLog(workflowRun.id, logEntry);

    this.logger.log(`Executing node: ${node.id} (${node.type})`);

    try {
      // Get the appropriate handler
      const handler = this.nodeHandlers.get(node.type);
      if (!handler) {
        throw new Error(`No handler found for node type: ${node.type}`);
      }

      // Validate node configuration
      const validation = handler.validate(node);
      if (!validation.valid) {
        throw new Error(`Node validation failed: ${validation.errors?.join(', ')}`);
      }

      // Execute the node
      const result = await handler.execute(node, context);

      if (!result.success) {
        throw new Error(result.error || 'Node execution failed');
      }

      // Store node output in context
      context.setNodeOutput(node.id, result.output);

      // Update execution log entry
      logEntry.status = 'completed';
      logEntry.completed_at = new Date();
      logEntry.output = result.output;

      await this.updateExecutionLog(workflowRun.id, logEntry);

      this.logger.log(`Node executed successfully: ${node.id}`);

      return result;
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Node execution failed: ${node.id}`, error.stack);

      // Update execution log entry with error
      logEntry.status = 'failed';
      logEntry.completed_at = new Date();
      logEntry.error = errorMessage;

      await this.updateExecutionLog(workflowRun.id, logEntry);

      throw error;
    }
  }

  /**
   * Find the next nodes to execute based on edges and conditions
   */
  private findNextNodes(
    currentNode: WorkflowNode,
    workflow: Workflow,
    context: WorkflowContext,
    executionResult: any
  ): WorkflowNode[] {
    const nextNodes: WorkflowNode[] = [];

    // Find all edges from this node
    const outgoingEdges = workflow.edges.filter(edge => edge.source === currentNode.id);

    for (const edge of outgoingEdges) {
      // Check if edge has a condition
      if (edge.condition) {
        const conditionMet = this.evaluateCondition(edge.condition, context);
        if (!conditionMet) {
          this.logger.log(`Edge condition not met, skipping: ${edge.id}`);
          continue;
        }
      }

      // For condition nodes, check the result
      if (currentNode.type === 'condition' && executionResult.output) {
        // If edge is labeled "true" or "false", check against condition result
        if (edge.condition === 'true' && !executionResult.output.result) {
          continue;
        }
        if (edge.condition === 'false' && executionResult.output.result) {
          continue;
        }
      }

      // Find target node
      const targetNode = workflow.nodes.find(node => node.id === edge.target);
      if (targetNode) {
        nextNodes.push(targetNode);
      } else {
        this.logger.warn(`Target node not found for edge: ${edge.id}`);
      }
    }

    return nextNodes;
  }

  /**
   * Evaluate a condition string using the context
   */
  evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // Special cases
      if (condition === 'true') return true;
      if (condition === 'false') return false;

      // Evaluate expression using context
      const resolved = context.evaluateExpression(condition);

      // Handle comparison operators
      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map(s => s.trim());
        const leftVal = context.evaluateExpression(left);
        const rightVal = context.evaluateExpression(right);
        return leftVal === rightVal;
      }

      if (condition.includes('!==')) {
        const [left, right] = condition.split('!==').map(s => s.trim());
        const leftVal = context.evaluateExpression(left);
        const rightVal = context.evaluateExpression(right);
        return leftVal !== rightVal;
      }

      // Boolean conversion
      return Boolean(resolved);
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Condition evaluation failed: ${condition}`, errorMessage);
      return false;
    }
  }

  /**
   * Update execution log in workflow run
   */
  private async updateExecutionLog(
    workflowRunId: string,
    logEntry: ExecutionLogEntry
  ): Promise<void> {
    const workflowRun = await this.workflowRunsRepository.findById(workflowRunId);
    if (!workflowRun) {
      return;
    }

    // Find existing entry or add new one
    const existingIndex = workflowRun.execution_log.findIndex(
      entry => entry.node_id === logEntry.node_id
    );

    if (existingIndex >= 0) {
      workflowRun.execution_log[existingIndex] = logEntry;
    } else {
      workflowRun.execution_log.push(logEntry);
    }

    // Update workflow run
    await this.workflowRunsRepository.update(workflowRunId, {
      execution_log: workflowRun.execution_log,
      current_node_id: logEntry.node_id,
    });
  }

  /**
   * Handle different trigger types
   */
  async handleTrigger(
    trigger: { type: string; workflowId: string },
    payload: Record<string, any>
  ): Promise<WorkflowRun> {
    this.logger.log(`Handling trigger: ${trigger.type} for workflow ${trigger.workflowId}`);

    return this.executeWorkflow(trigger.workflowId, payload);
  }

  /**
   * Validate entire workflow before execution
   */
  async validateWorkflow(workflowId: string): Promise<{ valid: boolean; errors: string[] }> {
    const workflow = await this.workflowsRepository.findById(workflowId);
    if (!workflow) {
      return { valid: false, errors: ['Workflow not found'] };
    }

    const errors: string[] = [];

    // Check for trigger node
    const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }
    if (triggerNodes.length > 1) {
      errors.push('Workflow must have exactly one trigger node');
    }

    // Validate each node
    for (const node of workflow.nodes) {
      const handler = this.nodeHandlers.get(node.type);
      if (!handler) {
        errors.push(`No handler found for node type: ${node.type} (node: ${node.id})`);
        continue;
      }

      const validation = handler.validate(node);
      if (!validation.valid && validation.errors) {
        validation.errors.forEach(error => {
          errors.push(`Node ${node.id}: ${error}`);
        });
      }
    }

    // Check for orphaned nodes (nodes with no incoming edges except trigger)
    const nodesWithIncoming = new Set(workflow.edges.map(edge => edge.target));
    const triggerNodeId = triggerNodes[0]?.id;

    for (const node of workflow.nodes) {
      if (node.id !== triggerNodeId && !nodesWithIncoming.has(node.id)) {
        errors.push(`Node ${node.id} is orphaned (no incoming edges)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
