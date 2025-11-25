import { TaskType } from '../entities/scheduled-task.entity';
export declare class CreateScheduledTaskDto {
    name: string;
    description?: string;
    cron_expression: string;
    task_type: TaskType;
    target_id?: string;
    enabled?: boolean;
    config?: Record<string, any>;
    created_by?: string;
    max_retries?: number;
    timeout_seconds?: number;
}
