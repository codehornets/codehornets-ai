import { Repository } from 'typeorm';
import { Task, ITaskRepository, TaskSearchParams, TaskStatus, TaskPriority, PaginationParams, PaginatedResult } from '@funnelagents/domain';
import { TaskDbEntity } from '../entities/task.entity';
import { BaseRepository } from '../base.repository';
export declare class TaskRepository extends BaseRepository<TaskDbEntity, Task> implements ITaskRepository {
    constructor(repository: Repository<TaskDbEntity>);
    findByStatus(status: TaskStatus, params?: PaginationParams): Promise<PaginatedResult<Task>>;
    findByAgent(agentId: string, params?: PaginationParams): Promise<PaginatedResult<Task>>;
    findByWorkspace(workspaceId: string, params?: PaginationParams): Promise<PaginatedResult<Task>>;
    findByCampaign(campaignId: string, params?: PaginationParams): Promise<PaginatedResult<Task>>;
    findByPriority(priority: TaskPriority, params?: PaginationParams): Promise<PaginatedResult<Task>>;
    findScheduledTasks(before: Date, params?: PaginationParams): Promise<PaginatedResult<Task>>;
    search(searchParams: TaskSearchParams): Promise<PaginatedResult<Task>>;
    countByStatus(status: TaskStatus): Promise<number>;
    countByAgent(agentId: string): Promise<number>;
    findNextAvailable(agentId?: string): Promise<Task | null>;
    findRunningTasks(agentId?: string): Promise<Task[]>;
    findPendingRetries(): Promise<Task[]>;
    protected toDomain(entity: TaskDbEntity): Task;
    protected toDatabase(domain: Task): Partial<TaskDbEntity>;
}
