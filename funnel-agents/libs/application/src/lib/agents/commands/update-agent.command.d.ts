import { AgentConfig, AgentCapability } from '@funnelagents/domain';
export declare class UpdateAgentConfigCommand {
    readonly id: string;
    readonly config: Partial<AgentConfig>;
    constructor(id: string, config: Partial<AgentConfig>);
}
export declare class AddAgentCapabilityCommand {
    readonly id: string;
    readonly capability: AgentCapability;
    constructor(id: string, capability: AgentCapability);
}
export interface UpdateAgentResult {
    id: string;
    name: string;
    updatedAt: Date;
}
