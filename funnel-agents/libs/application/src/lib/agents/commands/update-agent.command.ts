import { AgentConfig, AgentCapability } from '@funnelagents/domain';

export class UpdateAgentConfigCommand {
  constructor(
    public readonly id: string,
    public readonly config: Partial<AgentConfig>
  ) {}
}

export class AddAgentCapabilityCommand {
  constructor(
    public readonly id: string,
    public readonly capability: AgentCapability
  ) {}
}

export interface UpdateAgentResult {
  id: string;
  name: string;
  updatedAt: Date;
}
