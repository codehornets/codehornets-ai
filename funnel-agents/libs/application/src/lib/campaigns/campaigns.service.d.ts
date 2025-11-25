import { Campaign, ICampaignRepository, CampaignFilters, CampaignType } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class CampaignsService {
    private readonly campaignRepository;
    constructor(campaignRepository: ICampaignRepository);
    findById(id: string): Promise<Campaign | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Campaign>>;
    findByClientId(clientId: string, params?: PaginationParams): Promise<PaginatedResult<Campaign>>;
    findWithFilters(filters: CampaignFilters, params?: PaginationParams): Promise<PaginatedResult<Campaign>>;
    create(data: {
        name: string;
        description?: string;
        type: CampaignType;
        clientId: string;
        budget?: {
            amount: number;
            currency: string;
        };
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<Campaign>;
    start(id: string): Promise<Campaign>;
    pause(id: string): Promise<Campaign>;
    resume(id: string): Promise<Campaign>;
    complete(id: string): Promise<Campaign>;
    cancel(id: string): Promise<Campaign>;
    delete(id: string): Promise<void>;
}
