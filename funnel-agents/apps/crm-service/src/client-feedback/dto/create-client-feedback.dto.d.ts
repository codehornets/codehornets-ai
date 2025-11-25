export declare class CreateClientFeedbackDto {
    workspace_id: string;
    contact_id?: string;
    subject: string;
    feedback: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    rating?: number;
    status?: 'new' | 'in_review' | 'addressed' | 'closed';
    response?: string;
    metadata?: Record<string, any>;
}
