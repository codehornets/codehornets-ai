import { PaginationParams, AutomationStatus, TriggerType } from '@funnelagents/domain';

export class ListAutomationsQuery {
  constructor(
    public readonly filters?: {
      status?: AutomationStatus;
      triggerType?: TriggerType;
      clientId?: string;
      search?: string;
    },
    public readonly pagination?: PaginationParams
  ) {}
}

export interface AutomationListDto {
  id: string;
  name: string;
  status: AutomationStatus;
  triggerType: TriggerType;
  actionsCount: number;
  executionCount: number;
  createdAt: Date;
}
