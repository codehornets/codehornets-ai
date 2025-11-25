import { ClientProxy } from '@nestjs/microservices';
import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';
export declare class ReportDispatcherService {
    private readonly reportsClient;
    private readonly lockService;
    private readonly logger;
    constructor(reportsClient: ClientProxy, lockService: DistributedLockService);
    /**
     * Dispatch report generation with distributed locking
     */
    dispatch(task: ScheduledTask): Promise<any>;
    /**
     * Check if reports service is available
     */
    isAvailable(): Promise<boolean>;
}
