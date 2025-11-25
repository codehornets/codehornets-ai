import { BaseDomainEvent } from '../shared-kernel';
import { FeedbackType } from './agent-feedback.entity';

export class AgentFeedbackCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.feedback.created';
  public readonly agentId: string;
  public readonly rating: number;
  public readonly feedbackType: FeedbackType;

  constructor(
    feedbackId: string,
    agentId: string,
    rating: number,
    feedbackType: FeedbackType
  ) {
    super(feedbackId);
    this.agentId = agentId;
    this.rating = rating;
    this.feedbackType = feedbackType;
  }
}

export class AgentFeedbackUpdatedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.feedback.updated';
  public readonly agentId: string;
  public readonly rating: number;

  constructor(
    feedbackId: string,
    agentId: string,
    rating: number
  ) {
    super(feedbackId);
    this.agentId = agentId;
    this.rating = rating;
  }
}
