import { Repository } from 'typeorm';
import { BaseRepository } from '@funnelagents/infrastructure';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { CampaignEntity, CampaignStatus, CampaignPriority } from '../entities/campaign.entity';
export interface CampaignFilters {
    workspace_id?: string;
    status?: CampaignStatus;
    priority?: CampaignPriority;
    search?: string;
}
export declare class CampaignRepository extends BaseRepository<CampaignEntity> {
    private readonly campaignRepository;
    constructor(campaignRepository: Repository<CampaignEntity>);
    findWithFilters(filters: CampaignFilters, params?: PaginationParams): Promise<PaginatedResult<CampaignEntity>>;
    findByWorkspaceId(workspaceId: string, params?: PaginationParams): Promise<PaginatedResult<CampaignEntity>>;
    findByStatus(status: CampaignStatus, params?: PaginationParams): Promise<PaginatedResult<CampaignEntity>>;
}
