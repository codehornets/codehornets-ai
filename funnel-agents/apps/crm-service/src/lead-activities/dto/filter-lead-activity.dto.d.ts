export declare class FilterLeadActivityDto {
    lead_id?: string;
    type?: 'call' | 'email' | 'meeting' | 'note' | 'ai_action' | 'status_change';
    page?: number;
    limit?: number;
}
