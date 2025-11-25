import { AutomationStatus, AutomationTrigger, AutomationAction } from '@funnelagents/domain';
export declare class GetAutomationQuery {
    readonly id: string;
    constructor(id: string);
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
