import { Entity } from '../shared-kernel';

export interface AgentMetricsProps {
  agentId: string;
  executionId: string;
  taskType: string;
  executionTime: number;
  success: boolean;
  tokensUsed?: number;
  modelCalls?: number;
  errorCode?: string;
  errorMessage?: string;
  inputSize?: number;
  outputSize?: number;
  timestamp: Date;
}

export class AgentMetrics extends Entity<AgentMetricsProps> {
  private constructor(props: AgentMetricsProps, id?: string) {
    super(props, id);
  }

  get agentId(): string {
    return this.props.agentId;
  }

  get executionId(): string {
    return this.props.executionId;
  }

  get taskType(): string {
    return this.props.taskType;
  }

  get executionTime(): number {
    return this.props.executionTime;
  }

  get success(): boolean {
    return this.props.success;
  }

  get tokensUsed(): number | undefined {
    return this.props.tokensUsed;
  }

  get modelCalls(): number | undefined {
    return this.props.modelCalls;
  }

  get errorCode(): string | undefined {
    return this.props.errorCode;
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  public static create(props: AgentMetricsProps): AgentMetrics {
    return new AgentMetrics(props);
  }

  public static reconstitute(props: AgentMetricsProps, id: string): AgentMetrics {
    return new AgentMetrics(props, id);
  }
}
