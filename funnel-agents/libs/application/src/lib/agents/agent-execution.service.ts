import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError, map } from 'rxjs';
import { AxiosError } from 'axios';
import {
  AgentInvocationDto,
  AgentExecutionResultDto,
  ExecutionStatus,
  ExecutionLogDto,
} from '@funnelagents/interfaces';
import { Agent } from '@funnelagents/domain';

export interface PythonAgentExecuteRequest {
  task_type: string;
  input_data: Record<string, any>;
  config?: {
    timeout?: number;
    priority?: string;
    stream?: boolean;
  };
  metadata?: Record<string, any>;
}

export interface PythonAgentExecuteResponse {
  success: boolean;
  result?: {
    output: any;
    execution_time_ms: number;
    tokens_used?: number;
    model_calls?: number;
  };
  error?: {
    type: string;
    message: string;
    details?: any;
  };
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    metadata?: any;
  }>;
  execution_id: string;
  status: string;
}

@Injectable()
export class AgentExecutionService {
  private readonly logger = new Logger(AgentExecutionService.name);
  private readonly pythonApiBaseUrl: string;
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.pythonApiBaseUrl =
      this.configService.get<string>('PYTHON_AGENT_API_URL') || 'http://localhost:8000/api/v1';
    this.defaultTimeout =
      this.configService.get<number>('AGENT_EXECUTION_TIMEOUT') || 300000; // 5 minutes
    this.maxRetries = this.configService.get<number>('AGENT_EXECUTION_MAX_RETRIES') || 3;

    this.logger.log(`AgentExecutionService initialized with API: ${this.pythonApiBaseUrl}`);
  }

  /**
   * Execute an agent task
   */
  async execute(
    agent: Agent,
    invocation: AgentInvocationDto
  ): Promise<AgentExecutionResultDto> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();
    const logs: string[] = [];

    this.logger.log(
      `Starting execution ${executionId} for agent ${agent.id.value} (${agent.name})`
    );
    logs.push(`[${new Date().toISOString()}] Starting task execution`);

    try {
      // Validate agent capabilities
      await this.validateAgentCapabilities(agent, invocation.task_type);
      logs.push(`[${new Date().toISOString()}] Agent capabilities validated`);

      // Prepare execution context
      const context = await this.prepareAgentContext(agent, invocation);
      logs.push(`[${new Date().toISOString()}] Execution context prepared`);

      // Invoke Python agent API
      const result = await this.invokeAgent(agent, context, invocation.timeout);
      logs.push(`[${new Date().toISOString()}] Agent invocation completed`);

      // Parse and process logs
      const executionLogs = this.parseExecutionLogs(result.logs);
      logs.push(...executionLogs);

      const executionTime = Date.now() - startTime;

      if (result.success && result.result) {
        logs.push(`[${new Date().toISOString()}] Task completed successfully`);

        return {
          success: true,
          output_data: result.result.output,
          execution_time: executionTime,
          logs,
          metrics: {
            tokens_used: result.result.tokens_used || 0,
            model_calls: result.result.model_calls || 0,
            execution_time_ms: result.result.execution_time_ms,
          },
          execution_id: executionId,
          agent_id: agent.id.value,
          status: ExecutionStatus.COMPLETED,
          started_at: new Date(startTime),
          completed_at: new Date(),
        };
      } else {
        throw new Error(result.error?.message || 'Unknown execution error');
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`[${new Date().toISOString()}] Execution failed: ${errorMessage}`);

      this.logger.error(`Execution ${executionId} failed: ${errorMessage}`, error);

      return {
        success: false,
        output_data: {},
        execution_time: executionTime,
        logs,
        error: {
          code: this.getErrorCode(error),
          message: errorMessage,
          details: error instanceof AxiosError ? error.response?.data : undefined,
        },
        execution_id: executionId,
        agent_id: agent.id.value,
        status: this.determineFailureStatus(error),
        started_at: new Date(startTime),
        completed_at: new Date(),
      };
    }
  }

  /**
   * Execute agent synchronously
   */
  async executeSync(
    agent: Agent,
    invocation: AgentInvocationDto
  ): Promise<AgentExecutionResultDto> {
    return this.execute(agent, invocation);
  }

  /**
   * Queue agent execution for async processing
   */
  async executeAsync(
    agent: Agent,
    invocation: AgentInvocationDto
  ): Promise<{ execution_id: string; status: ExecutionStatus }> {
    const executionId = this.generateExecutionId();

    this.logger.log(`Queuing async execution ${executionId} for agent ${agent.id.value}`);

    // Execute in background without awaiting
    this.execute(agent, invocation)
      .then((result) => {
        this.logger.log(`Async execution ${executionId} completed successfully`);
        if (invocation.callback_url) {
          this.sendCallback(invocation.callback_url, result).catch((err) =>
            this.logger.error(`Failed to send callback for ${executionId}:`, err)
          );
        }
      })
      .catch((error) => {
        this.logger.error(`Async execution ${executionId} failed:`, error);
      });

    return {
      execution_id: executionId,
      status: ExecutionStatus.PENDING,
    };
  }

  /**
   * Validate that agent has required capabilities for task
   */
  private async validateAgentCapabilities(agent: Agent, taskType: string): Promise<void> {
    const taskCapabilityMap: Record<string, string[]> = {
      market_research: ['Market Research', 'Data Analysis', 'Web Analytics'],
      content_creation: ['Copywriting', 'Content Strategy', 'Creative Design'],
      lead_qualification: ['Lead Generation', 'CRM Management', 'Sales Outreach'],
      seo_optimization: ['SEO', 'Web Analytics', 'Content Strategy'],
      email_campaign: ['Email Marketing', 'Copywriting', 'CRM Management'],
      social_media_post: ['Social Media', 'Copywriting', 'Creative Design'],
      competitor_analysis: ['Competitor Analysis', 'Market Research', 'Data Analysis'],
      report_generation: ['Data Analysis', 'Web Analytics', 'Project Management'],
    };

    const requiredCapabilities = taskCapabilityMap[taskType] || [];
    const agentCapabilityNames = agent.capabilities.map((c) => c.name);

    const hasRequiredCapability = requiredCapabilities.some((required) =>
      agentCapabilityNames.includes(required)
    );

    if (requiredCapabilities.length > 0 && !hasRequiredCapability) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'CAPABILITY_MISMATCH',
            message: `Agent ${agent.name} lacks required capabilities for task type ${taskType}`,
            required: requiredCapabilities,
            available: agentCapabilityNames,
          },
        },
        HttpStatus.BAD_REQUEST
      );
    }

    this.logger.debug(
      `Agent ${agent.name} capabilities validated for task type ${taskType}`
    );
  }

  /**
   * Prepare execution context for agent
   */
  private async prepareAgentContext(
    agent: Agent,
    invocation: AgentInvocationDto
  ): Promise<PythonAgentExecuteRequest> {
    return {
      task_type: invocation.task_type,
      input_data: invocation.input_data,
      config: {
        timeout: invocation.timeout || this.defaultTimeout / 1000, // Convert to seconds
        priority: invocation.priority || 'normal',
        stream: false,
      },
      metadata: {
        agent_id: agent.id.value,
        agent_name: agent.name,
        agent_domain: agent.domain,
        agent_type: agent.type,
        ...(invocation.metadata || {}),
      },
    };
  }

  /**
   * Invoke Python agent API
   */
  private async invokeAgent(
    agent: Agent,
    context: PythonAgentExecuteRequest,
    requestTimeout?: number
  ): Promise<PythonAgentExecuteResponse> {
    const timeoutMs = (requestTimeout || this.defaultTimeout / 1000) * 1000;
    const url = `${this.pythonApiBaseUrl}/agents/${agent.domain.toLowerCase()}/${agent.name.toLowerCase().replace(/\s+/g, '_')}/execute`;

    this.logger.debug(`Invoking agent at: ${url}`);

    let lastError: any;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.post<PythonAgentExecuteResponse>(url, context).pipe(
            timeout(timeoutMs),
            map((res) => res.data),
            catchError((error: AxiosError) => {
              if (this.isRetriableError(error)) {
                throw error;
              }
              throw new HttpException(
                {
                  success: false,
                  error: {
                    code: 'AGENT_INVOCATION_ERROR',
                    message: error.message,
                    details: error.response?.data,
                  },
                },
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
              );
            })
          )
        );

        this.logger.debug(`Agent invocation successful on attempt ${attempt}`);
        return response;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Agent invocation attempt ${attempt}/${this.maxRetries} failed:`,
          error
        );

        if (attempt < this.maxRetries && this.isRetriableError(error)) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
          continue;
        }
        break;
      }
    }

    throw lastError;
  }

  /**
   * Parse execution logs from Python API response
   */
  private parseExecutionLogs(
    logs: Array<{ timestamp: string; level: string; message: string; metadata?: any }>
  ): string[] {
    return logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = log.level.toUpperCase();
      return `[${timestamp}] [${level}] ${log.message}`;
    });
  }

  /**
   * Send callback to external URL
   */
  private async sendCallback(url: string, result: AgentExecutionResultDto): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(url, result).pipe(
          timeout(10000),
          catchError((error: AxiosError) => {
            this.logger.error(`Callback failed for ${url}:`, error.message);
            throw error;
          })
        )
      );
      this.logger.debug(`Callback sent successfully to ${url}`);
    } catch (error) {
      this.logger.error(`Failed to send callback to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Determine if error is retriable
   */
  private isRetriableError(error: any): boolean {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      // Retry on network errors, 5xx, 429, 408
      return (
        !status ||
        status >= 500 ||
        status === 429 ||
        status === 408 ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT'
      );
    }
    return false;
  }

  /**
   * Get error code from error object
   */
  private getErrorCode(error: any): string {
    if (error instanceof HttpException) {
      const response = error.getResponse() as any;
      return response?.error?.code || 'HTTP_ERROR';
    }
    if (error instanceof AxiosError) {
      return error.code || 'NETWORK_ERROR';
    }
    if (error?.name === 'TimeoutError') {
      return 'TIMEOUT_ERROR';
    }
    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine execution status from error
   */
  private determineFailureStatus(error: any): ExecutionStatus {
    if (error?.name === 'TimeoutError') {
      return ExecutionStatus.TIMEOUT;
    }
    return ExecutionStatus.FAILED;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
