export declare class ClientFeedback {
    id: string;
    workspaceId: string;
    contactId?: string;
    subject: string;
    feedback: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    rating?: number;
    status: 'new' | 'in_review' | 'addressed' | 'closed';
    response?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
