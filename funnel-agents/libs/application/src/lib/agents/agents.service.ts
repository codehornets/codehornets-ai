import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  Agent,
  IAgentRepository,
  AgentFilters,
  AgentType,
  AgentDomain,
  AgentStatus,
  AgentCapability,
  AgentConfig,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { AgentExecutionService } from './agent-execution.service';
import {
  AgentInvocationDto,
  AgentExecutionResultDto,
  ExecutionStatus,
} from '@funnelagents/interfaces';

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(
    private readonly agentRepository: IAgentRepository,
    @Inject(AgentExecutionService)
    private readonly executionService: AgentExecutionService
  ) {}

  async findById(id: string): Promise<Agent | null> {
    return this.agentRepository.findById(id);
  }

  async findAll(params?: PaginationParams): Promise<PaginatedResult<Agent>> {
    return this.agentRepository.findAll(params);
  }

  async findAvailable(type?: AgentType): Promise<Agent[]> {
    return this.agentRepository.findAvailableAgents(type);
  }

  async findWithFilters(
    filters: AgentFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<Agent>> {
    return this.agentRepository.findWithFilters(filters, params);
  }

  async create(data: {
    name: string;
    type: AgentType;
    domain?: AgentDomain;
    description?: string;
    capabilities: AgentCapability[];
    config: AgentConfig;
    tools?: string[];
  }): Promise<Agent> {
    const agent = Agent.create({
      name: data.name,
      type: data.type,
      domain: data.domain || AgentDomain.GENERAL,
      description: data.description,
      capabilities: data.capabilities,
      config: data.config,
      tools: data.tools,
    });

    return this.agentRepository.save(agent);
  }

  async activate(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    agent.activate();
    return this.agentRepository.save(agent);
  }

  async deactivate(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    agent.deactivate();
    return this.agentRepository.save(agent);
  }

  async updateConfig(id: string, config: Partial<AgentConfig>): Promise<Agent> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    agent.updateConfig(config);
    return this.agentRepository.save(agent);
  }

  async addCapability(id: string, capability: AgentCapability): Promise<Agent> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    agent.addCapability(capability);
    return this.agentRepository.save(agent);
  }

  async recordTaskCompletion(
    id: string,
    executionTimeMs: number,
    success: boolean
  ): Promise<Agent> {
    const agent = await this.agentRepository.findById(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    agent.recordTaskCompletion(executionTimeMs, success);
    return this.agentRepository.save(agent);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.agentRepository.exists(id);
    if (!exists) {
      throw new Error(`Agent with id ${id} not found`);
    }

    return this.agentRepository.delete(id);
  }

  /**
   * Execute an agent task
   */
  async executeAgent(
    agentId: string,
    input: Record<string, any>,
    timeout?: number
  ): Promise<AgentExecutionResultDto> {
    this.logger.log(`Executing agent ${agentId} with input`);

    // Retrieve agent
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    // Check agent status
    if (agent.status === AgentStatus.OFFLINE) {
      throw new Error(`Agent ${agent.name} is offline and cannot execute tasks`);
    }

    // Mark agent as busy
    agent.markBusy();
    await this.agentRepository.save(agent);

    try {
      // Create invocation DTO
      const invocation: AgentInvocationDto = {
        agent_id: agentId,
        task_type: input.task_type || 'custom',
        input_data: input,
        timeout,
      };

      // Execute via execution service
      const result = await this.executionService.execute(agent, invocation);

      // Record task completion
      await this.recordTaskCompletion(agentId, result.execution_time, result.success);

      // Mark agent as idle
      agent.markIdle();
      await this.agentRepository.save(agent);

      return result;
    } catch (error) {
      // Mark agent as idle or error state
      if (agent.status === AgentStatus.BUSY) {
        agent.markIdle();
      }
      await this.agentRepository.save(agent);
      throw error;
    }
  }

  /**
   * Validate agent capabilities for task type
   */
  async validateAgentCapabilities(agent: Agent, taskType: string): Promise<boolean> {
    return this.executionService['validateAgentCapabilities'](agent, taskType)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Prepare agent context for execution
   */
  async prepareAgentContext(agent: Agent, input: Record<string, any>): Promise<any> {
    const invocation: AgentInvocationDto = {
      agent_id: agent.id.value,
      task_type: input.task_type || 'custom',
      input_data: input,
    };

    return this.executionService['prepareAgentContext'](agent, invocation);
  }

  /**
   * Invoke agent through Python API
   */
  async invokeAgent(
    agent: Agent,
    context: any,
    timeout?: number
  ): Promise<AgentExecutionResultDto> {
    const invocation: AgentInvocationDto = {
      agent_id: agent.id.value,
      task_type: context.task_type || 'custom',
      input_data: context.input_data || context,
      timeout,
    };

    return this.executionService.execute(agent, invocation);
  }

  /**
   * Execute agent synchronously
   */
  async executeAgentSync(
    agentId: string,
    input: Record<string, any>,
    timeout?: number
  ): Promise<AgentExecutionResultDto> {
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    const invocation: AgentInvocationDto = {
      agent_id: agentId,
      task_type: input.task_type || 'custom',
      input_data: input,
      timeout,
    };

    return this.executionService.executeSync(agent, invocation);
  }

  /**
   * Queue agent execution for async processing
   */
  async executeAgentAsync(
    agentId: string,
    input: Record<string, any>,
    callbackUrl?: string,
    timeout?: number
  ): Promise<{ execution_id: string; status: ExecutionStatus }> {
    const agent = await this.agentRepository.findById(agentId);
    if (!agent) {
      throw new Error(`Agent with id ${agentId} not found`);
    }

    const invocation: AgentInvocationDto = {
      agent_id: agentId,
      task_type: input.task_type || 'custom',
      input_data: input,
      timeout,
      callback_url: callbackUrl,
    };

    return this.executionService.executeAsync(agent, invocation);
  }
}
