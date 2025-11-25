import { BaseDomainEvent } from '../shared-kernel';
import { AgentType, AgentDomain, AgentStatus } from './agent.types';
export declare class AgentCreatedEvent extends BaseDomainEvent {
    readonly eventType = "agent.created";
    readonly name: string;
    readonly type: AgentType;
    readonly domain: AgentDomain;
    constructor(agentId: string, name: string, type: AgentType, domain: AgentDomain);
}
export declare class AgentStatusChangedEvent extends BaseDomainEvent {
    readonly eventType = "agent.status_changed";
    readonly previousStatus: AgentStatus;
    readonly newStatus: AgentStatus;
    constructor(agentId: string, previousStatus: AgentStatus, newStatus: AgentStatus);
}
export declare class AgentTaskCompletedEvent extends BaseDomainEvent {
    readonly eventType = "agent.task_completed";
    readonly taskId: string;
    readonly success: boolean;
    readonly executionTimeMs: number;
    constructor(agentId: string, taskId: string, success: boolean, executionTimeMs: number);
}
