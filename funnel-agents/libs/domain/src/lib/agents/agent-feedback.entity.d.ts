import { AggregateRoot, UniqueId } from '../shared-kernel';
export declare enum FeedbackType {
    QUALITY = "quality",
    SPEED = "speed",
    ACCURACY = "accuracy",
    GENERAL = "general"
}
export interface AgentFeedbackProps {
    agentId: string;
    taskId?: string;
    rating: number;
    comment?: string;
    feedbackType: FeedbackType;
    createdBy?: string;
}
export declare class AgentFeedback extends AggregateRoot<AgentFeedbackProps> {
    private constructor();
    get agentId(): string;
    get taskId(): string | undefined;
    get rating(): number;
    get comment(): string | undefined;
    get feedbackType(): FeedbackType;
    get createdBy(): string | undefined;
    static create(props: AgentFeedbackProps, id?: UniqueId): AgentFeedback;
    static reconstitute(props: AgentFeedbackProps, id: UniqueId): AgentFeedback;
    updateComment(comment: string): void;
    updateRating(rating: number): void;
}
