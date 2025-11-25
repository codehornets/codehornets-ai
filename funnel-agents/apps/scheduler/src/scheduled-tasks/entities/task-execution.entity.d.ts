import { ScheduledTask } from './scheduled-task.entity';
export declare enum ExecutionStatus {
    PENDING = "pending",
    RUNNING = "running",
    SUCCESS = "success",
    FAILED = "failed",
    TIMEOUT = "timeout",
    CANCELLED = "cancelled"
}
export declare class TaskExecution {
    id: string;
    task_id: string;
    task: ScheduledTask;
    status: ExecutionStatus;
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
    error_message?: string;
    error_details?: Record<string, any>;
    result?: Record<string, any>;
    metadata?: Record<string, any>;
    created_at: Date;
}
