export declare enum FeedbackType {
    QUALITY = "quality",
    SPEED = "speed",
    ACCURACY = "accuracy",
    GENERAL = "general"
}
export declare class CreateAgentFeedbackDto {
    agent_id: string;
    task_id?: string;
    rating: number;
    comment?: string;
    feedback_type: FeedbackType;
    created_by?: string;
}
export declare class UpdateAgentFeedbackDto {
    rating?: number;
    comment?: string;
}
export declare class AgentFeedbackResponseDto {
    id: string;
    agent_id: string;
    task_id?: string;
    rating: number;
    comment?: string;
    feedback_type: FeedbackType;
    created_by?: string;
    created_at: Date;
}
export declare class AgentFeedbackFilterDto {
    agent_id?: string;
    task_id?: string;
    feedback_type?: FeedbackType;
    min_rating?: number;
    max_rating?: number;
}
