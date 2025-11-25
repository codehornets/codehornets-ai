import { PaginationParams, CampaignStatus, CampaignType } from '@funnelagents/domain';
export declare class ListCampaignsQuery {
    readonly filters?: {
        clientId?: string;
        status?: CampaignStatus;
        type?: CampaignType;
        search?: string;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        clientId?: string;
        status?: CampaignStatus;
        type?: CampaignType;
        search?: string;
    } | undefined, pagination?: PaginationParams | undefined);
}
export interface CampaignListDto {
    id: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    clientId: string;
    createdAt: Date;
}
