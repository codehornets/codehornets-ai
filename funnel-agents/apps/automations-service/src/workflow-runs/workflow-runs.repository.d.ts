import { Repository } from 'typeorm';
import { WorkflowRun, WorkflowRunStatus } from './entities/workflow-run.entity';
export interface WorkflowRunFilters {
    workflow_id?: string;
    status?: WorkflowRunStatus;
    trigger_type?: string;
}
export declare class WorkflowRunsRepository {
    private readonly repository;
    constructor(repository: Repository<WorkflowRun>);
    findAll(filters?: WorkflowRunFilters): Promise<WorkflowRun[]>;
    findById(id: string): Promise<WorkflowRun | null>;
    create(workflowRun: Partial<WorkflowRun>): Promise<WorkflowRun>;
    update(id: string, updates: Partial<WorkflowRun>): Promise<WorkflowRun | null>;
    delete(id: string): Promise<void>;
}
