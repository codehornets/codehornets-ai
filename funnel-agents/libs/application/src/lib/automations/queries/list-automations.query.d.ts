import { PaginationParams, AutomationStatus, TriggerType } from '@funnelagents/domain';
export declare class ListAutomationsQuery {
    readonly filters?: {
        status?: AutomationStatus;
        triggerType?: TriggerType;
        clientId?: string;
        search?: string;
    } | undefined;
    readonly pagination?: PaginationParams | undefined;
    constructor(filters?: {
        status?: AutomationStatus;
        triggerType?: TriggerType;
        clientId?: string;
        search?: string;
    } | undefined, pagination?: PaginationParams | undefined);
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
