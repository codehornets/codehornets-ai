import { AutomationTrigger, AutomationAction } from '@funnelagents/domain';
export declare class CreateAutomationCommand {
    readonly name: string;
    readonly trigger: AutomationTrigger;
    readonly actions: AutomationAction[];
    readonly description?: string | undefined;
    readonly clientId?: string | undefined;
    constructor(name: string, trigger: AutomationTrigger, actions: AutomationAction[], description?: string | undefined, clientId?: string | undefined);
}
export interface CreateAutomationResult {
    id: string;
    name: string;
    status: string;
    actionsCount: number;
    createdAt: Date;
}
