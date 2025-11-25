import { AggregateRoot, UniqueId } from '../shared-kernel';
import { AgentTuningAppliedEvent } from './agent-tuning.events';

export enum TuningType {
  PROMPT = 'prompt',
  PARAMETERS = 'parameters',
  SKILLS = 'skills',
  MODEL = 'model',
}

export interface AgentPerformanceTuningProps {
  agentId: string;
  tuningType: TuningType;
  beforeValue?: Record<string, any>;
  afterValue?: Record<string, any>;
  performanceDelta?: number;
  notes?: string;
  appliedAt?: Date;
}

export class AgentPerformanceTuning extends AggregateRoot<AgentPerformanceTuningProps> {
  private constructor(props: AgentPerformanceTuningProps, id?: UniqueId) {
    super(props, id);
  }

  get agentId(): string {
    return this.props.agentId;
  }

  get tuningType(): TuningType {
    return this.props.tuningType;
  }

  get beforeValue(): Record<string, any> | undefined {
    return this.props.beforeValue;
  }

  get afterValue(): Record<string, any> | undefined {
    return this.props.afterValue;
  }

  get performanceDelta(): number | undefined {
    return this.props.performanceDelta;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get appliedAt(): Date | undefined {
    return this.props.appliedAt;
  }

  public static create(props: AgentPerformanceTuningProps, id?: UniqueId): AgentPerformanceTuning {
    const tuning = new AgentPerformanceTuning(props, id);
    return tuning;
  }

  public static reconstitute(
    props: AgentPerformanceTuningProps,
    id: UniqueId
  ): AgentPerformanceTuning {
    return new AgentPerformanceTuning(props, id);
  }

  public apply(performanceDelta?: number): void {
    this.props.appliedAt = new Date();
    if (performanceDelta !== undefined) {
      this.props.performanceDelta = performanceDelta;
    }
    this.touch();
    this.addDomainEvent(
      new AgentTuningAppliedEvent(
        this.id.value,
        this.agentId,
        this.tuningType,
        this.performanceDelta
      )
    );
  }

  public updatePerformanceDelta(delta: number): void {
    this.props.performanceDelta = delta;
    this.touch();
  }

  public updateNotes(notes: string): void {
    this.props.notes = notes;
    this.touch();
  }
}
