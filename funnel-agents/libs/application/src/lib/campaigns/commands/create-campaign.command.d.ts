import { CampaignType } from '@funnelagents/domain';
export declare class CreateCampaignCommand {
    readonly name: string;
    readonly type: CampaignType;
    readonly clientId: string;
    readonly description?: string | undefined;
    readonly budget?: {
        amount: number;
        currency: string;
    } | undefined;
    readonly dateRange?: {
        start: Date;
        end: Date;
    } | undefined;
    constructor(name: string, type: CampaignType, clientId: string, description?: string | undefined, budget?: {
        amount: number;
        currency: string;
    } | undefined, dateRange?: {
        start: Date;
        end: Date;
    } | undefined);
}
export interface CreateCampaignResult {
    id: string;
    name: string;
    type: CampaignType;
    clientId: string;
    status: string;
    createdAt: Date;
}
