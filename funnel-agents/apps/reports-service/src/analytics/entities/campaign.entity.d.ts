export declare class CampaignEntity {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    status: string;
    config: Record<string, any>;
    budget: number;
    spent: number;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
