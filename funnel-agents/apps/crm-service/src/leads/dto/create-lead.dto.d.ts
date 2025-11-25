export declare class CreateLeadDto {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    status?: 'new' | 'enriched' | 'qualified' | 'contacted' | 'in_conversation' | 'proposal_sent' | 'won' | 'lost';
    score?: number;
    score_breakdown?: {
        icp_fit: number;
        engagement: number;
        recency: number;
        confidence: number;
    };
    source?: string;
    notes?: string;
}
