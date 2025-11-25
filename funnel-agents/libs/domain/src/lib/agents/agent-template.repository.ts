import { AgentTemplate } from './agent-template.entity';
import { PaginationParams, PaginatedResult } from '../shared-kernel';

export interface AgentTemplateFilters {
  domain?: string;
  category?: string;
  isPublic?: boolean;
  skills?: string[];
}

export interface IAgentTemplateRepository {
  findById(id: string): Promise<AgentTemplate | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
  findPublic(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
  findWithFilters(
    filters: AgentTemplateFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentTemplate>>;
  save(template: AgentTemplate): Promise<AgentTemplate>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export const AGENT_TEMPLATE_REPOSITORY = Symbol('IAgentTemplateRepository');
