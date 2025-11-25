import { AgentType, AgentCapability, AgentConfig } from '@funnelagents/domain';
export declare class CreateAgentCommand {
    readonly name: string;
    readonly type: AgentType;
    readonly capabilities: AgentCapability[];
    readonly config: AgentConfig;
    readonly description?: string | undefined;
    constructor(name: string, type: AgentType, capabilities: AgentCapability[], config: AgentConfig, description?: string | undefined);
}
export interface CreateAgentResult {
    id: string;
    name: string;
    type: AgentType;
    status: string;
    createdAt: Date;
}
