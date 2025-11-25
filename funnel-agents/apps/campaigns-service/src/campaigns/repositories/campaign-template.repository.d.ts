import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignTemplateEntity } from '../entities/campaign-template.entity';
export interface CampaignTemplateFilters {
    category?: string;
    is_public?: boolean;
    search?: string;
}
export declare class CampaignTemplateRepository extends BaseRepository<CampaignTemplateEntity> {
    private readonly templateRepository;
    constructor(templateRepository: Repository<CampaignTemplateEntity>);
    findWithFilters(filters: CampaignTemplateFilters, params?: PaginationParams): Promise<PaginatedResult<CampaignTemplateEntity>>;
    findByCategory(category: string, params?: PaginationParams): Promise<PaginatedResult<CampaignTemplateEntity>>;
    findPublicTemplates(params?: PaginationParams): Promise<PaginatedResult<CampaignTemplateEntity>>;
}
