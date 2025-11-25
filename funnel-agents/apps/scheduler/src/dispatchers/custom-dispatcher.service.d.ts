import { ScheduledTask } from '../scheduled-tasks/entities/scheduled-task.entity';
import { DistributedLockService } from '@funnelagents/infrastructure';
export declare class CustomDispatcherService {
    private readonly lockService;
    private readonly logger;
    constructor(lockService: DistributedLockService);
    /**
     * Dispatch custom scheduled task with distributed locking
     * This is a placeholder for custom task logic
     */
    dispatch(task: ScheduledTask): Promise<any>;
    /**
     * Execute webhook call
     */
    private executeWebhook;
    /**
     * Execute custom script
     */
    private executeScript;
    /**
     * Send notification
     */
    private sendNotification;
}
