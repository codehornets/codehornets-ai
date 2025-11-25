import { Repository } from 'typeorm';
import { IAgentTemplateRepository, AgentTemplate, AgentTemplateFilters, PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { AgentTemplateDbEntity } from '../entities/agent-template.entity';
import { BaseRepository } from '../base.repository';
export declare class AgentTemplateRepository extends BaseRepository<AgentTemplateDbEntity, AgentTemplate> implements IAgentTemplateRepository {
    constructor(repository: Repository<AgentTemplateDbEntity>);
    findPublic(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
    findWithFilters(filters: AgentTemplateFilters, params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
    protected toDomain(entity: AgentTemplateDbEntity): AgentTemplate;
    protected toDatabase(template: AgentTemplate): Partial<AgentTemplateDbEntity>;
}
