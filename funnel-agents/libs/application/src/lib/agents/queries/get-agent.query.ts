import { AgentType, AgentStatus, AgentCapability, AgentConfig, AgentMetrics } from '@funnelagents/domain';

export class GetAgentQuery {
  constructor(public readonly id: string) {}
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
