import { BaseDomainEvent } from '../shared-kernel';
import { TuningType } from './agent-tuning.entity';

export class AgentTuningAppliedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.tuning.applied';
  public readonly agentId: string;
  public readonly tuningType: TuningType;
  public readonly performanceDelta?: number;

  constructor(
    tuningId: string,
    agentId: string,
    tuningType: TuningType,
    performanceDelta?: number
  ) {
    super(tuningId);
    this.agentId = agentId;
    this.tuningType = tuningType;
    this.performanceDelta = performanceDelta;
  }
}

export class AgentTuningCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.tuning.created';
  public readonly agentId: string;
  public readonly tuningType: TuningType;

  constructor(
    tuningId: string,
    agentId: string,
    tuningType: TuningType
  ) {
    super(tuningId);
    this.agentId = agentId;
    this.tuningType = tuningType;
  }
}
