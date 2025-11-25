export declare class FilterDealDto {
    stage?: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    workspace_id?: string;
    contact_id?: string;
    page?: number;
    limit?: number;
}
