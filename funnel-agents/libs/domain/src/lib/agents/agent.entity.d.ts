import { AggregateRoot, UniqueId } from '../shared-kernel';
import { AgentType, AgentDomain, AgentStatus, AgentCapability, AgentConfig, AgentMetrics } from './agent.types';
export interface AgentProps {
    name: string;
    type: AgentType;
    domain: AgentDomain;
    description?: string;
    status: AgentStatus;
    capabilities: AgentCapability[];
    config: AgentConfig;
    metrics?: AgentMetrics;
    tools?: string[];
}
export declare class Agent extends AggregateRoot<AgentProps> {
    private constructor();
    get name(): string;
    get type(): AgentType;
    get domain(): AgentDomain;
    get description(): string | undefined;
    get tools(): string[];
    get status(): AgentStatus;
    get capabilities(): AgentCapability[];
    get config(): AgentConfig;
    get metrics(): AgentMetrics | undefined;
    static create(props: Omit<AgentProps, 'status' | 'metrics'>, id?: UniqueId): Agent;
    updateTools(tools: string[]): void;
    addTool(tool: string): void;
    removeTool(tool: string): void;
    static reconstitute(props: AgentProps, id: UniqueId): Agent;
    activate(): void;
    deactivate(): void;
    markBusy(): void;
    markIdle(): void;
    markError(): void;
    updateConfig(config: Partial<AgentConfig>): void;
    addCapability(capability: AgentCapability): void;
    removeCapability(capabilityName: string): void;
    recordTaskCompletion(executionTimeMs: number, success: boolean): void;
}
