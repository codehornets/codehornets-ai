import { BaseDomainEvent } from '../shared-kernel';
import { FeedbackType } from './agent-feedback.entity';
export declare class AgentFeedbackCreatedEvent extends BaseDomainEvent {
    readonly eventType = "agent.feedback.created";
    readonly agentId: string;
    readonly rating: number;
    readonly feedbackType: FeedbackType;
    constructor(feedbackId: string, agentId: string, rating: number, feedbackType: FeedbackType);
}
export declare class AgentFeedbackUpdatedEvent extends BaseDomainEvent {
    readonly eventType = "agent.feedback.updated";
    readonly agentId: string;
    readonly rating: number;
    constructor(feedbackId: string, agentId: string, rating: number);
}
