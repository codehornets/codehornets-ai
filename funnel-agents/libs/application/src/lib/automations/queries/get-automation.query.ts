import { AutomationStatus, AutomationTrigger, AutomationAction } from '@funnelagents/domain';

export class GetAutomationQuery {
  constructor(public readonly id: string) {}
}

export interface AutomationDto {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  clientId?: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  executionCount: number;
  lastExecutedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
