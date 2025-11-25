import { ClientProxy } from '@nestjs/microservices';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';
export declare class WorkflowDispatcherService {
    private readonly automationsClient;
    private readonly lockService;
    private readonly logger;
    constructor(automationsClient: ClientProxy, lockService: DistributedLockService);
    /**
     * Dispatch workflow execution to automations service
     * Uses distributed locking to prevent duplicate workflow executions
     */
    dispatch(task: ScheduledTask): Promise<any>;
    /**
     * Check if workflow service is available
     */
    isAvailable(): Promise<boolean>;
}
