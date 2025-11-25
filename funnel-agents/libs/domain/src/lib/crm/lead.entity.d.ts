export declare class Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    status: 'new' | 'enriched' | 'qualified' | 'contacted' | 'in_conversation' | 'proposal_sent' | 'won' | 'lost';
    score?: number;
    score_breakdown?: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    source?: string;
    notes?: string;
    tags?: string[];
    metadata?: Record<string, any>;
    workspaceId?: string;
    campaignId?: string;
    agentId?: string;
    createdAt: Date;
    updatedAt: Date;
}
