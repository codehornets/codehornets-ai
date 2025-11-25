export declare class FilterLeadDto {
    status?: 'new' | 'enriched' | 'qualified' | 'contacted' | 'in_conversation' | 'proposal_sent' | 'won' | 'lost';
    source?: string;
    minScore?: number;
    maxScore?: number;
    search?: string;
    page?: number;
    limit?: number;
}
