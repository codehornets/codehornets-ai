import { IRepository, PaginationParams, PaginatedResult } from '../shared-kernel';
import { Automation } from './automation.entity';
import { AutomationStatus, TriggerType } from './automation.types';
export interface AutomationFilters {
    status?: AutomationStatus;
    triggerType?: TriggerType;
    clientId?: string;
    search?: string;
}
export interface IAutomationRepository extends IRepository<Automation> {
    findByStatus(status: AutomationStatus, params?: PaginationParams): Promise<PaginatedResult<Automation>>;
    findByTriggerType(type: TriggerType): Promise<Automation[]>;
    findActiveAutomations(): Promise<Automation[]>;
    findScheduledAutomations(): Promise<Automation[]>;
    findByClientId(clientId: string, params?: PaginationParams): Promise<PaginatedResult<Automation>>;
    findWithFilters(filters: AutomationFilters, params?: PaginationParams): Promise<PaginatedResult<Automation>>;
}
