import { ClientProxy } from '@nestjs/microservices';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';
export declare class AgentDispatcherService {
    private readonly tasksClient;
    private readonly lockService;
    private readonly logger;
    constructor(tasksClient: ClientProxy, lockService: DistributedLockService);
    /**
     * Dispatch agent task creation/execution with distributed locking
     */
    dispatch(task: ScheduledTask): Promise<any>;
    /**
     * Check if tasks service is available
     */
    isAvailable(): Promise<boolean>;
}
