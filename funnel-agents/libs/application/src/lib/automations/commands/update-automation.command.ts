import { AutomationTrigger, AutomationAction } from '@funnelagents/domain';

export class UpdateAutomationCommand {
  constructor(
    public readonly id: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly trigger?: AutomationTrigger
  ) {}
}

export class AddAutomationActionCommand {
  constructor(
    public readonly automationId: string,
    public readonly action: AutomationAction
  ) {}
}

export interface UpdateAutomationResult {
  id: string;
  name: string;
  updatedAt: Date;
}
