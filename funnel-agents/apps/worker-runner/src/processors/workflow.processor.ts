import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '@funnelagents/infrastructure';
import { firstValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';

interface WorkflowJobData {
  type: 'execute_workflow';
  payload: {
    workflowRunId: string;
    workflowId: string;
    triggerData?: any;
  };
  metadata?: {
    correlationId?: string;
    timestamp?: Date;
    source?: string;
  };
}

interface WorkflowJobResult {
  success: boolean;
  data?: {
    workflowRunId: string;
    status: string;
    executionTime: number;
    nodesExecuted: number;
  };
  error?: string;
}

type NodeType = 'trigger' | 'agent' | 'condition' | 'email' | 'delay' | 'webhook';

interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: string;
  trigger_type: string;
  trigger_config?: Record<string, any>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  workspace_id?: string;
}

interface ExecutionLogEntry {
  node_id: string;
  node_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: Date;
  completed_at?: Date;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
}

interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  trigger_type: string;
  trigger_data?: Record<string, any>;
  current_node_id?: string;
  execution_log: ExecutionLogEntry[];
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
}

interface AgentDetails {
  id: string;
  name: string;
  description?: string;
  type: string;
  domain: string;
  status: string;
  skills: string[];
  tools?: string[];
  settings?: Record<string, any>;
  prompt_template?: string;
  model?: string;
}

interface AgentExecutionRequest {
  agent_id: string;
  agent_name: string;
  task_id: string;
  task_description?: string;
  input_data?: any;
  context?: Record<string, any>;
  settings?: Record<string, any>;
  prompt_template?: string;
  model?: string;
}

interface AgentExecutionResponse {
  success: boolean;
  task_id: string;
  agent_id: string;
  output: any;
  execution_log: string[];
  execution_time: number;
  tokens_used?: number;
  model_used?: string;
  error?: string;
}

@Processor('automations')
export class WorkflowProcessor extends BaseQueueProcessor<WorkflowJobData> {
  private readonly serviceLogger: Logger;

  constructor(
    @Inject('AUTOMATIONS_SERVICE')
    private readonly automationsClient: ClientProxy,
    @Inject('AGENTS_SERVICE') private readonly agentsClient: ClientProxy,
    private readonly httpService: HttpService,
  ) {
    super('WorkflowProcessor');
    this.serviceLogger = new Logger('WorkflowProcessor');
  }

  async process(job: Job<WorkflowJobData>): Promise<WorkflowJobResult> {
    const startTime = Date.now();
    const { workflowRunId, workflowId, triggerData } = job.data.payload;
    const correlationId = job.data.metadata?.correlationId || job.id;

    this.serviceLogger.log(
      `Processing workflow run ${workflowRunId} for workflow ${workflowId} (Job ${job.id}, Correlation: ${correlationId})`,
    );

    try {
      // Step 1: Fetch workflow definition
      await this.addLog(job, `Fetching workflow definition for ${workflowId}...`);
      await this.updateProgress(job, 5);

      const workflow = await this.fetchWorkflow(workflowId);

      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (workflow.status !== 'active') {
        throw new Error(
          `Workflow ${workflowId} is not active (status: ${workflow.status})`,
        );
      }

      this.serviceLogger.debug(`Workflow ${workflowId} details:`, {
        name: workflow.name,
        nodes: workflow.nodes.length,
        edges: workflow.edges.length,
      });

      // Step 2: Fetch workflow run
      await this.addLog(job, `Fetching workflow run ${workflowRunId}...`);
      const workflowRun = await this.fetchWorkflowRun(workflowRunId);

      if (!workflowRun) {
        throw new Error(`Workflow run ${workflowRunId} not found`);
      }

      await this.updateProgress(job, 10);

      // Step 3: Update workflow run status to 'running'
      await this.addLog(job, `Starting workflow execution...`);
      await this.updateWorkflowRunStatus(workflowRunId, 'running', {
        started_at: new Date(),
      });

      // Step 4: Execute workflow nodes
      const executionContext = {
        triggerData: triggerData || workflowRun.trigger_data || {},
        workspaceId: workflow.workspace_id,
      };

      const executionLog: ExecutionLogEntry[] = [];
      const nodesExecuted = await this.executeWorkflow(
        workflow,
        executionContext,
        executionLog,
        job,
      );

      await this.updateProgress(job, 90);

      // Step 5: Update workflow run with final status
      await this.addLog(job, `Workflow execution completed. Updating status...`);
      await this.updateWorkflowRunStatus(workflowRunId, 'completed', {
        completed_at: new Date(),
        execution_log: executionLog,
      });

      await this.updateProgress(job, 100);

      const executionTime = Date.now() - startTime;

      this.serviceLogger.log(
        `Workflow run ${workflowRunId} completed successfully in ${executionTime}ms (${nodesExecuted} nodes executed)`,
      );

      return {
        success: true,
        data: {
          workflowRunId,
          status: 'completed',
          executionTime,
          nodesExecuted,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.serviceLogger.error(
        `Workflow run ${workflowRunId} failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update workflow run status to failed
      try {
        await this.updateWorkflowRunStatus(workflowRunId, 'failed', {
          error_message: errorMessage,
          completed_at: new Date(),
        });
      } catch (updateError) {
        this.serviceLogger.error(
          `Failed to update workflow run status: ${updateError}`,
        );
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async executeWorkflow(
    workflow: Workflow,
    context: Record<string, any>,
    executionLog: ExecutionLogEntry[],
    job: Job<WorkflowJobData>,
  ): Promise<number> {
    // Find the trigger node (starting point)
    const triggerNode = workflow.nodes.find((node) => node.type === 'trigger');

    if (!triggerNode) {
      throw new Error('Workflow has no trigger node');
    }

    const nodesExecuted = 0;
    const progressIncrement = 70 / workflow.nodes.length; // 10-80% for node execution

    // Execute nodes starting from trigger
    await this.executeNodeChain(
      triggerNode,
      workflow,
      context,
      executionLog,
      job,
      nodesExecuted,
      progressIncrement,
    );

    return executionLog.length;
  }

  private async executeNodeChain(
    node: WorkflowNode,
    workflow: Workflow,
    context: Record<string, any>,
    executionLog: ExecutionLogEntry[],
    job: Job<WorkflowJobData>,
    nodesExecuted: number,
    progressIncrement: number,
  ): Promise<any> {
    const logEntry: ExecutionLogEntry = {
      node_id: node.id,
      node_type: node.type,
      status: 'running',
      started_at: new Date(),
      input: context,
    };

    try {
      await this.addLog(job, `Executing ${node.type} node: ${node.id}...`);

      let output: any;

      switch (node.type) {
        case 'trigger':
          output = context.triggerData;
          logEntry.status = 'completed';
          break;

        case 'agent':
          output = await this.executeAgentNode(node, context, job);
          logEntry.status = 'completed';
          break;

        case 'condition':
          output = await this.executeConditionNode(node, context);
          logEntry.status = 'completed';
          break;

        case 'delay':
          output = await this.executeDelayNode(node, context);
          logEntry.status = 'completed';
          break;

        case 'webhook':
          output = await this.executeWebhookNode(node, context);
          logEntry.status = 'completed';
          break;

        case 'email':
          output = await this.executeEmailNode(node, context);
          logEntry.status = 'completed';
          break;

        default:
          throw new Error(`Unsupported node type: ${node.type}`);
      }

      logEntry.completed_at = new Date();
      logEntry.output = output;
      executionLog.push(logEntry);

      await this.updateProgress(
        job,
        10 + ++nodesExecuted * progressIncrement,
      );

      // Find and execute next nodes
      const outgoingEdges = workflow.edges.filter(
        (edge) => edge.source === node.id,
      );

      for (const edge of outgoingEdges) {
        // Check edge condition if present
        if (edge.condition) {
          const conditionMet = this.evaluateCondition(edge.condition, output);
          if (!conditionMet) {
            this.serviceLogger.debug(
              `Skipping edge ${edge.id}: condition not met`,
            );
            continue;
          }
        }

        const nextNode = workflow.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          // Update context with output from current node
          const nextContext = {
            ...context,
            [node.id]: output,
            lastOutput: output,
          };

          await this.executeNodeChain(
            nextNode,
            workflow,
            nextContext,
            executionLog,
            job,
            nodesExecuted,
            progressIncrement,
          );
        }
      }

      return output;
    } catch (error) {
      logEntry.status = 'failed';
      logEntry.completed_at = new Date();
      logEntry.error =
        error instanceof Error ? error.message : String(error);
      executionLog.push(logEntry);

      throw error;
    }
  }

  private async executeAgentNode(
    node: WorkflowNode,
    context: Record<string, any>,
    job: Job<WorkflowJobData>,
  ): Promise<any> {
    const agentId = node.data.agent_id || node.data.agentId;
    const taskDescription =
      node.data.task_description || node.data.description;
    const inputMapping = node.data.input_mapping || {};

    if (!agentId) {
      throw new Error(`Agent node ${node.id} has no agent_id configured`);
    }

    // Fetch agent details
    const agent = await this.fetchAgentDetails(agentId);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'active') {
      throw new Error(
        `Agent ${agentId} is not active (status: ${agent.status})`,
      );
    }

    // Map input data from context
    const inputData = this.mapInputData(inputMapping, context);

    // Execute agent
    const result = await this.invokeAgent(
      agent,
      taskDescription,
      inputData,
      context,
    );

    if (!result.success) {
      throw new Error(result.error || 'Agent execution failed');
    }

    return result.output;
  }

  private async executeConditionNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const condition = node.data.condition;
    const conditionMet = this.evaluateCondition(condition, context);

    this.serviceLogger.debug(
      `Condition node ${node.id}: ${conditionMet ? 'true' : 'false'}`,
    );

    return { conditionMet, condition };
  }

  private async executeDelayNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const delayMs = node.data.delay_ms || node.data.delay || 0;

    this.serviceLogger.debug(`Delay node ${node.id}: waiting ${delayMs}ms`);

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return { delayed: delayMs };
  }

  private async executeWebhookNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    const url = node.data.url;
    const method = node.data.method || 'POST';
    const headers = node.data.headers || {};
    const body = node.data.body || context.lastOutput;

    if (!url) {
      throw new Error(`Webhook node ${node.id} has no URL configured`);
    }

    this.serviceLogger.debug(
      `Webhook node ${node.id}: ${method} ${url}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService
          .request({
            method,
            url,
            headers,
            data: body,
            timeout: 30000,
          })
          .pipe(timeout(30000)),
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Webhook call failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async executeEmailNode(
    node: WorkflowNode,
    context: Record<string, any>,
  ): Promise<any> {
    // This would integrate with an email service
    // For now, just log and return success
    const to = node.data.to;
    const subject = node.data.subject;
    const body = node.data.body;

    this.serviceLogger.debug(
      `Email node ${node.id}: sending to ${to}`,
    );

    // TODO: Integrate with email service (SendGrid, SES, etc.)
    this.serviceLogger.warn(
      'Email node execution not implemented - would send email here',
    );

    return { sent: true, to, subject };
  }

  private evaluateCondition(
    condition: string,
    context: Record<string, any>,
  ): boolean {
    // Simple condition evaluation
    // Format: "field operator value" e.g., "lastOutput.status == success"
    try {
      // For safety, use a simple parser instead of eval
      // This is a basic implementation - enhance with a proper expression parser
      const operators: Record<string, (a: any, b: any) => boolean> = {
        '==': (a, b) => a == b,
        '===': (a, b) => a === b,
        '!=': (a, b) => a != b,
        '!==': (a, b) => a !== b,
        '>': (a, b) => a > b,
        '>=': (a, b) => a >= b,
        '<': (a, b) => a < b,
        '<=': (a, b) => a <= b,
      };

      for (const [op, fn] of Object.entries(operators)) {
        if (condition.includes(op)) {
          const [left, right] = condition.split(op).map((s) => s.trim());
          const leftValue = this.resolveValue(left, context);
          const rightValue = this.resolveValue(right, context);
          return fn(leftValue, rightValue);
        }
      }

      // If no operator found, treat as boolean value
      return this.resolveValue(condition, context);
    } catch (error) {
      this.serviceLogger.error(
        `Failed to evaluate condition: ${condition}`,
        error,
      );
      return false;
    }
  }

  private resolveValue(path: string, context: Record<string, any>): any {
    // Remove quotes if present
    if (
      (path.startsWith('"') && path.endsWith('"')) ||
      (path.startsWith("'") && path.endsWith("'"))
    ) {
      return path.slice(1, -1);
    }

    // Check if it's a number
    if (!isNaN(Number(path))) {
      return Number(path);
    }

    // Check if it's a boolean
    if (path === 'true') return true;
    if (path === 'false') return false;

    // Resolve from context using dot notation
    const parts = path.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private mapInputData(
    mapping: Record<string, string>,
    context: Record<string, any>,
  ): any {
    const result: Record<string, any> = {};

    for (const [key, sourcePath] of Object.entries(mapping)) {
      result[key] = this.resolveValue(sourcePath, context);
    }

    return Object.keys(result).length > 0 ? result : context.lastOutput;
  }

  private async fetchWorkflow(workflowId: string): Promise<Workflow> {
    try {
      const response = await firstValueFrom(
        this.automationsClient
          .send<Workflow>('workflow.get', { id: workflowId })
          .pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      this.serviceLogger.error(
        `Failed to fetch workflow ${workflowId}: ${error}`,
      );
      throw new Error(`Failed to fetch workflow: ${error}`);
    }
  }

  private async fetchWorkflowRun(workflowRunId: string): Promise<WorkflowRun> {
    try {
      const response = await firstValueFrom(
        this.automationsClient
          .send<WorkflowRun>('workflow-run.get', { id: workflowRunId })
          .pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      this.serviceLogger.error(
        `Failed to fetch workflow run ${workflowRunId}: ${error}`,
      );
      throw new Error(`Failed to fetch workflow run: ${error}`);
    }
  }

  private async updateWorkflowRunStatus(
    workflowRunId: string,
    status: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.automationsClient
          .send('workflow-run.update', {
            id: workflowRunId,
            status,
            ...data,
          })
          .pipe(timeout(5000)),
      );
    } catch (error) {
      this.serviceLogger.error(
        `Failed to update workflow run ${workflowRunId} status: ${error}`,
      );
      throw new Error(`Failed to update workflow run status: ${error}`);
    }
  }

  private async fetchAgentDetails(agentId: string): Promise<AgentDetails> {
    try {
      const response = await firstValueFrom(
        this.agentsClient
          .send<AgentDetails>('agent.get', { id: agentId })
          .pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      this.serviceLogger.error(
        `Failed to fetch agent ${agentId}: ${error}`,
      );
      throw new Error(`Failed to fetch agent details: ${error}`);
    }
  }

  private async invokeAgent(
    agent: AgentDetails,
    taskDescription?: string,
    inputData?: any,
    context?: Record<string, any>,
  ): Promise<AgentExecutionResponse> {
    const agentApiUrl = process.env.AGENT_API_URL || 'http://localhost:8000';
    const endpoint = `${agentApiUrl}/api/agents/execute`;

    const taskId = `workflow-${Date.now()}`;

    const requestPayload: AgentExecutionRequest = {
      agent_id: agent.id,
      agent_name: agent.name,
      task_id: taskId,
      task_description: taskDescription,
      input_data: inputData,
      context: {
        workspace_id: context?.workspaceId,
        domain: agent.domain,
        skills: agent.skills,
        tools: agent.tools,
        ...context,
      },
      settings: agent.settings,
      prompt_template: agent.prompt_template,
      model: agent.model,
    };

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<AgentExecutionResponse>(endpoint, requestPayload, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 300000, // 5 minutes
          })
          .pipe(timeout(300000)),
      );

      return response.data;
    } catch (error) {
      this.serviceLogger.error(
        `Agent API invocation failed: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        task_id: taskId,
        agent_id: agent.id,
        output: null,
        execution_log: [
          `Agent invocation failed: ${error instanceof Error ? error.message : String(error)}`,
        ],
        execution_time: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
