import { Agent, IAgentRepository, AgentFilters, AgentType, AgentDomain, AgentCapability, AgentConfig } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { AgentExecutionService } from './agent-execution.service';
import { AgentExecutionResultDto, ExecutionStatus } from '@funnelagents/interfaces';
export declare class AgentsService {
    private readonly agentRepository;
    private readonly executionService;
    private readonly logger;
    constructor(agentRepository: IAgentRepository, executionService: AgentExecutionService);
    findById(id: string): Promise<Agent | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Agent>>;
    findAvailable(type?: AgentType): Promise<Agent[]>;
    findWithFilters(filters: AgentFilters, params?: PaginationParams): Promise<PaginatedResult<Agent>>;
    create(data: {
        name: string;
        type: AgentType;
        domain?: AgentDomain;
        description?: string;
        capabilities: AgentCapability[];
        config: AgentConfig;
        tools?: string[];
    }): Promise<Agent>;
    activate(id: string): Promise<Agent>;
    deactivate(id: string): Promise<Agent>;
    updateConfig(id: string, config: Partial<AgentConfig>): Promise<Agent>;
    addCapability(id: string, capability: AgentCapability): Promise<Agent>;
    recordTaskCompletion(id: string, executionTimeMs: number, success: boolean): Promise<Agent>;
    delete(id: string): Promise<void>;
    /**
     * Execute an agent task
     */
    executeAgent(agentId: string, input: Record<string, any>, timeout?: number): Promise<AgentExecutionResultDto>;
    /**
     * Validate agent capabilities for task type
     */
    validateAgentCapabilities(agent: Agent, taskType: string): Promise<boolean>;
    /**
     * Prepare agent context for execution
     */
    prepareAgentContext(agent: Agent, input: Record<string, any>): Promise<any>;
    /**
     * Invoke agent through Python API
     */
    invokeAgent(agent: Agent, context: any, timeout?: number): Promise<AgentExecutionResultDto>;
    /**
     * Execute agent synchronously
     */
    executeAgentSync(agentId: string, input: Record<string, any>, timeout?: number): Promise<AgentExecutionResultDto>;
    /**
     * Queue agent execution for async processing
     */
    executeAgentAsync(agentId: string, input: Record<string, any>, callbackUrl?: string, timeout?: number): Promise<{
        execution_id: string;
        status: ExecutionStatus;
    }>;
}
