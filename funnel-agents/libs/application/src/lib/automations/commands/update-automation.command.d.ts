import { AutomationTrigger, AutomationAction } from '@funnelagents/domain';
export declare class UpdateAutomationCommand {
    readonly id: string;
    readonly name?: string | undefined;
    readonly description?: string | undefined;
    readonly trigger?: AutomationTrigger | undefined;
    constructor(id: string, name?: string | undefined, description?: string | undefined, trigger?: AutomationTrigger | undefined);
}
export declare class AddAutomationActionCommand {
    readonly automationId: string;
    readonly action: AutomationAction;
    constructor(automationId: string, action: AutomationAction);
}
export interface UpdateAutomationResult {
    id: string;
    name: string;
    updatedAt: Date;
}
