import { Repository } from 'typeorm';
import { IAgentTuningRepository, AgentPerformanceTuning, AgentTuningFilters, PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { AgentTuningDbEntity } from '../entities/agent-tuning.entity';
import { BaseRepository } from '../base.repository';
export declare class AgentTuningRepository extends BaseRepository<AgentTuningDbEntity, AgentPerformanceTuning> implements IAgentTuningRepository {
    constructor(repository: Repository<AgentTuningDbEntity>);
    findByAgentId(agentId: string, params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>>;
    findWithFilters(filters: AgentTuningFilters, params?: PaginationParams): Promise<PaginatedResult<AgentPerformanceTuning>>;
    protected toDomain(entity: AgentTuningDbEntity): AgentPerformanceTuning;
    protected toDatabase(tuning: AgentPerformanceTuning): Partial<AgentTuningDbEntity>;
}
