import { AutomationTrigger, AutomationAction } from '@funnelagents/domain';

export class CreateAutomationCommand {
  constructor(
    public readonly name: string,
    public readonly trigger: AutomationTrigger,
    public readonly actions: AutomationAction[],
    public readonly description?: string,
    public readonly clientId?: string
  ) {}
}

export interface CreateAutomationResult {
  id: string;
  name: string;
  status: string;
  actionsCount: number;
  createdAt: Date;
}
