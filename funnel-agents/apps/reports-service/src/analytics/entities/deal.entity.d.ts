export declare class DealEntity {
    id: string;
    workspaceId: string;
    leadId: string;
    agentId: string;
    title: string;
    amount: number;
    status: string;
    stage: number;
    expectedCloseDate: Date;
    closedAt: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
