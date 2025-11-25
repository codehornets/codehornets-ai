export declare class CreateDealDto {
    name: string;
    workspace_id?: string;
    contact_id?: string;
    value: number;
    stage?: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
    expected_close_date?: Date;
    notes?: string;
}
