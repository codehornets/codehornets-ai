import { AgentPerformanceTuning, TuningType } from './agent-tuning.entity';
import { PaginationParams, PaginatedResult } from '../shared-kernel';

export interface AgentTuningFilters {
  agentId?: string;
  tuningType?: TuningType;
  appliedOnly?: boolean;
}

export interface IAgentTuningRepository {
  findById(id: string): Promise<AgentPerformanceTuning | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>>;
  findByAgentId(
    agentId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>>;
  findWithFilters(
    filters: AgentTuningFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentPerformanceTuning>>;
  save(tuning: AgentPerformanceTuning): Promise<AgentPerformanceTuning>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export const AGENT_TUNING_REPOSITORY = Symbol('IAgentTuningRepository');
