export declare class LeadEntity {
    id: string;
    workspaceId: string;
    campaignId: string;
    agentId: string;
    email: string;
    name: string;
    phone: string;
    company: string;
    status: string;
    source: string;
    score: number;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
