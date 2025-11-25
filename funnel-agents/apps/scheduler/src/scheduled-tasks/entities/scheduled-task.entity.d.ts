export declare enum TaskType {
    WORKFLOW = "workflow",
    REPORT = "report",
    AGENT = "agent",
    CUSTOM = "custom"
}
export declare enum TaskStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    FAILED = "failed",
    COMPLETED = "completed"
}
export declare class ScheduledTask {
    id: string;
    name: string;
    description?: string;
    cron_expression: string;
    task_type: TaskType;
    target_id?: string;
    enabled: boolean;
    status: TaskStatus;
    last_run_at?: Date;
    next_run_at?: Date;
    run_count: number;
    failure_count: number;
    last_error?: string;
    config?: Record<string, any>;
    created_by?: string;
    max_retries: number;
    timeout_seconds: number;
    created_at: Date;
    updated_at: Date;
}
