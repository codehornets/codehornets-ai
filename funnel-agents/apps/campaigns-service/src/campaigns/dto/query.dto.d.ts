import { PaginationDto } from '@funnelagents/interfaces';
import { CampaignStatus, CampaignPriority } from '../entities/campaign.entity';
export declare class CampaignQueryDto extends PaginationDto {
    workspace_id?: string;
    status?: CampaignStatus;
    priority?: CampaignPriority;
    search?: string;
}
export declare class CampaignTemplateQueryDto extends PaginationDto {
    category?: string;
    is_public?: boolean;
    search?: string;
}
