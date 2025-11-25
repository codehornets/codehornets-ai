import { Lead } from '@funnelagents/domain';
export declare class LeadActivity {
    id: string;
    leadId: string;
    lead: Lead;
    type: 'call' | 'email' | 'meeting' | 'note' | 'ai_action' | 'status_change';
    description: string;
    metadata?: Record<string, any>;
    createdAt: Date;
}
