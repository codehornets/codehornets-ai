import { AgentTemplate, IAgentTemplateRepository, AgentTemplateFilters } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class AgentTemplateService {
    private readonly templateRepository;
    constructor(templateRepository: IAgentTemplateRepository);
    findById(id: string): Promise<AgentTemplate | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
    findPublic(params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
    findWithFilters(filters: AgentTemplateFilters, params?: PaginationParams): Promise<PaginatedResult<AgentTemplate>>;
    create(data: {
        name: string;
        description?: string;
        domain: string;
        skills: string[];
        promptTemplate?: string;
        defaultSettings?: Record<string, any>;
        category?: string;
        isPublic?: boolean;
    }): Promise<AgentTemplate>;
    update(id: string, updates: {
        name?: string;
        description?: string;
        domain?: string;
        category?: string;
        skills?: string[];
        promptTemplate?: string;
        defaultSettings?: Record<string, any>;
    }): Promise<AgentTemplate>;
    publish(id: string): Promise<AgentTemplate>;
    unpublish(id: string): Promise<AgentTemplate>;
    delete(id: string): Promise<void>;
}
