export declare class Deal {
    id: string;
    name: string;
    workspaceId?: string;
    contactId?: string;
    value: number;
    stage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    expectedCloseDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
