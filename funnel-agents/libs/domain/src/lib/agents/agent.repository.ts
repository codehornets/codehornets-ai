import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Agent } from './agent.entity';
import { AgentType, AgentStatus } from './agent.types';

export interface AgentFilters {
  domain?: string;
  status?: AgentStatus;
  skills?: string[];
  minSuccessRate?: number;
  search?: string;
}

export interface IAgentRepository extends IRepository<Agent> {
  findByType(type: AgentType, params?: PaginationParams): Promise<PaginatedResult<Agent>>;
  findByStatus(status: AgentStatus): Promise<Agent[]>;
  findAvailableAgents(type?: AgentType): Promise<Agent[]>;
  findWithFilters(filters: AgentFilters, params?: PaginationParams): Promise<PaginatedResult<Agent>>;
}
