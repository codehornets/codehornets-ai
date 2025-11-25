export declare class FilterClientFeedbackDto {
    workspace_id?: string;
    contact_id?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    status?: 'new' | 'in_review' | 'addressed' | 'closed';
    page?: number;
    limit?: number;
}
