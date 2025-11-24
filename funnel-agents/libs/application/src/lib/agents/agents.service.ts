import { Injectable } from '@nestjs/common';
import {
  Agent,
  IAgentRepository,
  AgentFilters,
  AgentType,
  AgentStatus,
  AgentCapability,
  AgentConfig,
} from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';

@Injectable()
export class AgentsService {
  constructor(private readonly agentRepository: IAgentRepository) {}

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
    description?: string;
    capabilities: AgentCapability[];
    config: AgentConfig;
  }): Promise<Agent> {
    const agent = Agent.create({
      name: data.name,
      type: data.type,
      description: data.description,
      capabilities: data.capabilities,
      config: data.config,
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
}
