import { AgentFeedback } from './agent-feedback.entity';
import { PaginationParams, PaginatedResult } from '../shared-kernel';

export interface AgentFeedbackFilters {
  agentId?: string;
  taskId?: string;
  feedbackType?: string;
  minRating?: number;
  maxRating?: number;
}

export interface IAgentFeedbackRepository {
  findById(id: string): Promise<AgentFeedback | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
  findByAgentId(agentId: string, params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
  findWithFilters(
    filters: AgentFeedbackFilters,
    params?: PaginationParams
  ): Promise<PaginatedResult<AgentFeedback>>;
  save(feedback: AgentFeedback): Promise<AgentFeedback>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export const AGENT_FEEDBACK_REPOSITORY = Symbol('IAgentFeedbackRepository');
