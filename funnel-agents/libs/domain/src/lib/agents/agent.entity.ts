import { AggregateRoot, UniqueId } from '../shared-kernel';
import { AgentType, AgentStatus, AgentCapability, AgentConfig, AgentMetrics } from './agent.types';
import { AgentCreatedEvent, AgentStatusChangedEvent } from './agent.events';

export interface AgentProps {
  name: string;
  type: AgentType;
  description?: string;
  status: AgentStatus;
  capabilities: AgentCapability[];
  config: AgentConfig;
  metrics?: AgentMetrics;
}

export class Agent extends AggregateRoot<AgentProps> {
  private constructor(props: AgentProps, id?: UniqueId) {
    super(props, id);
  }

  get name(): string {
    return this.props.name;
  }

  get type(): AgentType {
    return this.props.type;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): AgentStatus {
    return this.props.status;
  }

  get capabilities(): AgentCapability[] {
    return this.props.capabilities;
  }

  get config(): AgentConfig {
    return this.props.config;
  }

  get metrics(): AgentMetrics | undefined {
    return this.props.metrics;
  }

  public static create(
    props: Omit<AgentProps, 'status' | 'metrics'>,
    id?: UniqueId
  ): Agent {
    const agent = new Agent(
      {
        ...props,
        status: AgentStatus.OFFLINE,
        metrics: {
          tasksCompleted: 0,
          averageExecutionTime: 0,
          successRate: 100,
        },
      },
      id
    );
    agent.addDomainEvent(new AgentCreatedEvent(agent.id.value, agent.name, agent.type));
    return agent;
  }

  public static reconstitute(props: AgentProps, id: UniqueId): Agent {
    return new Agent(props, id);
  }

  public activate(): void {
    const previousStatus = this.props.status;
    this.props.status = AgentStatus.IDLE;
    this.touch();
    this.addDomainEvent(new AgentStatusChangedEvent(this.id.value, previousStatus, AgentStatus.IDLE));
  }

  public deactivate(): void {
    const previousStatus = this.props.status;
    this.props.status = AgentStatus.OFFLINE;
    this.touch();
    this.addDomainEvent(new AgentStatusChangedEvent(this.id.value, previousStatus, AgentStatus.OFFLINE));
  }

  public markBusy(): void {
    this.props.status = AgentStatus.BUSY;
    this.touch();
  }

  public markIdle(): void {
    this.props.status = AgentStatus.IDLE;
    if (this.props.metrics) {
      this.props.metrics.lastActiveAt = new Date();
    }
    this.touch();
  }

  public markError(): void {
    this.props.status = AgentStatus.ERROR;
    this.touch();
  }

  public updateConfig(config: Partial<AgentConfig>): void {
    this.props.config = { ...this.props.config, ...config };
    this.touch();
  }

  public addCapability(capability: AgentCapability): void {
    const exists = this.props.capabilities.some((c) => c.name === capability.name);
    if (!exists) {
      this.props.capabilities.push(capability);
      this.touch();
    }
  }

  public removeCapability(capabilityName: string): void {
    this.props.capabilities = this.props.capabilities.filter((c) => c.name !== capabilityName);
    this.touch();
  }

  public recordTaskCompletion(executionTimeMs: number, success: boolean): void {
    if (!this.props.metrics) {
      this.props.metrics = {
        tasksCompleted: 0,
        averageExecutionTime: 0,
        successRate: 100,
      };
    }

    const metrics = this.props.metrics;
    const totalTasks = metrics.tasksCompleted + 1;
    const successfulTasks = Math.round((metrics.successRate / 100) * metrics.tasksCompleted) + (success ? 1 : 0);

    metrics.averageExecutionTime =
      (metrics.averageExecutionTime * metrics.tasksCompleted + executionTimeMs) / totalTasks;
    metrics.tasksCompleted = totalTasks;
    metrics.successRate = (successfulTasks / totalTasks) * 100;
    metrics.lastActiveAt = new Date();

    this.touch();
  }
}
