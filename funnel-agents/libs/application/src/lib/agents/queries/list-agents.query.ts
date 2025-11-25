import { PaginationParams, AgentType, AgentStatus } from '@funnelagents/domain';

export class ListAgentsQuery {
  constructor(
    public readonly filters?: {
      type?: AgentType;
      status?: AgentStatus;
      search?: string;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface AgentListDto {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  tasksCompleted: number;
  successRate: number;
  createdAt: Date;
}
