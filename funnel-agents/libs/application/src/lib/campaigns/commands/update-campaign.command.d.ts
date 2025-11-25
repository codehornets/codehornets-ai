export declare class UpdateCampaignCommand {
    readonly id: string;
    readonly name?: string | undefined;
    readonly description?: string | undefined;
    readonly budget?: {
        amount: number;
        currency: string;
    } | undefined;
    readonly dateRange?: {
        start: Date;
        end: Date;
    } | undefined;
    constructor(id: string, name?: string | undefined, description?: string | undefined, budget?: {
        amount: number;
        currency: string;
    } | undefined, dateRange?: {
        start: Date;
        end: Date;
    } | undefined);
}
export interface UpdateCampaignResult {
    id: string;
    name: string;
    updatedAt: Date;
}
