import { Automation, IAutomationRepository, AutomationFilters, AutomationTrigger, AutomationAction } from '@funnelagents/domain';
import { PaginationParams, PaginatedResult } from '@funnelagents/domain';
export declare class AutomationsService {
    private readonly automationRepository;
    constructor(automationRepository: IAutomationRepository);
    findById(id: string): Promise<Automation | null>;
    findAll(params?: PaginationParams): Promise<PaginatedResult<Automation>>;
    findActive(): Promise<Automation[]>;
    findWithFilters(filters: AutomationFilters, params?: PaginationParams): Promise<PaginatedResult<Automation>>;
    create(data: {
        name: string;
        description?: string;
        clientId?: string;
        trigger: AutomationTrigger;
        actions: AutomationAction[];
    }): Promise<Automation>;
    activate(id: string): Promise<Automation>;
    pause(id: string): Promise<Automation>;
    archive(id: string): Promise<Automation>;
    addAction(id: string, action: AutomationAction): Promise<Automation>;
    removeAction(id: string, actionId: string): Promise<Automation>;
    recordExecution(id: string): Promise<Automation>;
    delete(id: string): Promise<void>;
}
