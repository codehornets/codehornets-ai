import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { BaseQueueProcessor } from '@funnelagents/infrastructure';
import { firstValueFrom, timeout } from 'rxjs';
import { HttpService } from '@nestjs/axios';

interface AgentJobData {
  type: 'execute_agent';
  payload: {
    agentId: string;
    taskDescription?: string;
    inputData?: any;
    context?: Record<string, any>;
    workspaceId?: string;
  };
  metadata?: {
    correlationId?: string;
    timestamp?: Date;
    source?: string;
  };
}

interface AgentJobResult {
  success: boolean;
  data?: {
    agentId: string;
    output: any;
    executionTime: number;
    tokensUsed?: number;
    modelUsed?: string;
  };
  error?: string;
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
    [key: string]: any;
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

@Processor('agents')
export class AgentProcessor extends BaseQueueProcessor<AgentJobData> {
  private readonly serviceLogger: Logger;

  constructor(
    @Inject('AGENTS_SERVICE') private readonly agentsClient: ClientProxy,
    private readonly httpService: HttpService,
  ) {
    super('AgentProcessor');
    this.serviceLogger = new Logger('AgentProcessor');
  }

  async process(job: Job<AgentJobData>): Promise<AgentJobResult> {
    const startTime = Date.now();
    const { agentId, taskDescription, inputData, context, workspaceId } = job.data.payload;
    const correlationId = job.data.metadata?.correlationId || job.id;

    this.serviceLogger.log(
      `Processing agent invocation ${agentId} (Job ${job.id}, Correlation: ${correlationId})`,
    );

    try {
      // Step 1: Fetch agent details from agents-service
      await this.addLog(job, `Fetching agent details for ${agentId}...`);
      await this.updateProgress(job, 20);

      const agent = await this.fetchAgentDetails(agentId);

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      if (agent.status !== 'active') {
        throw new Error(`Agent ${agentId} is not active (status: ${agent.status})`);
      }

      this.serviceLogger.debug(`Agent ${agentId} details:`, {
        name: agent.name,
        type: agent.type,
        domain: agent.domain,
      });

      await this.updateProgress(job, 40);

      // Step 2: Invoke Python agent via FastAPI
      await this.addLog(job, `Invoking agent ${agent.name}...`);
      const executionResult = await this.invokeAgent(
        agent,
        taskDescription,
        inputData,
        context,
        workspaceId,
        correlationId,
      );

      await this.updateProgress(job, 90);

      // Step 3: Update agent statistics
      await this.addLog(job, `Updating agent statistics...`);
      await this.updateAgentStats(
        agentId,
        executionResult.success,
        executionResult.execution_time,
      );

      await this.updateProgress(job, 100);

      if (executionResult.success) {
        const executionTime = Date.now() - startTime;

        this.serviceLogger.log(
          `Agent ${agentId} invocation completed successfully in ${executionTime}ms`,
        );

        return {
          success: true,
          data: {
            agentId,
            output: executionResult.output,
            executionTime,
            tokensUsed: executionResult.tokens_used,
            modelUsed: executionResult.model_used,
          },
        };
      } else {
        throw new Error(executionResult.error || 'Agent execution failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.serviceLogger.error(
        `Agent ${agentId} invocation failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update agent failure statistics
      try {
        await this.updateAgentStats(agentId, false, 0);
      } catch (updateError) {
        this.serviceLogger.error(
          `Failed to update agent statistics: ${updateError}`,
        );
      }

      return {
        success: false,
        error: errorMessage,
      };
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

  private async updateAgentStats(
    agentId: string,
    success: boolean,
    executionTime: number,
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.agentsClient
          .send('agent.updateStats', {
            id: agentId,
            success,
            executionTime,
          })
          .pipe(timeout(5000)),
      );
    } catch (error) {
      this.serviceLogger.warn(
        `Failed to update agent ${agentId} statistics: ${error}`,
      );
      // Don't throw - this is not critical
    }
  }

  private async invokeAgent(
    agent: AgentDetails,
    taskDescription?: string,
    inputData?: any,
    context?: Record<string, any>,
    workspaceId?: string,
    correlationId?: string,
  ): Promise<AgentExecutionResponse> {
    const agentApiUrl = process.env.AGENT_API_URL || 'http://localhost:8000';
    const endpoint = `${agentApiUrl}/api/agents/execute`;

    const taskId = `adhoc-${correlationId}`;

    const requestPayload: AgentExecutionRequest = {
      agent_id: agent.id,
      agent_name: agent.name,
      task_id: taskId,
      task_description: taskDescription,
      input_data: inputData,
      context: {
        workspace_id: workspaceId,
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
      this.serviceLogger.debug(
        `Invoking agent API: POST ${endpoint}`,
        {
          agentId: agent.id,
          correlationId,
        },
      );

      const response = await firstValueFrom(
        this.httpService
          .post<AgentExecutionResponse>(endpoint, requestPayload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Correlation-ID': correlationId || '',
            },
            timeout: 300000, // 5 minutes default
          })
          .pipe(timeout(300000)),
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
