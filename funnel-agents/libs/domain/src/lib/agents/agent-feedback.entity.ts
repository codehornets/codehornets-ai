import { AggregateRoot, UniqueId } from '../shared-kernel';
import { AgentFeedbackCreatedEvent } from './agent-feedback.events';

export enum FeedbackType {
  QUALITY = 'quality',
  SPEED = 'speed',
  ACCURACY = 'accuracy',
  GENERAL = 'general',
}

export interface AgentFeedbackProps {
  agentId: string;
  taskId?: string;
  rating: number; // 1-5
  comment?: string;
  feedbackType: FeedbackType;
  createdBy?: string;
}

export class AgentFeedback extends AggregateRoot<AgentFeedbackProps> {
  private constructor(props: AgentFeedbackProps, id?: UniqueId) {
    super(props, id);
  }

  get agentId(): string {
    return this.props.agentId;
  }

  get taskId(): string | undefined {
    return this.props.taskId;
  }

  get rating(): number {
    return this.props.rating;
  }

  get comment(): string | undefined {
    return this.props.comment;
  }

  get feedbackType(): FeedbackType {
    return this.props.feedbackType;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  public static create(props: AgentFeedbackProps, id?: UniqueId): AgentFeedback {
    // Validate rating is between 1 and 5
    if (props.rating < 1 || props.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const feedback = new AgentFeedback(props, id);
    feedback.addDomainEvent(
      new AgentFeedbackCreatedEvent(
        feedback.id.value,
        feedback.agentId,
        feedback.rating,
        feedback.feedbackType
      )
    );
    return feedback;
  }

  public static reconstitute(props: AgentFeedbackProps, id: UniqueId): AgentFeedback {
    return new AgentFeedback(props, id);
  }

  public updateComment(comment: string): void {
    this.props.comment = comment;
    this.touch();
  }

  public updateRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    this.props.rating = rating;
    this.touch();
  }
}
