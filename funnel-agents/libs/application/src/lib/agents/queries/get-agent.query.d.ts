import { AgentType, AgentStatus, AgentCapability, AgentConfig, AgentMetrics } from '@funnelagents/domain';
export declare class GetAgentQuery {
    readonly id: string;
    constructor(id: string);
}
export interface AgentDto {
    id: string;
    name: string;
    type: AgentType;
    description?: string;
    status: AgentStatus;
    capabilities: AgentCapability[];
    config: AgentConfig;
    metrics?: AgentMetrics;
    createdAt: Date;
    updatedAt: Date;
}
