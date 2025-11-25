export declare class FeedbackEntity {
    id: string;
    agentId: string;
    taskId: string;
    workspaceId: string;
    rating: number;
    comment: string;
    userId: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
