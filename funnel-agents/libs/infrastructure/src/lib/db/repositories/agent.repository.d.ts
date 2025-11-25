import { Repository } from 'typeorm';
import { IAgentRepository, Agent, AgentFilters, PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { AgentDbEntity } from '../entities/agent.entity';
export declare class AgentRepository implements IAgentRepository {
    private readonly repository;
    constructor(repository: Repository<AgentDbEntity>);
    findById(id: string): Promise<Agent | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Agent>>;
    exists(id: string): Promise<boolean>;
    delete(id: string): Promise<void>;
    findAvailableAgents(type?: string): Promise<Agent[]>;
    findWithFilters(filters: AgentFilters, params?: PaginationParams): Promise<PaginatedResult<Agent>>;
    findByType(): Promise<PaginatedResult<Agent>>;
    findByStatus(): Promise<Agent[]>;
    save(agent: Agent): Promise<Agent>;
    private toDomain;
    private toDatabase;
}
