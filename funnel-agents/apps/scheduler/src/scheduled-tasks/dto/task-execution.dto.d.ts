import { ExecutionStatus } from '../entities/task-execution.entity';
export declare class CreateTaskExecutionDto {
    task_id: string;
    status?: ExecutionStatus;
    metadata?: Record<string, any>;
}
export declare class UpdateTaskExecutionDto {
    status?: ExecutionStatus;
    error_message?: string;
    error_details?: Record<string, any>;
    result?: Record<string, any>;
}
export declare class TaskExecutionFilterDto {
    task_id?: string;
    status?: ExecutionStatus;
}
