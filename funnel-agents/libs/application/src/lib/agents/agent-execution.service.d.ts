import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AgentInvocationDto, AgentExecutionResultDto, ExecutionStatus } from '@funnelagents/interfaces';
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
export declare class AgentExecutionService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly pythonApiBaseUrl;
    private readonly defaultTimeout;
    private readonly maxRetries;
    constructor(httpService: HttpService, configService: ConfigService);
    /**
     * Execute an agent task
     */
    execute(agent: Agent, invocation: AgentInvocationDto): Promise<AgentExecutionResultDto>;
    /**
     * Execute agent synchronously
     */
    executeSync(agent: Agent, invocation: AgentInvocationDto): Promise<AgentExecutionResultDto>;
    /**
     * Queue agent execution for async processing
     */
    executeAsync(agent: Agent, invocation: AgentInvocationDto): Promise<{
        execution_id: string;
        status: ExecutionStatus;
    }>;
    /**
     * Validate that agent has required capabilities for task
     */
    private validateAgentCapabilities;
    /**
     * Prepare execution context for agent
     */
    private prepareAgentContext;
    /**
     * Invoke Python agent API
     */
    private invokeAgent;
    /**
     * Parse execution logs from Python API response
     */
    private parseExecutionLogs;
    /**
     * Send callback to external URL
     */
    private sendCallback;
    /**
     * Determine if error is retriable
     */
    private isRetriableError;
    /**
     * Get error code from error object
     */
    private getErrorCode;
    /**
     * Determine execution status from error
     */
    private determineFailureStatus;
    /**
     * Generate unique execution ID
     */
    private generateExecutionId;
    /**
     * Sleep utility
     */
    private sleep;
}
