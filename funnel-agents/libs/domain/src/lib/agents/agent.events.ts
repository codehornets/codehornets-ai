import { BaseDomainEvent } from '../shared-kernel';
import { AgentType, AgentDomain, AgentStatus } from './agent.types';

export class AgentCreatedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.created';
  public readonly name: string;
  public readonly type: AgentType;
  public readonly domain: AgentDomain;

  constructor(agentId: string, name: string, type: AgentType, domain: AgentDomain) {
    super(agentId);
    this.name = name;
    this.type = type;
    this.domain = domain;
  }
}

export class AgentStatusChangedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.status_changed';
  public readonly previousStatus: AgentStatus;
  public readonly newStatus: AgentStatus;

  constructor(agentId: string, previousStatus: AgentStatus, newStatus: AgentStatus) {
    super(agentId);
    this.previousStatus = previousStatus;
    this.newStatus = newStatus;
  }
}

export class AgentTaskCompletedEvent extends BaseDomainEvent {
  public readonly eventType = 'agent.task_completed';
  public readonly taskId: string;
  public readonly success: boolean;
  public readonly executionTimeMs: number;

  constructor(agentId: string, taskId: string, success: boolean, executionTimeMs: number) {
    super(agentId);
    this.taskId = taskId;
    this.success = success;
    this.executionTimeMs = executionTimeMs;
  }
}
