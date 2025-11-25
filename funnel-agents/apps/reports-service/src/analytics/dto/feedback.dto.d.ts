export declare class CreateFeedbackDto {
    agentId: string;
    workspaceId: string;
    taskId?: string;
    rating: number;
    comment?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export declare class FeedbackStatsDto {
    agentId: string;
    totalFeedback: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
    trend: {
        date: string;
        averageRating: number;
        count: number;
    }[];
}
