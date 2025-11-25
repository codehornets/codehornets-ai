import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Campaign } from './campaign.entity';
import { CampaignStatus, CampaignType } from './campaign.types';
export interface CampaignFilters {
    clientId?: string;
    status?: CampaignStatus;
    type?: CampaignType;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
}
export interface ICampaignRepository extends IRepository<Campaign> {
    findByClientId(clientId: string, params?: PaginationParams): Promise<PaginatedResult<Campaign>>;
    findByStatus(status: CampaignStatus, params?: PaginationParams): Promise<PaginatedResult<Campaign>>;
    findWithFilters(filters: CampaignFilters, params?: PaginationParams): Promise<PaginatedResult<Campaign>>;
    findActiveCampaigns(): Promise<Campaign[]>;
}
