export interface TasksByDay {
    date: string;
    count: number;
    completed: number;
    failed: number;
}
export declare class TaskAnalyticsDto {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    running: number;
    success_rate: number;
    avg_completion_time: number;
    tasks_by_status: Record<string, number>;
    tasks_by_day: TasksByDay[];
    constructor(data: Partial<TaskAnalyticsDto>);
}
