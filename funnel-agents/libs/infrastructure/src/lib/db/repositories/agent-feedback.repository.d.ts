import { Repository } from 'typeorm';
import { IAgentFeedbackRepository, AgentFeedback, AgentFeedbackFilters, PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { AgentFeedbackDbEntity } from '../entities/agent-feedback.entity';
import { BaseRepository } from '../base.repository';
export declare class AgentFeedbackRepository extends BaseRepository<AgentFeedbackDbEntity, AgentFeedback> implements IAgentFeedbackRepository {
    constructor(repository: Repository<AgentFeedbackDbEntity>);
    findByAgentId(agentId: string, params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
    findWithFilters(filters: AgentFeedbackFilters, params?: PaginationParams): Promise<PaginatedResult<AgentFeedback>>;
    protected toDomain(entity: AgentFeedbackDbEntity): AgentFeedback;
    protected toDatabase(feedback: AgentFeedback): Partial<AgentFeedbackDbEntity>;
}
