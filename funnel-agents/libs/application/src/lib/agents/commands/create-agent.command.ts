import { AgentType, AgentCapability, AgentConfig } from '@funnelagents/domain';

export class CreateAgentCommand {
  constructor(
    public readonly name: string,
    public readonly type: AgentType,
    public readonly capabilities: AgentCapability[],
    public readonly config: AgentConfig,
    public readonly description?: string
  ) {}
}

export interface CreateAgentResult {
  id: string;
  name: string;
  type: AgentType;
  status: string;
  createdAt: Date;
}
