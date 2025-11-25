export declare class CreateLeadActivityDto {
    lead_id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'ai_action' | 'status_change';
    description: string;
    metadata?: Record<string, any>;
}
