/**
 * Factory functions for creating test Lead entities
 */
export interface LeadFactoryOptions {
    id?: string;
    workspaceId?: string;
    campaignId?: string;
    agentId?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    source?: string;
    status?: 'new' | 'enriched' | 'qualified' | 'contacted' | 'in_conversation' | 'proposal_sent' | 'won' | 'lost';
    score?: number;
    score_breakdown?: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    tags?: string[];
    metadata?: Record<string, any>;
    notes?: string;
}
export declare function createMockLead(options?: LeadFactoryOptions): {
    id: string;
    workspaceId: string;
    campaignId: string | undefined;
    agentId: string | undefined;
    name: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string | undefined;
    source: string;
    status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
    score: number;
    score_breakdown: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    tags: string[];
    metadata: Record<string, any>;
    notes: string | undefined;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createMockLeads(count: number, baseOptions?: LeadFactoryOptions): {
    id: string;
    workspaceId: string;
    campaignId: string | undefined;
    agentId: string | undefined;
    name: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string | undefined;
    source: string;
    status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
    score: number;
    score_breakdown: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    tags: string[];
    metadata: Record<string, any>;
    notes: string | undefined;
    createdAt: Date;
    updatedAt: Date;
}[];
export declare function createMockQualifiedLead(options?: LeadFactoryOptions): {
    id: string;
    workspaceId: string;
    campaignId: string | undefined;
    agentId: string | undefined;
    name: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string | undefined;
    source: string;
    status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
    score: number;
    score_breakdown: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    tags: string[];
    metadata: Record<string, any>;
    notes: string | undefined;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createMockUnqualifiedLead(options?: LeadFactoryOptions): {
    id: string;
    workspaceId: string;
    campaignId: string | undefined;
    agentId: string | undefined;
    name: string;
    email: string;
    phone: string;
    company: string;
    jobTitle: string | undefined;
    source: string;
    status: "qualified" | "new" | "enriched" | "contacted" | "in_conversation" | "proposal_sent" | "won" | "lost";
    score: number;
    score_breakdown: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    tags: string[];
    metadata: Record<string, any>;
    notes: string | undefined;
    createdAt: Date;
    updatedAt: Date;
};
