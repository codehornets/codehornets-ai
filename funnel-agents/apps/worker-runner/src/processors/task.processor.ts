import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '@funnelagents/infrastructure';
import { firstValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';

interface TaskJobData {
  type: 'execute_task';
  payload: {
    taskId: string;
    workspaceId?: string;
  };
  metadata?: {
    correlationId?: string;
    timestamp?: Date;
    source?: string;
  };
}

interface TaskJobResult {
  success: boolean;
  data?: {
    taskId: string;
    status: string;
    output?: any;
    executionTime?: number;
  };
  error?: string;
}

interface TaskDetails {
  id: string;
  name: string;
  description?: string;
  status: string;
  priority: string;
  agentId: string;
  workspaceId?: string;
  input?: any;
  output?: any;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeout?: number;
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
  context?: {
    workspace_id?: string;
    domain?: string;
    skills?: string[];
    tools?: string[];
  };
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

@Processor('tasks')
export class TaskProcessor extends BaseQueueProcessor<TaskJobData> {
  private readonly serviceLogger: Logger;

  constructor(
    @Inject('TASKS_SERVICE') private readonly tasksClient: ClientProxy,
    @Inject('AGENTS_SERVICE') private readonly agentsClient: ClientProxy,
    private readonly httpService: HttpService,
  ) {
    super('TaskProcessor');
    this.serviceLogger = new Logger('TaskProcessor');
  }

  async process(job: Job<TaskJobData>): Promise<TaskJobResult> {
    const startTime = Date.now();
    const { taskId, workspaceId } = job.data.payload;
    const correlationId = job.data.metadata?.correlationId || String(job.id);

    this.serviceLogger.log(
      `Processing task ${taskId} (Job ${job.id}, Correlation: ${correlationId})`,
    );

    try {
      // Step 1: Fetch task details from tasks-service
      await this.addLog(job, `Fetching task details for ${taskId}...`);
      await this.updateProgress(job, 10);

      const task = await this.fetchTaskDetails(taskId);

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (!task.agentId) {
        throw new Error(`Task ${taskId} has no assigned agent`);
      }

      this.serviceLogger.debug(`Task ${taskId} details:`, {
        name: task.name,
        agentId: task.agentId,
        status: task.status,
      });

      // Step 2: Update task status to 'running'
      await this.addLog(job, `Updating task status to 'running'...`);
      await this.updateTaskStatus(taskId, 'running', { startedAt: new Date() });
      await this.updateProgress(job, 20);

      // Step 3: Fetch agent details from agents-service
      await this.addLog(job, `Fetching agent details for ${task.agentId}...`);
      const agent = await this.fetchAgentDetails(task.agentId);

      if (!agent) {
        throw new Error(`Agent ${task.agentId} not found`);
      }

      if (agent.status !== 'active') {
        throw new Error(`Agent ${task.agentId} is not active (status: ${agent.status})`);
      }

      this.serviceLogger.debug(`Agent ${task.agentId} details:`, {
        name: agent.name,
        type: agent.type,
        domain: agent.domain,
      });

      await this.updateProgress(job, 30);

      // Step 4: Invoke Python agent via FastAPI
      await this.addLog(job, `Invoking agent ${agent.name}...`);
      const executionResult = await this.invokeAgent(task, agent, correlationId);

      await this.updateProgress(job, 80);

      // Step 5: Update task with results
      if (executionResult.success) {
        await this.addLog(job, `Agent execution successful. Updating task...`);
        await this.updateTaskStatus(taskId, 'completed', {
          output: executionResult.output,
          completedAt: new Date(),
          executionLog: executionResult.execution_log,
        });

        await this.updateProgress(job, 100);

        const executionTime = Date.now() - startTime;

        this.serviceLogger.log(
          `Task ${taskId} completed successfully in ${executionTime}ms`,
        );

        return {
          success: true,
          data: {
            taskId,
            status: 'completed',
            output: executionResult.output,
            executionTime,
          },
        };
      } else {
        throw new Error(executionResult.error || 'Agent execution failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.serviceLogger.error(
        `Task ${taskId} failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update task status to failed
      try {
        await this.updateTaskStatus(taskId, 'failed', {
          error: errorMessage,
          completedAt: new Date(),
        });
      } catch (updateError) {
        this.serviceLogger.error(
          `Failed to update task status: ${updateError}`,
        );
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async fetchTaskDetails(taskId: string): Promise<TaskDetails> {
    try {
      const response = await firstValueFrom(
        this.tasksClient
          .send<TaskDetails>('task.get', { id: taskId })
          .pipe(timeout(5000)),
      );
      return response;
    } catch (error) {
      this.serviceLogger.error(
        `Failed to fetch task ${taskId}: ${error}`,
      );
      throw new Error(`Failed to fetch task details: ${error}`);
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

  private async updateTaskStatus(
    taskId: string | undefined,
    status: string,
    data: Record<string, any>,
  ): Promise<void> {
    if (!taskId) {
      throw new Error('Task ID is required for status update');
    }
    try {
      await firstValueFrom(
        this.tasksClient
          .send('task.update', {
            id: taskId,
            status,
            ...data,
          })
          .pipe(timeout(5000)),
      );
    } catch (error) {
      this.serviceLogger.error(
        `Failed to update task ${taskId} status: ${error}`,
      );
      throw new Error(`Failed to update task status: ${error}`);
    }
  }

  private async invokeAgent(
    task: TaskDetails,
    agent: AgentDetails,
    correlationId: string,
  ): Promise<AgentExecutionResponse> {
    const agentApiUrl = process.env.AGENT_API_URL || 'http://localhost:8000';
    const endpoint = `${agentApiUrl}/api/agents/execute`;

    const requestPayload: AgentExecutionRequest = {
      agent_id: agent.id,
      agent_name: agent.name,
      task_id: task.id,
      task_description: task.description,
      input_data: task.input,
      context: {
        workspace_id: task.workspaceId,
        domain: agent.domain,
        skills: agent.skills,
        tools: agent.tools,
      },
      settings: agent.settings,
      prompt_template: agent.prompt_template,
      model: agent.model,
    };

    try {
      this.serviceLogger.debug(
        `Invoking agent API: POST ${endpoint}`,
        {
          taskId: task.id,
          agentId: agent.id,
          correlationId,
        },
      );

      const response = await firstValueFrom(
        this.httpService
          .post<AgentExecutionResponse>(endpoint, requestPayload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId,
            },
            timeout: task.timeout || 300000, // 5 minutes default
          })
          .pipe(timeout(task.timeout || 300000)),
      );

      return response.data;
    } catch (error) {
      this.serviceLogger.error(
        `Agent API invocation failed: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Return error response in expected format
      return {
        success: false,
        task_id: task.id,
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
